/**
 * Multi-channel alert dispatcher for Bridle watcher notifications.
 * Dispatches to Telegram, Discord, and custom webhooks without external SDKs.
 */

export type AlertKind = "waiting_proposal" | "flagged_proposal" | "limits_loosening";

export type WatcherAlert = {
  kind: AlertKind;
  title: string;
  summary: string;
  mandateId: number;
  proposalId?: number;
  details: Record<string, string | number>;
  url: string;
  timestamp: number;
};

/** Telegram HTML mode needs only these three characters escaped. Recipients and reasons are untrusted. */
export function escapeHtml(v: unknown): string {
  return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function telegramText(alert: WatcherAlert): string {
  const emoji = alert.kind === "flagged_proposal" ? "🚨" : alert.kind === "waiting_proposal" ? "⏳" : "⚠️";
  let text = `${emoji} <b>[Bridle Alert] ${escapeHtml(alert.title)}</b>\n\n${escapeHtml(alert.summary)}\n\n`;
  for (const [k, v] of Object.entries(alert.details)) {
    text += `• <b>${escapeHtml(k)}</b>: <code>${escapeHtml(v)}</code>\n`;
  }
  text += `\n<a href="${escapeHtml(alert.url).replace(/"/g, "&quot;")}">Open in Bridle Dashboard</a>`;
  return text;
}

export async function sendTelegram(botToken: string, chatId: string, alert: WatcherAlert): Promise<boolean> {
  const text = telegramText(alert);

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(6000),
    });
    return res.ok;
  } catch (e) {
    console.error("[Watcher Alert] Telegram dispatch failed:", e);
    return false;
  }
}

export async function sendDiscord(webhookUrl: string, alert: WatcherAlert): Promise<boolean> {
  const color = alert.kind === "flagged_proposal" ? 0xb42318 : alert.kind === "waiting_proposal" ? 0xb54708 : 0x0a7c59;
  const fields = Object.entries(alert.details).map(([name, value]) => ({
    name,
    value: String(value),
    inline: true,
  }));

  const payload = {
    embeds: [
      {
        title: alert.title,
        description: alert.summary,
        url: alert.url,
        color,
        fields,
        footer: { text: "Bridle Policy Watcher" },
        timestamp: new Date(alert.timestamp).toISOString(),
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(6000),
    });
    return res.ok;
  } catch (e) {
    console.error("[Watcher Alert] Discord dispatch failed:", e);
    return false;
  }
}

export async function sendWebhook(url: string, alert: WatcherAlert): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(alert),
      signal: AbortSignal.timeout(6000),
    });
    return res.ok;
  } catch (e) {
    console.error("[Watcher Alert] Webhook dispatch failed:", e);
    return false;
  }
}

/** True when no channel is configured (console fallback) or at least one channel accepted the alert. */
export function wasDelivered(r: { telegram?: boolean; discord?: boolean; webhook?: boolean }): boolean {
  const sent = Object.values(r);
  return sent.length === 0 || sent.some(Boolean);
}

export async function dispatchAlert(alert: WatcherAlert): Promise<{ telegram?: boolean; discord?: boolean; webhook?: boolean }> {
  const results: { telegram?: boolean; discord?: boolean; webhook?: boolean } = {};
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChat = process.env.TELEGRAM_CHAT_ID;
  const discordUrl = process.env.DISCORD_WEBHOOK_URL;
  const genericUrl = process.env.ALERT_WEBHOOK_URL;

  const tasks: Promise<void>[] = [];

  if (tgToken && tgChat) {
    tasks.push(sendTelegram(tgToken, tgChat, alert).then((ok) => { results.telegram = ok; }));
  }
  if (discordUrl) {
    tasks.push(sendDiscord(discordUrl, alert).then((ok) => { results.discord = ok; }));
  }
  if (genericUrl) {
    tasks.push(sendWebhook(genericUrl, alert).then((ok) => { results.webhook = ok; }));
  }

  if (tasks.length === 0) {
    // Console log fallback if no webhook environment variables are configured
    console.log(`[Watcher Alert] ${alert.title}: ${alert.summary} (${alert.url})`);
  } else {
    await Promise.allSettled(tasks);
  }

  return results;
}

