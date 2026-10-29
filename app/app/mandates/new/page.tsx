"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Btn, Card, Field, HelpButton, HelpDropdown, HelpGuideMenu, Label, Notice, PageHeader, monoInputCls } from "@/components/app/ui";
import { useWallet } from "@/components/app/WalletProvider";
import { CHAINS, CONFIG } from "@/lib/config";
import { duration, formatNearWithUsd, parseNear, parseUnits, usdc, validAddress, validNearAccount } from "@/lib/format";
import type { Chain } from "@/lib/types";

type Row = { chain: Chain; address: string };
type Step = 0 | 1 | 2;

const STEPS = [
  { title: "Agent & recipients", description: "Choose who can request payments and where funds may go." },
  { title: "Spending limits", description: "Set hard caps that constrain every payment." },
  { title: "Review & test", description: "Try sample payments, inspect the policy, then sign when ready." },
];

const STEP_GUIDES = [
  [
    {
      title: "Agent NEAR account",
      description: (
        <p>
          The NEAR testnet account your AI agent operates with. It will be permitted to request payments that satisfy these exact rules.
        </p>
      ),
    },
    {
      title: "Enabled networks",
      description: (
        <p>
          Select which blockchain networks (e.g. Base, Solana, Ethereum) your agent can route USDC to. Any disabled chain is automatically blocked.
        </p>
      ),
    },
    {
      title: "Approved recipient whitelist",
      description: (
        <p>
          Zero-trust address allowlist. Your agent can only transfer funds to addresses registered here, protecting against prompt injection or compromised workflows.
        </p>
      ),
    },
  ],
  [
    {
      title: "Per-payment cap (USDC)",
      description: (
        <p>
          The absolute maximum amount for any single transaction. Requests exceeding this amount are rejected immediately on-chain.
        </p>
      ),
    },
    {
      title: "Daily rolling cap (USDC)",
      description: (
        <p>
          Cumulative spending ceiling within a 24-hour sliding window. Resets automatically every 24 hours.
        </p>
      ),
    },
    {
      title: "Review pause window",
      description: (
        <p>
          Payments larger than your pause threshold remain in challenge status for the specified minutes, allowing you to review or veto them before final execution.
        </p>
      ),
    },
    {
      title: "Agent security deposit",
      description: (
        <p>
          Collateral in testnet NEAR staked by the agent upon rule activation. Can be slashed if the agent attempts fraudulent activity.
        </p>
      ),
    },
  ],
  [
    {
      title: "Local policy preview",
      description: (
        <p>
          Simulate transactions against your draft rules locally in your browser to verify limits and allowlist before on-chain activation.
        </p>
      ),
    },
    {
      title: "On-chain signing",
      description: (
        <p>
          Connect your NEAR testnet wallet and sign a transaction to store your rule on-chain. No real money is spent.
        </p>
      ),
    },
  ],
];

export default function NewMandate() {
  const { accountId } = useWallet();
  return (
    <>
      <PageHeader
        title="New spending rule"
        lead="Set your rules once. Your AI agent can only spend within these limits."
      />

      {/* Testnet Environment Banner */}
      <div className="mb-6 rounded-2xl border border-line dark:border-dark-border bg-paper/60 dark:bg-dark-card/60 p-4 sm:p-5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-mute dark:text-dark-mute">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="flex-none inline-flex items-center gap-1.5 rounded-full bg-accent-tint dark:bg-accent-tint/15 border border-accent/25 px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-wider font-semibold text-accent dark:text-[#46D9A4]">
            <span className="h-1.5 w-1.5 rounded-full bg-accent dark:bg-[#46D9A4]" />
            Testnet live
          </span>
          <span className="text-ink dark:text-white font-medium text-sm">
            NEAR Testnet
          </span>
          <span className="hidden sm:inline text-dim dark:text-dark-dim">·</span>
          <span className="text-amber-600 dark:text-amber-400 font-medium">
            Test tokens only (no real money)
          </span>
        </div>
        <p className="text-[12px] text-mute dark:text-dark-mute sm:text-right max-w-lg leading-relaxed">
          {accountId
            ? "Your spending rule will be deployed to NEAR testnet. Spending limits and deposits are enforced entirely on test tokens."
            : "Preview and configure rule parameters freely. Connect your NEAR testnet wallet when you are ready to activate it."}
        </p>
      </div>

      {!CONFIG.contractId && (
        <Notice tone="warn" title="Preview only · contract not configured">
          You can configure and test a draft below. On-chain creation is unavailable until NEXT_PUBLIC_BRIDLE_CONTRACT is configured.
        </Notice>
      )}
      <Form />
    </>
  );
}

