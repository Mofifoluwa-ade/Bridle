// Copies the agent tool logic from mcp/src into lib/agentmcp so the hosted endpoint uses exactly the same rules.
// The bundler used for the site does not resolve the ".js" import suffix that the MCP package needs, so the copy drops it.
// Run: node scripts/sync-mcp.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const files = ["tools", "policy", "units", "types", "rpc", "config"];
mkdirSync("lib/agentmcp", { recursive: true });
for (const f of files) {
  const src = readFileSync(`mcp/src/${f}.ts`, "utf8").replace(/(from\s+"\.\/[a-z]+)\.js"/g, '$1"');
  writeFileSync(`lib/agentmcp/${f}.ts`, `// Generated from mcp/src/${f}.ts by scripts/sync-mcp.mjs. Do not edit here.\n${src}`);
}
console.log("synced", files.length, "files");
