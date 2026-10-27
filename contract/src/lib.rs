//! Bridle: policy contract. An agent proposes payments; the contract checks them against an
//! owner-signed mandate, holds large ones in a challenge window, and lets watchers flag them.
//!
//! What this file does: every rule in the spec up to the moment a payment is cleared to sign.
//! What it does not do yet: build chain transactions and call the MPC signer. That is the
//! day-one spike (see README). `execute` marks a proposal `Signing` and emits an event; a
//! registered executor reports the final tx hash with `report_execution`.

use near_sdk::json_types::{U128, U64};
use near_sdk::store::IterableMap;
use near_sdk::{
    env, near, require, AccountId, BorshStorageKey, NearToken, PanicOnDefault, Promise,
};

const DAY_NS: u64 = 86_400 * 1_000_000_000;
const SEC_NS: u64 = 1_000_000_000;
const MIN_WINDOW_S: u64 = 60;
const MAX_WINDOW_S: u64 = 86_400;
const MAX_EXPIRY_DAYS: u64 = 30;
const MAX_ALLOWLIST: usize = 50;
// Valid implicit account nobody holds a key for: slashed funds sent here are burned.
const BURN_ACCOUNT: &str = "0000000000000000000000000000000000000000000000000000000000000000";

#[near(serializers = [json, borsh])]
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Chain {
    Base,
    Solana,
}

#[near(serializers = [json, borsh])]
#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Recipient {
    pub chain: Chain,
    pub address: String,
}

#[near(serializers = [json, borsh])]
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum MandateState {
    Active,
    Revoked,
}

/// A loosening (higher cap, lower threshold, shorter window) waits one challenge window.
#[near(serializers = [json, borsh])]
#[derive(Clone)]
pub struct PendingLimits {
    pub per_tx_cap: U128,
    pub daily_cap: U128,
    pub cooling_threshold: U128,
    pub challenge_window_s: u64,
    pub effective_at: U64,
}

#[near(serializers = [json, borsh])]
#[derive(Clone)]
pub struct Mandate {
    pub id: u64,
    pub owner: AccountId,
    pub agent: AccountId,
    pub chains: Vec<Chain>,
    pub assets: Vec<String>,
    pub allowlist: Vec<Recipient>,
    /// Amounts are integers in the asset's smallest unit (USDC: 6 decimals).
    pub per_tx_cap: U128,
    pub daily_cap: U128,
    pub cooling_threshold: U128,
    pub challenge_window_s: u64,
    /// Agent bond required, in yoctoNEAR.
    pub bond: U128,
    pub bond_posted: U128,
    pub expires_at: U64,
    pub state: MandateState,
    pub day_index: u64,
    pub spent_today: U128,
    pub created_at: U64,
    pub pending_limits: Option<PendingLimits>,
}

#[near(serializers = [json, borsh])]
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum ProposalStatus {
    /// Blocked by the mandate. `reason` names the rule.
    Rejected,
    /// Above the threshold; waiting out the challenge window.
    Waiting,
    /// At or below the threshold; may be executed now.
    Ready,
    /// A watcher flagged it. Never executes without the owner dismissing the flag.
    Flagged,
    /// Owner confirmed a flag. Agent bond slashed.
    Cancelled,
    /// Owner vetoed it.
    Vetoed,
    /// Flag left unanswered; nothing moved.
    Expired,
    /// Cleared. Waiting for the executor to sign and broadcast.
    Signing,
    Executed,
}

#[near(serializers = [json, borsh])]
#[derive(Clone)]
pub struct Proposal {
    pub id: u64,
    pub mandate_id: u64,
    pub chain: Chain,
    pub asset: String,
    pub amount: U128,
    pub recipient: String,
    pub status: ProposalStatus,
    pub reason: Option<String>,
    pub created_at: U64,
    pub executable_at: U64,
    pub flagger: Option<AccountId>,
    pub flag_reason: Option<String>,
    pub flag_bond: U128,
    pub tx_hash: Option<String>,
}

#[near(serializers = [json])]
pub struct Config {
    pub executor: AccountId,
    pub flag_bond_divisor: u64,
}

