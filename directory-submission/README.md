# Bridle directory submission preparation

This folder contains drafts for OpenAI's public plugin directory and an Anthropic policy-exception request. Nothing has been submitted or published.

## Current status

- OpenAI package metadata and OAuth MCP config drafted.
- Five positive and three negative test-case drafts prepared; they have **not** all been run against a dedicated reviewer account.
- Walkthrough script prepared; recording URL is outstanding.
- Individual publisher selected; OpenAI identity verification and the exact verified display name remain outstanding.
- Privacy, Terms and Support routes are drafted in the website; Privacy and Terms need operator/legal review before finalization.
- Claude exception request drafted; written permission/eligibility guidance is outstanding.
- No external portal actions have been taken.

## Material technical blocker

Hosted OAuth tokens are sealed and stateless. There is currently no per-app token revocation endpoint or session inventory. The legacy personal MCP link contains a non-expiring agent credential. This is disclosed in the draft Privacy page. Resolve or explicitly accept this risk before broad distribution.

## Review docs

- [OpenAI package](./openai/README.md)
- [Claude exception request](./claude/policy-exception-request.md)
