import assert from "node:assert/strict";
import { escapeHtml, telegramText, wasDelivered, type WatcherAlert } from "../lib/alerts/notifier.ts";

assert.equal(escapeHtml("<b>&</b>"), "&lt;b&gt;&amp;&lt;/b&gt;");
const alert: WatcherAlert = {
  kind: "flagged_proposal",
  title: "Flagged <x>",
  summary: "s",
  mandateId: 1,
  details: { Reason: "<a href=evil>click</a> _*[`" },
  url: "https://example.com/a?b=1&c=\"2\"",
  timestamp: 0,
};
const t = telegramText(alert);
assert.ok(!t.includes("<a href=evil>"), "untrusted HTML must be escaped");
assert.ok(t.includes("&lt;a href=evil&gt;"));
assert.ok(t.includes('href="https://example.com/a?b=1&amp;c=&quot;2&quot;"'));
assert.equal(wasDelivered({}), true);
assert.equal(wasDelivered({ telegram: false }), false);
assert.equal(wasDelivered({ telegram: false, discord: true }), true);
console.log("notifier tests passed");