#[derive(BorshStorageKey)]
#[near]
enum Key {
    Mandates,
    Proposals,
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct Bridle {
    executor: AccountId,
    next_mandate: u64,
    next_proposal: u64,
    mandates: IterableMap<u64, Mandate>,
    proposals: IterableMap<u64, Proposal>,
}

fn event(name: &str, data: String) {
    env::log_str(&format!(
        "EVENT_JSON:{{\"standard\":\"bridle\",\"version\":\"1.0.0\",\"event\":\"{}\",\"data\":{}}}",
        name, data
    ));
}

#[near]
impl Bridle {
    #[init]
    pub fn new(executor: AccountId) -> Self {
        Self {
            executor,
            next_mandate: 1,
            next_proposal: 1,
            mandates: IterableMap::new(Key::Mandates),
            proposals: IterableMap::new(Key::Proposals),
        }
    }

    // ───────────── owner: mandates ─────────────

    /// Sign a mandate. Empty allowlist denies everything.
    #[allow(clippy::too_many_arguments)]
    pub fn create_mandate(
        &mut self,
        agent: AccountId,
        chains: Vec<Chain>,
        assets: Vec<String>,
        allowlist: Vec<Recipient>,
        per_tx_cap: U128,
        daily_cap: U128,
        cooling_threshold: U128,
        challenge_window_s: u64,
        bond: U128,
        expiry_days: u64,
    ) -> Mandate {
        require!(!chains.is_empty(), "choose at least one chain");
        require!(!assets.is_empty(), "choose at least one asset");
        require!(allowlist.len() <= MAX_ALLOWLIST, "allowlist too long");
        require!(per_tx_cap.0 > 0 && daily_cap.0 >= per_tx_cap.0, "daily cap must be at least the per-payment cap");
        require!(cooling_threshold.0 <= per_tx_cap.0, "threshold must not exceed the per-payment cap");
        require!(
            (MIN_WINDOW_S..=MAX_WINDOW_S).contains(&challenge_window_s),
            "challenge window must be 60 to 86400 seconds"
        );
        require!(expiry_days >= 1 && expiry_days <= MAX_EXPIRY_DAYS, "expiry must be 1 to 30 days");
        for r in &allowlist {
            require!(chains.contains(&r.chain), "allowlist uses a chain the mandate does not allow");
            require!(!r.address.trim().is_empty() && r.address.len() <= 128, "bad recipient address");
        }
        let now = env::block_timestamp();
        let id = self.next_mandate;
        self.next_mandate += 1;
        let m = Mandate {
            id,
            owner: env::predecessor_account_id(),
            agent,
            chains,
            assets: assets.into_iter().map(|a| a.to_uppercase()).collect(),
            allowlist,
            per_tx_cap,
            daily_cap,
            cooling_threshold,
            challenge_window_s,
            bond,
            bond_posted: U128(0),
            expires_at: U64(now + expiry_days * DAY_NS),
            state: MandateState::Active,
            day_index: now / DAY_NS,
            spent_today: U128(0),
            created_at: U64(now),
            pending_limits: None,
        };
        self.mandates.insert(id, m.clone());
        event("mandate_created", format!("{{\"id\":{},\"owner\":\"{}\",\"agent\":\"{}\"}}", id, m.owner, m.agent));
        m
    }

    /// Instant revoke. Anything not yet signed stops.
    pub fn revoke(&mut self, mandate_id: u64) {
        let mut m = self.mandate(mandate_id);
        require!(env::predecessor_account_id() == m.owner, "only the owner can revoke");
        m.state = MandateState::Revoked;

        // Cancel any in-flight proposals that have not yet been signed so the agent bond does not stay locked
        let in_flight_ids: Vec<u64> = self
            .proposals
            .values()
            .filter(|p| {
                p.mandate_id == mandate_id
                    && matches!(
                        p.status,
                        ProposalStatus::Waiting | ProposalStatus::Ready | ProposalStatus::Flagged
                    )
            })
            .map(|p| p.id)
            .collect();

        for pid in in_flight_ids {
            let mut p = self.proposal(pid);
            let had_flag = p.status == ProposalStatus::Flagged;
            self.refund_budget(&mut m, &p);
            if had_flag {
                self.refund_flagger(&mut p);
            }
            p.status = ProposalStatus::Cancelled;
            p.reason = Some("Mandate revoked by owner".into());
            self.proposals.insert(pid, p);
        }

        self.mandates.insert(mandate_id, m);
        event("mandate_revoked", format!("{{\"id\":{}}}", mandate_id));
    }

