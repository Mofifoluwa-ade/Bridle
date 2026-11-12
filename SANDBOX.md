# Break the Bridle: sandbox setup

The `/break` page lets visitors play a rogue agent against one real testnet mandate. It is safe by construction: the relay (`app/api/sandbox/route.ts`) only calls `propose_payment`, so the contract records a decision. It never calls `execute`, so no NEAR leaves the mandate through the page.

## One-time setup

1. Create a throwaway testnet account for the sandbox agent, for example `sandbox-agent.testnet`. It needs about 1 NEAR for gas.
2. As the owner, create a mandate in the app:
   - agent: the sandbox agent account
   - chain: Near, asset: NEAR
   - allowlist: one account you control
   - per-payment cap 0.5 NEAR, daily cap 2 NEAR, pause threshold 0.3 NEAR, bond 0
   - a long expiry
3. Fund it with 2 NEAR at most. The most it can ever hold is the most it can ever lose.
4. Set these on the server (Vercel project settings), never in `NEXT_PUBLIC_*`:

```
SANDBOX_MANDATE_ID=<the mandate id>
SANDBOX_AGENT_ACCOUNT=sandbox-agent.testnet
SANDBOX_AGENT_KEY=ed25519:...
```

## Things to know

- Attempts that pass the rule are recorded as Ready and still count toward the daily cap, even though nothing is executed. If visitors use up the cap, later attempts show "Over the daily cap". Revoke and recreate the mandate to reset it.
- Every attempt is stored on the contract, which costs a little storage. The relay limits each IP to 8 a minute and the whole site to 300 an hour, per server instance. This is best effort.
- The sandbox agent key can do nothing except propose payments on this one mandate.
