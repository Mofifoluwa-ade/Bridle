//! Regression tests for the security audit. Each test asserts the SAFE behaviour.
use super::*;

fn mandate_with(chains: Vec<Chain>, allow: Vec<Recipient>, deposit: u128) -> (Bridle, Mandate) {
    ctx("owner.testnet", 0, T0);
    let mut c = Bridle::new(acct("exec.testnet"));
    ctx("owner.testnet", deposit, T0);
    let m = c.create_mandate(
        acct("agent.testnet"), chains, vec!["usdc".into()], allow,
        U128(25_000_000), U128(50_000_000), U128(20_000_000), 600, U128(NEAR), 7,
    );
    (c, m)
}

// ── A: revoke and bond withdrawal never scan proposals ──

#[test]
fn a_revoke_does_not_touch_proposals_and_dead_ones_close_one_by_one() {
    let (mut c, id) = setup();
    let ready = propose(&mut c, id, 18_000_000, ADDR, T0);
    let waiting = propose(&mut c, id, 24_000_000, ADDR, T0);
    ctx("owner.testnet", 0, T0);
    c.revoke(id);
    assert_eq!(c.get_proposal(ready.id).unwrap().status, ProposalStatus::Ready);
    ctx("anyone.testnet", 0, T0);
    c.close_dead_proposal(ready.id);
    c.close_dead_proposal(waiting.id);
    assert_eq!(c.get_proposal(ready.id).unwrap().status, ProposalStatus::Cancelled);
    assert_eq!(c.get_mandate(id).unwrap().spent_today.0, 0);
}

#[test]
#[should_panic(expected = "mandate is still active")]
fn a_active_mandates_proposals_cannot_be_closed() {
    let (mut c, id) = setup();
    let p = propose(&mut c, id, 18_000_000, ADDR, T0);
    ctx("anyone.testnet", 0, T0);
    c.close_dead_proposal(p.id);
}

// ── B: timeout clock starts when signing starts ──

#[test]
#[should_panic(expected = "signing has not timed out yet")]
fn b_late_execute_cannot_be_timed_out_immediately() {
    let (mut c, id) = setup();
    let p = propose(&mut c, id, 18_000_000, ADDR, T0);
    let later = T0 + 2 * 3600 * SEC_NS;
    ctx("anyone.testnet", 0, later);
    c.execute(p.id);
    ctx("attacker.testnet", 0, later);
    c.timeout_signing(p.id);
}

#[test]
fn b_timeout_still_works_an_hour_after_signing_starts() {
    let (mut c, id) = setup();
    let p = propose(&mut c, id, 18_000_000, ADDR, T0);
    ctx("anyone.testnet", 0, T0);
    c.execute(p.id);
    ctx("anyone.testnet", 0, T0 + 3601 * SEC_NS);
    c.timeout_signing(p.id);
    assert_eq!(c.get_proposal(p.id).unwrap().status, ProposalStatus::Expired);
}

// ── C: failure report after a signature keeps the budget spent ──

#[test]
fn c_failure_after_signature_keeps_budget_spent() {
    let (mut c, p) = signing_proposal();
    request(&mut c, p.id, 0);
    ctx("exec.testnet", 0, T0);
    let _ = c.on_signed(p.id, Ok(sig(0)));
    ctx("exec.testnet", 0, T0);
    c.report_failure(p.id, "claimed failure".into());
    assert_eq!(c.get_mandate(p.mandate_id).unwrap().spent_today.0, 18_000_000);
}

#[test]
fn c_failure_without_signature_still_refunds() {
    let (mut c, p) = signing_proposal();
    ctx("exec.testnet", 0, T0);
    c.report_failure(p.id, "could not sign".into());
    assert_eq!(c.get_mandate(p.mandate_id).unwrap().spent_today.0, 0);
}

// ── D: dead proposals do not lock the agent bond ──