    /// Tightening applies now. Any loosening waits one challenge window.
    pub fn update_limits(
        &mut self,
        mandate_id: u64,
        per_tx_cap: U128,
        daily_cap: U128,
        cooling_threshold: U128,
        challenge_window_s: u64,
    ) {
        let mut m = self.mandate(mandate_id);
        require!(env::predecessor_account_id() == m.owner, "only the owner can change limits");
        require!(m.state == MandateState::Active, "mandate is revoked");
        require!(daily_cap.0 >= per_tx_cap.0 && per_tx_cap.0 > 0, "daily cap must be at least the per-payment cap");
        require!(cooling_threshold.0 <= per_tx_cap.0, "threshold must not exceed the per-payment cap");
        require!(
            (MIN_WINDOW_S..=MAX_WINDOW_S).contains(&challenge_window_s),
            "challenge window must be 60 to 86400 seconds"
        );
        let loosens = per_tx_cap.0 > m.per_tx_cap.0
            || daily_cap.0 > m.daily_cap.0
            || cooling_threshold.0 > m.cooling_threshold.0
            || challenge_window_s < m.challenge_window_s;
        if loosens {
            let at = env::block_timestamp() + m.challenge_window_s * SEC_NS;
            m.pending_limits = Some(PendingLimits {
                per_tx_cap,
                daily_cap,
                cooling_threshold,
                challenge_window_s,
                effective_at: U64(at),
            });
            event("limits_loosening_queued", format!("{{\"id\":{},\"effective_at\":\"{}\"}}", mandate_id, at));
        } else {
            m.per_tx_cap = per_tx_cap;
            m.daily_cap = daily_cap;
            m.cooling_threshold = cooling_threshold;
            m.challenge_window_s = challenge_window_s;
            m.pending_limits = None;
            event("limits_tightened", format!("{{\"id\":{}}}", mandate_id));
        }
        self.mandates.insert(mandate_id, m);
    }

    /// Anyone can apply a queued loosening once its delay has passed.
    pub fn apply_pending_limits(&mut self, mandate_id: u64) {
        let mut m = self.mandate(mandate_id);
        let p = m.pending_limits.clone().unwrap_or_else(|| env::panic_str("nothing pending"));
        require!(env::block_timestamp() >= p.effective_at.0, "delay has not passed");
        m.per_tx_cap = p.per_tx_cap;
        m.daily_cap = p.daily_cap;
        m.cooling_threshold = p.cooling_threshold;
        m.challenge_window_s = p.challenge_window_s;
        m.pending_limits = None;
        self.mandates.insert(mandate_id, m);
        event("limits_applied", format!("{{\"id\":{}}}", mandate_id));
    }

    // ───────────── agent ─────────────

    /// The agent posts its bond. Required before it can propose.
    #[payable]
    pub fn post_bond(&mut self, mandate_id: u64) {
        let mut m = self.mandate(mandate_id);
        require!(env::predecessor_account_id() == m.agent, "only the agent posts the bond");
        m.bond_posted = U128(m.bond_posted.0 + env::attached_deposit().as_yoctonear());
        self.mandates.insert(mandate_id, m);
    }

