# Bridle Privacy Notice — draft for review only

**Status: not approved for publication. Replace every bracketed item and verify the implementation before publishing.**

**Operator:** [Full legal name / registered entity and jurisdiction]  
**Effective date:** [Date]  
**Contact:** usebridle@gmail.com

## What Bridle does

Bridle provides a testnet application and an MCP connector that lets an owner-authorized AI agent inspect spending mandates, check proposed payments, submit proposals to the Bridle contract, and inspect proposal status and receipts. Current supported payment rails are NEAR testnet native NEAR and Base Sepolia USDC. Solana is planned and is not currently executable.

## Information processed

Depending on how you use Bridle, the service may process:

- Public blockchain data, including wallet/account addresses, agent account identifiers, mandate settings, approved recipients, proposal details, transaction hashes and other information recorded on public networks.
- Agent credentials. The browser creates an agent key and stores the agent token in browser local storage. A personal agent link contains the credential and must be treated like a password. The hosted OAuth flow seals agent credentials into encrypted authorization codes and access/refresh tokens using the server-side `MCP_TOKEN_SECRET`.
- OAuth connection data, including the AI client's name and registered redirect URIs, PKCE challenge data, authorization codes and token material.
- Technical request data processed by the hosting and infrastructure providers. **Confirm the exact request logs, IP/user-agent collection, retention periods and access controls with the hosting provider before publication.**

Bridle's current OAuth implementation is stateless and does not maintain a per-app authorization/revocation database. Access tokens last one hour; refresh tokens are currently issued for 90 days and can be renewed. This is a known limitation and must be addressed before broad public release.

## Why information is processed

Information is used to:
- authenticate an owner-authorized AI app;
- identify the agent account and authorize agent-only MCP operations;
- read public contract state and calculate payment eligibility;
- submit proposals when the connected agent has the required key and gas;
- return proposal status and transaction receipts;
- secure, troubleshoot and operate the service.

## Blockchain and third parties

Blockchain transactions and public contract state are visible on the relevant public networks and may be permanent. Bridle cannot delete or alter public-chain records.

The service currently relies on Vercel for hosting and public RPC/explorer infrastructure for blockchain access. Confirm and list the exact providers, their privacy terms, data locations and retention practices before publication.

## Browser storage

The site stores the selected theme in local storage. Agent credentials may also be stored in local storage so the same browser can restore an agent. Anyone with access to the browser profile or a copied agent link may be able to use that agent. Do not paste agent links or private keys into public chats.

## Security

Bridle uses OAuth authorization code with PKCE (S256) for hosted connections and encrypts OAuth artifacts using a server-side secret. No system can be guaranteed secure. Bridle is currently testnet software and has not been represented as an audited production financial service.

## Retention and deletion

[Specify the retention of hosting logs, support correspondence, and any operational records. Explain how a user can request deletion of off-chain information and which records cannot be deleted because they are public blockchain data.]

## Children

[Confirm intended age eligibility and add the operator's policy.]

## Changes

This notice may be updated. The effective date above should be changed whenever the notice changes.

## Contact

Questions or privacy requests: usebridle@gmail.com.