#[test]
fn d_expired_mandate_does_not_lock_bond() {
    let (mut c, id) = setup();
    let _p = propose(&mut c, id, 18_000_000, ADDR, T0);
    ctx("agent.testnet", 0, T0 + 8 * DAY_NS);
    let _ = c.withdraw_bond(id);
    assert_eq!(c.get_mandate(id).unwrap().bond_posted.0, 0);
}

#[test]
#[should_panic(expected = "proposals are still in flight")]
fn d_a_signing_proposal_still_locks_the_bond() {
    let (mut c, p) = signing_proposal();
    ctx("owner.testnet", 0, T0);
    c.revoke(p.mandate_id);
    ctx("agent.testnet", 0, T0);
    let _ = c.withdraw_bond(p.mandate_id);
}

#[test]
#[should_panic(expected = "proposals are still in flight")]
fn d_a_flagged_proposal_still_locks_the_bond() {
    let (mut c, id) = setup();
    let p = propose(&mut c, id, 24_000_000, ADDR, T0);
    ctx("watcher.testnet", NEAR / 10, T0 + SEC_NS);
    c.flag(p.id, "looks wrong".into());
    ctx("owner.testnet", 0, T0 + 2 * SEC_NS);
    c.revoke(id);
    ctx("agent.testnet", 0, T0 + 3 * SEC_NS);
    let _ = c.withdraw_bond(id);
}

#[test]
fn d_holds_return_to_zero_after_every_way_out() {
    let (mut c, id) = setup();
    // flag -> dismiss -> execute -> report_execution
    let p = propose(&mut c, id, 24_000_000, ADDR, T0);
    ctx("watcher.testnet", NEAR / 10, T0 + SEC_NS);
    c.flag(p.id, "x".into());
    ctx("owner.testnet", 0, T0 + 2 * SEC_NS);
    c.resolve_flag(p.id, false);
    ctx("anyone.testnet", 0, T0 + 3 * SEC_NS);
    c.execute(p.id);
    ctx("exec.testnet", 0, T0 + 3 * SEC_NS);
    c.report_execution(p.id, "0xabc".into());
    // flag -> confirm
    let q = propose(&mut c, id, 24_000_000, ADDR, T0 + 4 * SEC_NS);
    ctx("watcher.testnet", NEAR / 10, T0 + 5 * SEC_NS);
    c.flag(q.id, "x".into());
    ctx("owner.testnet", 0, T0 + 6 * SEC_NS);
    c.resolve_flag(q.id, true);
    // flag -> expire (the confirmed slash above used the bond up; the agent posts it again)
    ctx("agent.testnet", NEAR, T0 + 6 * SEC_NS);
    c.post_bond(id);
    let r = propose(&mut c, id, 24_000_000, ADDR, T0 + 7 * SEC_NS);
    ctx("watcher.testnet", NEAR / 10, T0 + 8 * SEC_NS);
    c.flag(r.id, "x".into());
    ctx("anyone.testnet", 0, T0 + 8 * SEC_NS + 601 * SEC_NS);
    c.expire_flag(r.id);
    // execute -> timeout
    let s = propose(&mut c, id, 1_000_000, ADDR, T0 + 700 * SEC_NS);
    ctx("anyone.testnet", 0, T0 + 700 * SEC_NS);
    c.execute(s.id);
    ctx("anyone.testnet", 0, T0 + 700 * SEC_NS + 3601 * SEC_NS);
    c.timeout_signing(s.id);
    assert_eq!(c.holds.get(&id).copied().unwrap_or(99), 0);
}

// ── E: storage is paid by the mandate, not by the contract ──

#[test]
#[should_panic(expected = "attach NEAR for the mandate's storage")]
fn e_a_mandate_cannot_be_created_without_paying_for_storage() {
    let _ = mandate_with(vec![Chain::Base], vec![], 0);
}