    /// The agent's only tool. Records the decision either way: blocked proposals are stored with
    /// the rule that stopped them.
    pub fn propose_payment(
        &mut self,
        mandate_id: u64,
        chain: Chain,
        asset: String,
        amount: U128,
        recipient: String,
    ) -> Proposal {
        let mut m = self.mandate(mandate_id);
        require!(env::predecessor_account_id() == m.agent, "only the mandate's agent can propose");
        let now = env::block_timestamp();
        self.roll_day(&mut m, now);
        self.apply_due_limits(&mut m, now);
        let asset = asset.to_uppercase();

        let block: Option<String> = if m.state == MandateState::Revoked {
            Some("The mandate is revoked".into())
        } else if now >= m.expires_at.0 {
            Some("The mandate has expired".into())
        } else if m.bond_posted.0 < m.bond.0 {
            Some("The agent bond is not fully posted".into())
        } else if !m.chains.contains(&chain) {
            Some("Chain is not allowed by the mandate".into())
        } else if !m.assets.contains(&asset) {
            Some("Asset is not allowed by the mandate".into())
        } else if !m.allowlist.iter().any(|r| r.chain == chain && r.address == recipient) {
            Some("Recipient is not on the allowlist".into())
        } else if amount.0 == 0 {
            Some("Amount must be above zero".into())
        } else if amount.0 > m.per_tx_cap.0 {
            Some("Over the per-payment cap".into())
        } else if m.spent_today.0 + amount.0 > m.daily_cap.0 {
            Some("Over the daily cap".into())
        } else {
            None
        };

        let id = self.next_proposal;
        self.next_proposal += 1;
        let (status, executable_at) = match &block {
            Some(_) => (ProposalStatus::Rejected, now),
            None if amount.0 > m.cooling_threshold.0 => {
                (ProposalStatus::Waiting, now + m.challenge_window_s * SEC_NS)
            }
            None => (ProposalStatus::Ready, now),
        };
        if block.is_none() {
            m.spent_today = U128(m.spent_today.0 + amount.0);
        }
        let p = Proposal {
            id,
            mandate_id,
            chain,
            asset,
            amount,
            recipient,
            status,
            reason: block,
            created_at: U64(now),
            executable_at: U64(executable_at),
            flagger: None,
            flag_reason: None,
            flag_bond: U128(0),
            tx_hash: None,
        };
        self.mandates.insert(mandate_id, m);
        self.proposals.insert(id, p.clone());
        event("proposal", format!("{{\"id\":{},\"mandate\":{},\"status\":\"{:?}\"}}", id, mandate_id, status));
        p
    }

    /// After a revoke or expiry, with nothing left in flight, the agent takes its bond back.
    pub fn withdraw_bond(&mut self, mandate_id: u64) -> Promise {
        let mut m = self.mandate(mandate_id);
        require!(env::predecessor_account_id() == m.agent, "only the agent can withdraw");
        require!(
            m.state == MandateState::Revoked || env::block_timestamp() >= m.expires_at.0,
            "bond unlocks after revoke or expiry"
        );
        require!(
            !self.proposals.values().any(|p| p.mandate_id == mandate_id
                && matches!(
                    p.status,
                    ProposalStatus::Waiting
                        | ProposalStatus::Ready
                        | ProposalStatus::Flagged
                        | ProposalStatus::Signing
                )),
            "proposals are still in flight"
        );
        let amt = m.bond_posted.0;
        require!(amt > 0, "no bond posted");
        m.bond_posted = U128(0);
        self.mandates.insert(mandate_id, m.clone());
        Promise::new(m.agent).transfer(NearToken::from_yoctonear(amt))
    }

    // ───────────── watchers ─────────────

    /// Flag a waiting proposal. The watcher stakes a bond of one tenth of the agent bond.
    #[payable]
    pub fn flag(&mut self, proposal_id: u64, reason: String) {
        let mut p = self.proposal(proposal_id);
        let m = self.mandate(p.mandate_id);
        require!(p.status == ProposalStatus::Waiting, "only waiting proposals can be flagged");
        require!(env::block_timestamp() < p.executable_at.0, "challenge window has closed");
        require!(!reason.trim().is_empty() && reason.len() <= 280, "give a short reason");
        let need = m.bond.0 / 10;
        require!(env::attached_deposit().as_yoctonear() >= need, "attach the watcher bond");
        p.status = ProposalStatus::Flagged;
        p.flagger = Some(env::predecessor_account_id());
        p.flag_reason = Some(reason);
        p.flag_bond = U128(env::attached_deposit().as_yoctonear());
        // Owner gets a full window to answer from the moment of the flag.
        p.executable_at = U64(env::block_timestamp() + m.challenge_window_s * SEC_NS);
        self.proposals.insert(proposal_id, p);
        event("flagged", format!("{{\"id\":{}}}", proposal_id));
    }

    // ───────────── owner: decisions ─────────────

    pub fn veto(&mut self, proposal_id: u64) {
        let mut p = self.proposal(proposal_id);
        let mut m = self.mandate(p.mandate_id);
        require!(env::predecessor_account_id() == m.owner, "only the owner can veto");
        require!(
            matches!(p.status, ProposalStatus::Waiting | ProposalStatus::Ready | ProposalStatus::Flagged),
            "too late to veto"
        );
        let had_flag = p.status == ProposalStatus::Flagged;
        self.refund_budget(&mut m, &p);
        p.status = ProposalStatus::Vetoed;
        self.mandates.insert(p.mandate_id, m);
        // A vetoed flagged proposal: the flag was right, so refund the watcher's bond.
        if had_flag {
            self.refund_flagger(&mut p);
        }
        self.proposals.insert(proposal_id, p);
        event("vetoed", format!("{{\"id\":{}}}", proposal_id));
    }