function Form() {
  const { accountId, call, signIn, ready } = useWallet();
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [agent, setAgent] = useState("");
  const [chains, setChains] = useState<Chain[]>(["Base"]);
  const [rows, setRows] = useState<Row[]>([{ chain: "Base", address: "" }]);
  const [perTx, setPerTx] = useState("25");
  const [daily, setDaily] = useState("50");
  const [threshold, setThreshold] = useState("20");
  const [windowMin, setWindowMin] = useState("10");
  const [bond, setBond] = useState("1");
  const [days, setDays] = useState("7");
  const [testAmount, setTestAmount] = useState("10");
  const [testChain, setTestChain] = useState<Chain>("Base");
  const [testRecipient, setTestRecipient] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const v = useMemo(() => {
    const e: Record<string, string> = {};
    if (!validNearAccount(agent)) e.agent = "Enter a valid NEAR account, such as agent.testnet.";
    else if (agent === accountId) e.agent = "Use a separate account for the agent, not your owner account.";
    if (chains.length === 0) e.chains = "Choose at least one network.";
    const p = parseUnits(perTx), d = parseUnits(daily), t = parseUnits(threshold);
    if (p === null || p === BigInt(0)) e.perTx = "Enter an amount greater than zero.";
    if (d === null || d === BigInt(0)) e.daily = "Enter a daily limit greater than zero.";
    else if (p !== null && d < p) e.daily = "Daily limit must be at least the per-payment limit.";
    if (t === null) e.threshold = "Enter a threshold (0 means every payment enters review).";
    else if (p !== null && t > p) e.threshold = "Threshold cannot exceed the per-payment limit.";
    const w = Number(windowMin) * 60;
    if (!Number.isFinite(w) || w < 60 || w > 86400) e.window = "Choose between 1 and 1,440 minutes.";
    const b = parseNear(bond);
    if (b === null || b === BigInt(0)) e.bond = "Enter a deposit greater than zero NEAR.";
    const dy = Number(days);
    if (!Number.isInteger(dy) || dy < 1 || dy > 30) e.days = "Choose a whole number from 1 to 30 days.";

    const filled = rows.map((r, index) => ({ ...r, index })).filter((r) => r.address.trim());
    if (filled.length === 0) e.rows = "Add at least one approved recipient. Payments to other addresses will be blocked.";
    filled.forEach((r) => {
      if (!chains.includes(r.chain)) e[`row${r.index}`] = `${r.chain} is not selected above.`;
      else if (!validAddress(r.chain, r.address.trim())) {
        e[`row${r.index}`] = r.chain === "Base" ? "Enter a 0x address with 40 hexadecimal characters." : "Enter a valid Solana address.";
      }
    });
    return { e, p, d, t, w, b, dy, filled };
  }, [agent, chains, rows, perTx, daily, threshold, windowMin, bond, days, accountId]);

  const ok = Object.keys(v.e).length === 0;
  const filledAddresses = v.filled.map((r) => ({ chain: r.chain, address: r.address.trim() }));
  const testValue = parseUnits(testAmount);
  const testValid = testValue !== null && testValue > BigInt(0);
  const testAllowedRecipient = Boolean(testRecipient.trim()) && filledAddresses.some(
    (r) => r.chain === testChain && r.address.toLowerCase() === testRecipient.trim().toLowerCase()
  );
  const testOutcome = !testValid
    ? "Enter a payment amount above zero."
    : !chains.includes(testChain)
      ? "Blocked: this network is not enabled in the draft."
      : !testAllowedRecipient
        ? "Blocked: recipient is not on the approved list for this network."
        : v.p !== null && testValue > v.p
          ? "Blocked: payment exceeds the per-payment cap."
          : v.t !== null && testValue > v.t
            ? "Review: payment exceeds the review threshold."
            : "Within configured limits: no review threshold is triggered.";
  const testTone = testOutcome.startsWith("Blocked") ? "bad" : testOutcome.startsWith("Review") ? "warn" : "neutral";

  const show = (k: string) => (touched ? v.e[k] : undefined);

  const step0Done = Boolean(
    validNearAccount(agent) &&
    agent !== accountId &&
    chains.length > 0 &&
    v.filled.length > 0 &&
    !v.e.agent &&
    !v.e.chains &&
    !v.e.rows &&
    v.filled.every((r) => !v.e[`row${r.index}`])
  );

  const step1Done = Boolean(
    step0Done &&
    !v.e.perTx &&
    !v.e.daily &&
    !v.e.threshold &&
    !v.e.window &&
    !v.e.bond &&
    !v.e.days
  );

  const isStepAccessible = (target: Step): boolean => {
    if (target === 0) return true;
    if (target === 1) return step0Done;
    if (target === 2) return step0Done && step1Done;
    return false;
  };

  const canContinue = step === 0 ? step0Done : step === 1 ? step1Done : ok;

  const submit = async () => {
    setTouched(true);
    if (!ok || !CONFIG.contractId) return;
    if (!accountId) {
      signIn();
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const hash = await call({
        method: "create_mandate",
        args: {
          agent,
          chains,
          assets: ["USDC"],
          allowlist: filledAddresses,
          per_tx_cap: v.p!.toString(),
          daily_cap: v.d!.toString(),
          cooling_threshold: v.t!.toString(),
          challenge_window_s: v.w,
          bond: v.b!.toString(),
          expiry_days: v.dy,
        },
      });
      router.push(hash ? "/app?transactionHashes=" + hash : "/app");
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-5">
        {!accountId && (
          <div className="rounded-2xl border border-line dark:border-dark-border bg-white dark:bg-dark-card p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-semibold text-ink dark:text-white">
                Preview mode
              </p>
              <p className="text-mute dark:text-dark-mute mt-0.5">
                Configure your rule limits, whitelist, and safety parameters below. Connect a NEAR testnet wallet when you are ready to sign and activate this rule on-chain.
              </p>
            </div>
            <Btn size="sm" onClick={signIn} disabled={!ready} className="shrink-0">
              {ready ? "Connect wallet" : "Loading wallet…"}
            </Btn>
          </div>
        )}

        <Card className="p-4 sm:p-5">
          <div className="grid grid-cols-3 gap-2">
            {STEPS.map((item, i) => {
              const isCurrent = step === i;
              const isAccessible = isStepAccessible(i as Step);
              const isCompleted = (i === 0 && step0Done) || (i === 1 && step1Done);

              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => {
                    if (isAccessible) {
                      setStep(i as Step);
                    } else {
                      setTouched(true);
                    }
                  }}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    isCurrent
                      ? "border-ink bg-ink text-white dark:border-white dark:bg-white dark:text-ink shadow-sm"
                      : isAccessible
                        ? "border-line bg-white text-ink hover:border-ink/50 dark:border-dark-border dark:bg-dark-card dark:text-white"
                        : "border-line/60 bg-paper/50 text-mute/60 dark:border-dark-border/50 dark:bg-dark-card/30 dark:text-dark-mute/50 cursor-not-allowed opacity-60"
                  }`}
                  aria-disabled={!isAccessible}
                  title={
                    !isAccessible
                      ? `Complete Step 0${i} to unlock ${item.title}`
                      : item.title
                  }
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="block font-mono text-[10px] uppercase tracking-wider opacity-75">
                      Step 0{i + 1}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-wider font-semibold">
                      {isCurrent
                        ? "Active"
                        : isCompleted
                          ? "Done"
                          : !isAccessible
                            ? "Locked"
                            : ""}
                    </span>
                  </div>
                  <span className="mt-1 block text-xs sm:text-sm font-semibold truncate">
                    {item.title}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm text-mute dark:text-dark-mute">
            <p>{STEPS[step].description}</p>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <HelpGuideMenu
                buttonLabel={`Step 0${step + 1} Guide`}
                guides={STEP_GUIDES[step]}
              />
            </div>
          </div>
          {step === 0 && !step0Done && touched && (
            <p className="mt-2 text-bad font-medium text-xs">
              Complete agent & recipient address to unlock Step 02
            </p>
          )}
          {step === 1 && !step1Done && touched && (
            <p className="mt-2 text-bad font-medium text-xs">
              Fill in valid spending limits to unlock Step 03
            </p>
          )}
        </Card>

        {step === 0 && (
          <>
            <Card className="space-y-5 p-5 sm:p-7">
              <div className="flex items-center justify-between">
                <Label>01 · Agent account</Label>
              </div>
              <Field
                label="Agent NEAR address"
                help="The NEAR testnet account your AI agent uses. It can only request payments that satisfy your configured rules."
                error={show("agent")}
              >
                <input
                  className={monoInputCls}
                  value={agent}
                  onChange={(e) => setAgent(e.target.value.trim())}
                  placeholder="research-agent.testnet"
                  autoCapitalize="none"
                  spellCheck={false}
                />
              </Field>
              <fieldset>
                <div className="flex items-center gap-2">
                  <legend className="text-[14.5px] font-semibold text-ink dark:text-white">Enabled networks</legend>
                  <HelpButton
                    content="USDC only. A recipient must belong to an enabled network. Cross-chain payments on disabled networks are immediately blocked."
                    title="Enabled Networks"
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {CHAINS.map((c) => (
                    <label
                      key={c}
                      className={`cursor-pointer rounded-full border px-4 py-2.5 text-sm font-semibold transition-all ${
                        chains.includes(c)
                          ? "border-ink bg-ink text-white dark:border-white dark:bg-white dark:text-ink shadow-2xs"
                          : "border-line bg-white text-mute hover:text-ink dark:border-dark-border dark:bg-dark-card dark:text-dark-mute dark:hover:text-white"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={chains.includes(c)}
                        onChange={() =>
                          setChains((old) =>
                            old.includes(c) ? old.filter((x) => x !== c) : [...old, c]
                          )
                        }
                      />
                      {c}
                    </label>
                  ))}
                </div>
                {show("chains") && <p className="mt-2 text-sm text-bad">{v.e.chains}</p>}
              </fieldset>
            </Card>

            <Card className="space-y-4 p-5 sm:p-7">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label>02 · Approved recipients</Label>
                  <HelpButton
                    content="Your agent can only send money to addresses explicitly included on this list. Any other destination address is automatically blocked by the smart contract."
                    title="Recipient Whitelist"
                  />
                </div>
              </div>
              {rows.map((r, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      aria-label={`Recipient ${i + 1} network`}
                      className="rounded-xl border border-rule bg-white px-3 py-3 text-sm text-ink dark:border-dark-border dark:bg-dark-card dark:text-white"
                      value={r.chain}
                      onChange={(e) =>
                        setRows((old) =>
                          old.map((x, j) => (j === i ? { ...x, chain: e.target.value as Chain } : x))
                        )
                      }
                    >
                      {CHAINS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <input
                      aria-label={`Recipient ${i + 1} address`}
                      className={`${monoInputCls} mt-0 min-w-0 flex-1`}
                      value={r.address}
                      placeholder={r.chain === "Base" ? "0x…" : "Solana address"}
                      onChange={(e) =>
                        setRows((old) =>
                          old.map((x, j) => (j === i ? { ...x, address: e.target.value.trim() } : x))
                        )
                      }
                      spellCheck={false}
                    />
                    {rows.length > 1 && (
                      <Btn
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => setRows((old) => old.filter((_, j) => j !== i))}
                      >
                        Remove
                      </Btn>
                    )}
                  </div>
                  {show(`row${i}`) && <p className="text-sm text-bad">{v.e[`row${i}`]}</p>}
                </div>
              ))}
              {show("rows") && <p className="text-sm text-bad">{v.e.rows}</p>}
              {rows.length < 20 && (
                <Btn
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setRows((old) => [...old, { chain: chains[0] ?? "Base", address: "" }])}
                >
                  + Add recipient
                </Btn>
              )}
              <HelpDropdown title="How approved recipient allowlisting protects you">
                <p>
                  Zero-trust security: your AI agent is cryptographically restricted from sending any USDC or initiating cross-chain transactions to addresses not registered on this list.
                </p>
                <p className="mt-1">
                  Even in cases of prompt injection or hijacked agent execution, funds cannot be redirected to attacker-controlled wallets.
                </p>
              </HelpDropdown>
            </Card>
          </>
        )}

        {step === 1 && (
          <>
            <Card className="space-y-5 p-5 sm:p-7">
              <div className="flex items-center justify-between">
                <Label>03 · Spending limits</Label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Max per payment (USDC)"
                  help="The most USDC your agent can send in any single transaction. Requests exceeding this amount are rejected immediately on-chain."
                  error={show("perTx")}
                >
                  <input className={monoInputCls} inputMode="decimal" value={perTx} onChange={(e) => setPerTx(e.target.value)} />
                </Field>
                <Field
                  label="Max per day (USDC)"
                  help="Cumulative spending limit across all payments in a 24-hour rolling window. Resets automatically every 24 hours."
                  error={show("daily")}
                >
                  <input className={monoInputCls} inputMode="decimal" value={daily} onChange={(e) => setDaily(e.target.value)} />
                </Field>
              </div>
              <HelpDropdown title="How spending caps work">
                <p>
                  <strong>Per-payment cap:</strong> Limits the size of any individual payment transaction.
                </p>
                <p className="mt-1">
                  <strong>Daily cap:</strong> Limits total cumulative spending across 24 hours. Both limits must pass for a transaction to succeed.
                </p>
              </HelpDropdown>
            </Card>

            <Card className="space-y-5 p-5 sm:p-7">
              <div className="flex items-center justify-between">
                <Label>04 · Safety & Review time</Label>
              </div>
              <Field
                label="Pause payments above (USDC)"
                help="Transactions larger than this amount will automatically pause in challenge/review status before executing, giving you time to inspect or veto. Set to 0 to review every payment."
                error={show("threshold")}
              >
                <input className={monoInputCls} inputMode="decimal" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
              </Field>
              <Field
                label="Review pause time (minutes)"
                help="How long payments exceeding your pause threshold remain paused in review before auto-executing."
                error={show("window")}
              >
                <input className={monoInputCls} inputMode="numeric" value={windowMin} onChange={(e) => setWindowMin(e.target.value)} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Security deposit (NEAR)"
                  help={v.b ? `Agent deposits ${formatNearWithUsd(v.b)} as collateral to guarantee good behavior.` : "Security deposit collateral required from the agent."}
                  error={show("bond")}
                >
                  <input className={monoInputCls} inputMode="decimal" value={bond} onChange={(e) => setBond(e.target.value)} />
                </Field>
                <Field
                  label="Rule duration (days)"
                  help="How many days this spending rule stays active (1–30 days). Expired rules require renewal."
                  error={show("days")}
                >
                  <input className={monoInputCls} inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)} />
                </Field>
              </div>
              <HelpDropdown title="Understand security deposits & review pauses">
                <p>
                  <strong>Security deposit:</strong> Uses NEAR testnet tokens. The agent must lock collateral which can be slashed upon malicious behavior.
                </p>
                <p className="mt-1">
                  <strong>Review pause:</strong> Payments above your pause threshold enter a challenge window where you can inspect and veto them directly from Bridle Watch.
                </p>
              </HelpDropdown>
            </Card>
          </>
        )}

        {step === 2 && (
          <>
            <Card className="space-y-5 p-5 sm:p-7">
              <div className="flex items-center justify-between">
                <Label>Try a sample payment</Label>
                <HelpButton
                  content="This local preview evaluates your draft rule limits in the browser without calling the smart contract. You can test permitted and blocked cases safely."
                  title="Simulation Preview"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Payment amount (USDC)">
                  <input className={monoInputCls} inputMode="decimal" value={testAmount} onChange={(e) => setTestAmount(e.target.value)} />
                </Field>
                <Field label="Network">
                  <select className={monoInputCls} value={testChain} onChange={(e) => setTestChain(e.target.value as Chain)}>
                    {CHAINS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
              <Field
                label="Recipient address"
                help="Paste an address from your allowlist to test an allowed payment, or enter an unapproved address to test rejection."
              >
                <input className={monoInputCls} value={testRecipient} onChange={(e) => setTestRecipient(e.target.value.trim())} placeholder="Paste a recipient address" spellCheck={false} />
              </Field>
              <Notice tone={testTone as "bad" | "warn" | "neutral"} title="Draft policy result">{testOutcome}</Notice>
              <HelpDropdown title="About this local test simulation">
                This local preview evaluates the draft values in this form. It does not call the contract or guarantee how an on-chain request will be processed, assuming no prior spending today.
              </HelpDropdown>
            </Card>
            <Card className="space-y-4 p-5 sm:p-7">
              <Label>Final review</Label>
              <div className="space-y-3 text-sm">
                <ReviewRow label="Agent" value={agent || "Not set"} />
                <ReviewRow label="Networks" value={chains.join(", ") || "None selected"} />
                <ReviewRow label="Approved recipients" value={`${v.filled.length} configured`} />
                <ReviewRow label="Max per payment" value={v.p !== null ? usdc(v.p) : "Invalid"} />
                <ReviewRow label="Max per day" value={v.d !== null ? usdc(v.d) : "Invalid"} />
                <ReviewRow label="Pause payments above" value={v.t !== null ? usdc(v.t) : "Invalid"} />
                <ReviewRow label="Review pause time" value={Number.isFinite(v.w) ? duration(v.w) : "Invalid"} />
                <ReviewRow label="Security deposit" value={v.b ? formatNearWithUsd(v.b) : "Invalid"} />
                <ReviewRow label="Rule duration" value={v.dy ? `${v.dy} days` : "Invalid"} />
              </div>
            </Card>
          </>
        )}

        {err && <Notice tone="bad" title="The rule was not created">{err}</Notice>}

        <div className="flex items-center justify-between gap-3">
          <Btn variant="outline" disabled={step === 0 || busy} onClick={() => setStep((s) => (s - 1) as Step)}>Back</Btn>
          {step < 2 ? (
            <Btn
              onClick={() => {
                setTouched(true);
                if (canContinue) setStep((s) => (s + 1) as Step);
              }}
            >
              Continue to {step === 0 ? "spending limits" : "review"} →
            </Btn>
          ) : accountId && CONFIG.contractId ? (
            <Btn variant="accent" busy={busy} onClick={submit} disabled={!ok}>Save and activate rule</Btn>
          ) : (
            <Btn variant="accent" onClick={() => { if (!CONFIG.contractId) return; signIn(); }} disabled={!CONFIG.contractId || !ready || !ok}>
              {!CONFIG.contractId ? "Contract not configured" : !ready ? "Loading wallet…" : "Connect wallet to create rule"}
            </Btn>
          )}
        </div>
        {step === 0 && !step0Done && touched && (
          <p className="text-right text-xs text-bad">
            Please enter a valid agent NEAR account and at least one approved recipient before continuing.
          </p>
        )}
        {step === 1 && !step1Done && touched && (
          <p className="text-right text-xs text-bad">
            Please resolve the highlighted limits above before continuing to review.
          </p>
        )}
        {step === 2 && !accountId && CONFIG.contractId && (
          <p className="text-right text-xs text-mute dark:text-dark-mute">
            Your draft stays local. Connect a NEAR testnet wallet only when you are ready to submit it.
          </p>
        )}
      </div>

      <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <Card dark className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-xs uppercase tracking-wider text-dim">Summary of your rule</p>
            <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 font-mono text-[10px] uppercase text-amber-300">Testnet mode</span>
          </div>
          <p className="mt-4 text-lg leading-relaxed text-white"><b>{agent || "Your agent"}</b> can pay <b>USDC</b> on <b>{chains.join(" and ") || "selected chains"}</b>, only to <b>{v.filled.length}</b> approved {v.filled.length === 1 ? "address" : "addresses"}.</p>
          <div className="mt-5 space-y-3 border-t border-night pt-5 text-sm leading-relaxed text-dim">
            <SummaryLine label="Max per payment" value={v.p !== null ? usdc(v.p) : "—"} />
            <SummaryLine label="Max per day" value={v.d !== null ? usdc(v.d) : "—"} />
            <SummaryLine label="Pause above" value={v.t !== null ? usdc(v.t) : "—"} />
            <SummaryLine label="Review pause time" value={Number.isFinite(v.w) ? duration(v.w) : "—"} />
            <SummaryLine label="Security deposit" value={v.b ? formatNearWithUsd(v.b) : "—"} />
            <SummaryLine label="Rule duration" value={v.dy ? `${v.dy} days` : "—"} />
          </div>
          <div className="mt-5 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-200">
            <b className="text-amber-300">Testnet mode</b>
            <p className="mt-1">Values here are a draft. Nothing is submitted until you connect a wallet and sign a transaction.</p>
          </div>

          {step < 2 ? (
            <div className="mt-6 space-y-2">
              <Btn
                variant="accent"
                size="lg"
                className="w-full"
                onClick={() => {
                  setTouched(true);
                  if (canContinue) setStep((s) => (s + 1) as Step);
                }}
              >
                Continue to {step === 0 ? "spending limits" : "review"} →
              </Btn>
              {!canContinue && touched && (
                <p className="text-center text-xs text-amber-300">
                  {step === 0
                    ? "Complete agent & recipient address to unlock step 2."
                    : "Fill in spending limits to unlock step 3."}
                </p>
              )}
            </div>
          ) : accountId && CONFIG.contractId ? (
            <Btn variant="accent" size="lg" className="mt-6 w-full" busy={busy} onClick={submit} disabled={touched && !ok}>
              Save and activate rule
            </Btn>
          ) : (
            <Btn
              variant="accent"
              size="lg"
              className="mt-6 w-full"
              onClick={() => {
                if (!CONFIG.contractId) return;
                signIn();
              }}
              disabled={!CONFIG.contractId || !ready || !ok}
            >
              {!CONFIG.contractId ? "Contract not configured" : !ready ? "Loading wallet…" : "Connect wallet to create rule"}
            </Btn>
          )}

          {touched && !ok && <p className="mt-3 text-xs text-dim text-center">Please fix the highlighted fields first.</p>}
          <p className="mt-3 text-xs text-dim text-center">
            {accountId
              ? `Signed with ${accountId} on NEAR testnet. No real money is spent.`
              : "Connect your NEAR testnet wallet to sign and submit this rule on-chain."}
          </p>
        </Card>
      </aside>
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-3"><span>{label}</span><span className="text-right font-mono text-white">{value}</span></div>;
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4 border-b border-line pb-2 last:border-0 dark:border-dark-border"><span className="text-mute dark:text-dark-mute">{label}</span><span className="text-right font-medium text-ink dark:text-white">{value}</span></div>;
}