#[test]
fn e_proposal_storage_is_charged_to_the_reserve() {
    let (mut c, id) = setup();
    let before = c.get_storage_reserve(id).0;
    let _ = propose(&mut c, id, 1_000_000, ADDR, T0);
    let after = c.get_storage_reserve(id).0;
    assert_eq!(before - after, (PROPOSAL_BYTES + SIGNING_RECORD_BYTES) as u128 * env::storage_byte_cost().as_yoctonear());
}

#[test]
fn e_spam_stops_when_the_reserve_is_gone() {
    // Minimum deposit: the reserve covers a bounded number of proposals, then the agent is refused.
    let (mut c, m) = mandate_with(vec![Chain::Base], vec![], MIN_STORAGE_RESERVE + NEAR / 10);
    let mut accepted = 0u32;
    for i in 0..2000u32 {
        if i % 40 == 0 {
            ctx("agent.testnet", 0, T0);
        }
        let r = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            c.propose_payment(m.id, Chain::Base, "USDC".into(), U128(0), "x".into());
        }));
        if r.is_err() {
            break;
        }
        accepted += 1;
    }
    println!("spam proposals accepted before the reserve ran out: {accepted}");
    assert!(accepted < 2000, "spam was never stopped");
    let reserve_left = c.get_storage_reserve(m.id).0;
    assert!(reserve_left < PROPOSAL_BYTES as u128 * env::storage_byte_cost().as_yoctonear(), "reserve not drained");
}

#[test]
fn e_owner_tops_up_and_reclaims_after_the_mandate_ends() {
    let (mut c, id) = setup();
    ctx("owner.testnet", NEAR, T0);
    c.fund_storage(id);
    let r = c.get_storage_reserve(id).0;
    ctx("owner.testnet", 0, T0);
    c.revoke(id);
    let _ = c.withdraw_storage_reserve(id, U128(r));
    assert_eq!(c.get_storage_reserve(id).0, 0);
}

#[test]
#[should_panic(expected = "unlocks after revoke or expiry")]
fn e_reserve_stays_while_the_mandate_is_live() {
    let (mut c, id) = setup();
    ctx("owner.testnet", 0, T0);
    let _ = c.withdraw_storage_reserve(id, U128(1));
}

// ── F: the owner can always get Base USDC back out ──

#[test]
fn f_owner_withdraws_base_usdc_after_the_mandate_expired() {
    let (mut c, id) = setup();
    let later = T0 + 8 * DAY_NS;
    ctx("owner.testnet", 0, later);
    let p = c.owner_withdraw_base(id, U128(40_000_000), ADDR.into());
    assert_eq!(p.status, ProposalStatus::Signing);
    ctx("exec.testnet", 0, later);
    let _ = c.request_signature(p.id, 0, U128(2_000_000), U128(1_000_000), 100_000);
    let rec = c.get_signing(p.id).unwrap();
    assert!(rec.unsigned_tx.contains(&evm::hex(&evm::parse_address(ADDR).unwrap())));
    // never counted against the agent's daily budget, before or after
    assert_eq!(c.get_mandate(id).unwrap().spent_today.0, 0);
}

#[test]
fn f_owner_withdrawal_works_after_revoke_and_ignores_the_caps() {
    let (mut c, id) = setup();
    ctx("owner.testnet", 0, T0);
    c.revoke(id);
    let p = c.owner_withdraw_base(id, U128(999_000_000), ADDR.into());
    ctx("exec.testnet", 0, T0);
    let _ = c.request_signature(p.id, 0, U128(2_000_000), U128(1_000_000), 100_000);
    ctx("exec.testnet", 0, T0);
    c.report_failure(p.id, "x".into());
    assert_eq!(c.get_mandate(id).unwrap().spent_today.0, 0, "a sweep must never change the budget");
}

#[test]
#[should_panic(expected = "only the owner can withdraw")]
fn f_only_the_owner_can_withdraw() {
    let (mut c, id) = setup();
    ctx("agent.testnet", 0, T0);
    let _ = c.owner_withdraw_base(id, U128(1), ADDR.into());
}