    /// Owner answers a flag. `confirm = true`: cancel it and slash the agent bond (40% watcher,
    /// 30% owner, 30% burned). `confirm = false`: dismiss it; the watcher's bond goes to the agent.
    pub fn resolve_flag(&mut self, proposal_id: u64, confirm: bool) {
        let mut p = self.proposal(proposal_id);
        let mut m = self.mandate(p.mandate_id);
        require!(env::predecessor_account_id() == m.owner, "only the owner can resolve a flag");
        require!(p.status == ProposalStatus::Flagged, "proposal is not flagged");
        let watcher = p.flagger.clone().unwrap();
        let wbond = p.flag_bond.0;
        if confirm {
            self.refund_budget(&mut m, &p);
            let slash = m.bond_posted.0.min(m.bond.0);
            m.bond_posted = U128(m.bond_posted.0 - slash);
            let to_watcher = slash * 40 / 100;
            let to_owner = slash * 30 / 100;
            let burn = slash - to_watcher - to_owner;
            Promise::new(watcher).transfer(NearToken::from_yoctonear(to_watcher + wbond)).detach();
            Promise::new(m.owner.clone()).transfer(NearToken::from_yoctonear(to_owner)).detach();
            Promise::new(BURN_ACCOUNT.parse().unwrap()).transfer(NearToken::from_yoctonear(burn)).detach();
            p.status = ProposalStatus::Cancelled;
            event("flag_confirmed", format!("{{\"id\":{},\"slashed\":\"{}\"}}", proposal_id, slash));
        } else {
            Promise::new(m.agent.clone()).transfer(NearToken::from_yoctonear(wbond)).detach();
            p.status = ProposalStatus::Waiting;
            p.executable_at = U64(env::block_timestamp()); // already waited; ready now
            event("flag_dismissed", format!("{{\"id\":{}}}", proposal_id));
        }
        p.flag_bond = U128(0);
        self.mandates.insert(p.mandate_id, m);
        self.proposals.insert(proposal_id, p);
    }

    /// Anyone can close a flag the owner never answered. Nothing moves; the watcher is refunded.
    pub fn expire_flag(&mut self, proposal_id: u64) {
        let mut p = self.proposal(proposal_id);
        let mut m = self.mandate(p.mandate_id);
        require!(p.status == ProposalStatus::Flagged, "proposal is not flagged");
        require!(env::block_timestamp() >= p.executable_at.0, "owner still has time to answer");
        self.refund_budget(&mut m, &p);
        self.refund_flagger(&mut p);
        p.status = ProposalStatus::Expired;
        self.mandates.insert(p.mandate_id, m);
        self.proposals.insert(proposal_id, p);
        event("flag_expired", format!("{{\"id\":{}}}", proposal_id));
    }

    // ───────────── execution ─────────────

    /// Permissionless. Clears a proposal for signing once its rules allow it.
    /// INTEGRATION POINT: this is where the chain adapter builds the transaction and calls the
    /// MPC signer. Until the spike is done it only marks the proposal `Signing` and logs an event
    /// that the executor service reads.
    pub fn execute(&mut self, proposal_id: u64) {
        let mut p = self.proposal(proposal_id);
        let m = self.mandate(p.mandate_id);
        require!(m.state == MandateState::Active, "mandate is revoked");
        require!(env::block_timestamp() < m.expires_at.0, "mandate has expired");
        match p.status {
            ProposalStatus::Ready => {}
            ProposalStatus::Waiting => {
                require!(env::block_timestamp() >= p.executable_at.0, "still in the challenge window")
            }
            _ => env::panic_str("proposal cannot be executed"),
        }
        p.status = ProposalStatus::Signing;
        self.proposals.insert(proposal_id, p.clone());
        event(
            "ready_to_sign",
            format!(
                "{{\"id\":{},\"mandate\":{},\"chain\":\"{:?}\",\"asset\":\"{}\",\"amount\":\"{}\",\"recipient\":\"{}\"}}",
                p.id, p.mandate_id, p.chain, p.asset, p.amount.0, p.recipient
            ),
        );
    }