#[test]
#[should_panic(expected = "mandate is revoked")]
fn f_agent_payments_are_still_refused_after_revoke() {
    // only owner withdrawals get through; a normal Signing proposal does not
    let (mut c, p) = signing_proposal();
    ctx("owner.testnet", 0, T0);
    c.revoke(p.mandate_id);
    request(&mut c, p.id, 0);
}

// ── G: smaller fixes ──

#[test]
#[should_panic(expected = "allowlist has an invalid EVM address")]
fn g_allowlist_rejects_malformed_evm_addresses() {
    let bad = vec![Recipient { chain: Chain::Base, address: "0x1234".into() }];
    let _ = mandate_with(vec![Chain::Base], bad, NEAR / 5);
}

#[test]
fn g_flagging_is_never_free() {
    ctx("owner.testnet", 0, T0);
    let mut c = Bridle::new(acct("exec.testnet"));
    ctx("owner.testnet", NEAR / 5, T0);
    let m = c.create_mandate(
        acct("agent.testnet"), vec![Chain::Base], vec!["usdc".into()],
        vec![Recipient { chain: Chain::Base, address: ADDR.into() }],
        U128(25_000_000), U128(50_000_000), U128(20_000_000), 600, U128(0), 7,
    );
    let p = propose(&mut c, m.id, 24_000_000, ADDR, T0);
    let r = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        ctx("watcher.testnet", 0, T0 + SEC_NS);
        c.flag(p.id, "free grief".into());
    }));
    assert!(r.is_err(), "a zero-bond flag was accepted");
}

#[test]
fn g_unsignable_proposals_are_rejected_up_front() {
    let (mut c, id) = setup();
    ctx("agent.testnet", 0, T0);
    let sol = c.propose_payment(id, Chain::Solana, "USDC".into(), U128(1), ADDR.into());
    assert_eq!(sol.status, ProposalStatus::Rejected);
    let (mut c2, m) = mandate_with(vec![Chain::Base], vec![Recipient { chain: Chain::Base, address: ADDR.into() }], NEAR / 5);
    ctx("agent.testnet", 0, T0);
    let _ = &mut c2;
    let _ = m;
}

#[test]
fn g_the_burn_share_stays_in_the_contract() {
    let (mut c, id) = setup();
    let p = propose(&mut c, id, 24_000_000, ADDR, T0);
    ctx("watcher.testnet", NEAR / 10, T0 + SEC_NS);
    c.flag(p.id, "x".into());
    ctx("owner.testnet", 0, T0 + 2 * SEC_NS);
    c.resolve_flag(p.id, true);
    assert_eq!(c.get_burned().0, NEAR * 30 / 100);
}

// ── H: the owner can approve a held payment without waiting ──

#[test]
fn h_owner_approves_a_held_payment_early() {
    let (mut c, id) = setup();
    let p = propose(&mut c, id, 24_000_000, ADDR, T0);
    assert_eq!(c.get_proposal(p.id).unwrap().status, ProposalStatus::Waiting);
    ctx("owner.testnet", 0, T0 + 1);
    c.execute(p.id);
    assert_eq!(c.get_proposal(p.id).unwrap().status, ProposalStatus::Signing);
}

#[test]
#[should_panic(expected = "still in the challenge window")]
fn h_nobody_else_can_skip_the_window() {
    let (mut c, id) = setup();
    let p = propose(&mut c, id, 24_000_000, ADDR, T0);
    ctx("anyone.testnet", 0, T0 + 1);
    c.execute(p.id);
}

#[test]
#[should_panic(expected = "still in the challenge window")]
fn h_the_agent_cannot_skip_the_window() {
    let (mut c, id) = setup();
    let p = propose(&mut c, id, 24_000_000, ADDR, T0);
    ctx("agent.testnet", 0, T0 + 1);
    c.execute(p.id);
}