    /// The registered executor reports the broadcast transaction.
    pub fn report_execution(&mut self, proposal_id: u64, tx_hash: String) {
        require!(env::predecessor_account_id() == self.executor, "only the executor can report");
        let mut p = self.proposal(proposal_id);
        require!(p.status == ProposalStatus::Signing, "proposal is not being signed");
        p.status = ProposalStatus::Executed;
        p.tx_hash = Some(tx_hash);
        self.proposals.insert(proposal_id, p);
        event("executed", format!("{{\"id\":{}}}", proposal_id));
    }

    /// The registered executor reports that signing or broadcast failed.
    pub fn report_failure(&mut self, proposal_id: u64, reason: String) {
        require!(env::predecessor_account_id() == self.executor, "only the executor can report");
        let mut p = self.proposal(proposal_id);
        require!(p.status == ProposalStatus::Signing, "proposal is not being signed");
        let mut m = self.mandate(p.mandate_id);
        self.refund_budget(&mut m, &p);
        p.status = ProposalStatus::Cancelled;
        p.reason = Some(reason);
        self.mandates.insert(p.mandate_id, m);
        self.proposals.insert(proposal_id, p);
        event("execution_failed", format!("{{\"id\":{}}}", proposal_id));
    }

    /// If a proposal has been stuck in Signing for over 1 hour, anyone can expire it
    /// so the agent's bond does not remain stuck indefinitely.
    pub fn timeout_signing(&mut self, proposal_id: u64) {
        let mut p = self.proposal(proposal_id);
        require!(p.status == ProposalStatus::Signing, "proposal is not in signing state");
        let timeout_ns = 3600 * SEC_NS;
        require!(
            env::block_timestamp() >= p.executable_at.0 + timeout_ns,
            "signing has not timed out yet"
        );
        let mut m = self.mandate(p.mandate_id);
        self.refund_budget(&mut m, &p);
        p.status = ProposalStatus::Expired;
        p.reason = Some("Signing timed out without execution report".into());
        self.mandates.insert(p.mandate_id, m);
        self.proposals.insert(proposal_id, p);
        event("signing_timed_out", format!("{{\"id\":{}}}", proposal_id));
    }

    // ───────────── views ─────────────

    pub fn get_config(&self) -> Config {
        Config { executor: self.executor.clone(), flag_bond_divisor: 10 }
    }

    pub fn get_mandate(&self, mandate_id: u64) -> Option<Mandate> {
        self.mandates.get(&mandate_id).cloned()
    }

    /// Mandates where the account is the owner or the agent.
    pub fn list_mandates_for(&self, account_id: AccountId, from: u64, limit: u64) -> Vec<Mandate> {
        self.mandates
            .values()
            .filter(|m| m.owner == account_id || m.agent == account_id)
            .skip(from as usize)
            .take(limit.min(100) as usize)
            .cloned()
            .collect()
    }

    pub fn get_proposal(&self, proposal_id: u64) -> Option<Proposal> {
        self.proposals.get(&proposal_id).cloned()
    }

    /// Newest first. `mandate_id = None` lists across all mandates (for watchers).
    pub fn list_proposals(&self, mandate_id: Option<u64>, from: u64, limit: u64) -> Vec<Proposal> {
        let mut v: Vec<&Proposal> = self
            .proposals
            .values()
            .filter(|p| mandate_id.map_or(true, |id| p.mandate_id == id))
            .collect();
        v.sort_by(|a, b| b.id.cmp(&a.id));
        v.into_iter().skip(from as usize).take(limit.min(100) as usize).cloned().collect()
    }

    pub fn count_mandates(&self) -> u64 {
        self.next_mandate - 1
    }

    pub fn count_proposals(&self) -> u64 {
        self.next_proposal - 1
    }

    // ───────────── internals ─────────────

    fn mandate(&self, id: u64) -> Mandate {
        self.mandates.get(&id).cloned().unwrap_or_else(|| env::panic_str("mandate not found"))
    }

    fn proposal(&self, id: u64) -> Proposal {
        self.proposals.get(&id).cloned().unwrap_or_else(|| env::panic_str("proposal not found"))
    }

    fn roll_day(&self, m: &mut Mandate, now: u64) {
        let today = now / DAY_NS;
        if today != m.day_index {
            m.day_index = today;
            m.spent_today = U128(0);
        }
    }

    fn apply_due_limits(&self, m: &mut Mandate, now: u64) {
        if let Some(p) = m.pending_limits.clone() {
            if now >= p.effective_at.0 {
                m.per_tx_cap = p.per_tx_cap;
                m.daily_cap = p.daily_cap;
                m.cooling_threshold = p.cooling_threshold;
                m.challenge_window_s = p.challenge_window_s;
                m.pending_limits = None;
            }
        }
    }

    fn refund_budget(&self, m: &mut Mandate, p: &Proposal) {
        // Only refund within the same UTC day the amount was counted in.
        if p.created_at.0 / DAY_NS == m.day_index {
            m.spent_today = U128(m.spent_today.0.saturating_sub(p.amount.0));
        }
    }

    fn refund_flagger(&self, p: &mut Proposal) {
        if let Some(w) = p.flagger.clone() {
            if p.flag_bond.0 > 0 {
                Promise::new(w).transfer(NearToken::from_yoctonear(p.flag_bond.0)).detach();
            }
        }
        p.flag_bond = U128(0);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::VMContextBuilder;
    use near_sdk::testing_env;

    fn acct(n: &str) -> AccountId {
        n.parse().unwrap()
    }
    fn ctx(who: &str, deposit: u128, ts: u64) {
        testing_env!(VMContextBuilder::new()
            .predecessor_account_id(acct(who))
            .attached_deposit(NearToken::from_yoctonear(deposit))
            .block_timestamp(ts)
            .build());
    }
    const NEAR: u128 = 1_000_000_000_000_000_000_000_000;
    const T0: u64 = 10 * DAY_NS;
    const ADDR: &str = "0x1111111111111111111111111111111111111111";

    /// owner signs a mandate (caps 25/50, threshold 20, window 600s); agent posts the bond.
    fn setup() -> (Bridle, u64) {
        ctx("owner.testnet", 0, T0);
        let mut c = Bridle::new(acct("exec.testnet"));
        let m = c.create_mandate(
            acct("agent.testnet"),
            vec![Chain::Base],
            vec!["usdc".into()],
            vec![Recipient { chain: Chain::Base, address: ADDR.into() }],
            U128(25_000_000),
            U128(50_000_000),
            U128(20_000_000),
            600,
            U128(NEAR),
            7,
        );
        ctx("agent.testnet", NEAR, T0);
        c.post_bond(m.id);
        (c, m.id)
    }
    fn propose(c: &mut Bridle, id: u64, amt: u128, to: &str, ts: u64) -> Proposal {
        ctx("agent.testnet", 0, ts);
        c.propose_payment(id, Chain::Base, "USDC".into(), U128(amt), to.into())
    }

    #[test]
    fn small_payment_is_ready_and_executes() {
        let (mut c, id) = setup();
        let p = propose(&mut c, id, 18_000_000, ADDR, T0);
        assert_eq!(p.status, ProposalStatus::Ready);
        ctx("anyone.testnet", 0, T0);
        c.execute(p.id);
        assert_eq!(c.get_proposal(p.id).unwrap().status, ProposalStatus::Signing);
        ctx("exec.testnet", 0, T0);
        c.report_execution(p.id, "0xabc".into());
        assert_eq!(c.get_proposal(p.id).unwrap().status, ProposalStatus::Executed);
    }

    #[test]
    fn blocked_proposals_name_the_rule() {
        let (mut c, id) = setup();
        let p = propose(&mut c, id, 18_000_000, "0xdead", T0);
        assert_eq!(p.status, ProposalStatus::Rejected);
        assert_eq!(p.reason.as_deref(), Some("Recipient is not on the allowlist"));
        let p = propose(&mut c, id, 26_000_000, ADDR, T0);
        assert_eq!(p.reason.as_deref(), Some("Over the per-payment cap"));
    }

    #[test]
    fn daily_cap_counts_accepted_payments_only() {
        let (mut c, id) = setup();
        assert_eq!(propose(&mut c, id, 20_000_000, ADDR, T0).status, ProposalStatus::Ready);
        assert_eq!(propose(&mut c, id, 20_000_000, ADDR, T0).status, ProposalStatus::Ready);
        let p = propose(&mut c, id, 15_000_000, ADDR, T0);
        assert_eq!(p.reason.as_deref(), Some("Over the daily cap"));
        // next UTC day the counter resets
        assert_eq!(propose(&mut c, id, 20_000_000, ADDR, T0 + DAY_NS).status, ProposalStatus::Ready);
    }

    #[test]
    fn large_payment_waits_for_the_window() {
        let (mut c, id) = setup();
        let p = propose(&mut c, id, 24_000_000, ADDR, T0);
        assert_eq!(p.status, ProposalStatus::Waiting);
        ctx("anyone.testnet", 0, T0 + 599 * SEC_NS);
        assert!(std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            let mut c2 = c.clone_for_test();
            c2.execute(p.id)
        }))
        .is_err());
    }

    #[test]
    fn flag_confirm_slashes_the_bond() {
        let (mut c, id) = setup();
        let p = propose(&mut c, id, 24_000_000, ADDR, T0);
        ctx("watcher.testnet", NEAR / 10, T0 + 5 * SEC_NS);
        c.flag(p.id, "recipient looks wrong".into());
        assert_eq!(c.get_proposal(p.id).unwrap().status, ProposalStatus::Flagged);
        ctx("owner.testnet", 0, T0 + 10 * SEC_NS);
        c.resolve_flag(p.id, true);
        assert_eq!(c.get_proposal(p.id).unwrap().status, ProposalStatus::Cancelled);
        assert_eq!(c.get_mandate(id).unwrap().bond_posted.0, 0);
        // the cancelled amount no longer counts against the day
        assert_eq!(c.get_mandate(id).unwrap().spent_today.0, 0);
    }

    #[test]
    fn flagged_proposal_never_executes_without_dismissal() {
        let (mut c, id) = setup();
        let p = propose(&mut c, id, 24_000_000, ADDR, T0);
        ctx("watcher.testnet", NEAR / 10, T0 + 5 * SEC_NS);
        c.flag(p.id, "check this".into());
        ctx("anyone.testnet", 0, T0 + 5000 * SEC_NS);
        let r = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| c.execute(p.id)));
        assert!(r.is_err());
    }

    #[test]
    fn loosening_is_delayed_and_tightening_is_instant() {
        let (mut c, id) = setup();
        ctx("owner.testnet", 0, T0);
        c.update_limits(id, U128(10_000_000), U128(30_000_000), U128(5_000_000), 600);
        let m = c.get_mandate(id).unwrap();
        assert_eq!(m.per_tx_cap.0, 10_000_000);
        c.update_limits(id, U128(40_000_000), U128(60_000_000), U128(5_000_000), 600);
        let m = c.get_mandate(id).unwrap();
        assert_eq!(m.per_tx_cap.0, 10_000_000);
        assert!(m.pending_limits.is_some());
    }

    #[test]
    fn revoke_blocks_everything() {
        let (mut c, id) = setup();
        let p = propose(&mut c, id, 10_000_000, ADDR, T0);
        ctx("owner.testnet", 0, T0);
        c.revoke(id);
        ctx("anyone.testnet", 0, T0);
        let r = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| c.execute(p.id)));
        assert!(r.is_err());
        assert_eq!(propose(&mut c, id, 1_000_000, ADDR, T0).reason.as_deref(), Some("The mandate is revoked"));
    }

    #[test]
    fn revoke_cancels_in_flight_proposals_and_allows_bond_withdrawal() {
        let (mut c, id) = setup();
        // Waiting proposal (above threshold)
        let p = propose(&mut c, id, 24_000_000, ADDR, T0);
        assert_eq!(p.status, ProposalStatus::Waiting);

        ctx("owner.testnet", 0, T0 + 10 * SEC_NS);
        c.revoke(id);

        // Cancelled by revoke
        assert_eq!(c.get_proposal(p.id).unwrap().status, ProposalStatus::Cancelled);

        // Bond is unlocked and can be withdrawn by agent
        ctx("agent.testnet", 0, T0 + 15 * SEC_NS);
        c.withdraw_bond(id);
        assert_eq!(c.get_mandate(id).unwrap().bond_posted.0, 0);
    }

    impl Bridle {
        fn clone_for_test(&self) -> Bridle {
            let mut c = Bridle::new(self.executor.clone());
            for m in self.mandates.values() { c.mandates.insert(m.id, m.clone()); }
            for p in self.proposals.values() { c.proposals.insert(p.id, p.clone()); }
            c.next_mandate = self.next_mandate;
            c.next_proposal = self.next_proposal;
            c
        }
    }
}
