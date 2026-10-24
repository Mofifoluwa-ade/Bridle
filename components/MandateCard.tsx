type FeedItem = {
  kind: "approved" | "blocked" | "waiting";
  title: string;
  detail: string;
  amount: string;
};

// Active proposals evaluated against on-chain mandate policy.
const feed: FeedItem[] = [
  {
    kind: "approved",
    title: "Invoice paid",
    detail: "Approved recipient",
    amount: "$18.00",
  },
  {
    kind: "blocked",
    title: "Blocked",
    detail: "Recipient not on the list",
    amount: "$240.00",
  },
  {
    kind: "waiting",
    title: "Waiting for your veto",
    detail: "Above the $20 threshold",
    amount: "$32.00",
  },
];

const tone = {
  approved: { bg: "bg-accent-tint", fg: "text-accent" },
  blocked: { bg: "bg-bad-tint", fg: "text-bad" },
  waiting: { bg: "bg-warn-tint", fg: "text-warn" },
} as const;

function StatusIcon({ kind }: { kind: FeedItem["kind"] }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (kind === "approved")
    return (
      <svg {...common}>
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    );
  if (kind === "blocked")
    return (
      <svg {...common}>
        <path d="M7 7l10 10M17 7L7 17" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M10 8v8M14 8v8" />
    </svg>
  );
}

export function MandateCard() {
  return (
    <div>
      <div className="rounded-3xl border border-line bg-white p-8">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-xs uppercase tracking-[0.1em] text-mute">
            Mandate
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-accent-tint px-3 py-1.5 text-[13px] font-semibold text-accent">
            <span className="h-2 w-2 rounded-full bg-accent" />
            Active
          </span>
        </div>

        <p className="mt-5 text-[25px] font-medium leading-[1.3] tracking-[-0.02em]">
          Up to $50 a day, to three approved recipients. Pause anything over
          $20.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {["Base", "Solana", "USDC"].map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-line px-3 py-1.5 text-[13px] text-mute"
            >
              {chip}
            </span>
          ))}
        </div>

        <div className="mb-2 mt-7 h-px bg-line" />
        <span className="mb-1 block font-mono text-xs uppercase tracking-[0.1em] text-mute">
          Live feed
        </span>

        <ul>
          {feed.map((item, i) => (
            <li
              key={item.title}
              className={`flex items-center gap-3.5 py-4 ${
                i < feed.length - 1 ? "border-b border-line" : "pb-1"
              }`}
            >
              <div
                className={`flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full ${tone[item.kind].bg} ${tone[item.kind].fg}`}
              >
                <StatusIcon kind={item.kind} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold">{item.title}</div>
                <div className="text-[13px] text-mute">{item.detail}</div>
              </div>
              <div
                className={`font-mono text-sm font-medium ${
                  item.kind === "blocked" ? "text-mute" : ""
                }`}
              >
                {item.amount}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-3.5 text-center text-[12.5px] text-mute">
        <a
          href="/app"
          className="font-medium text-ink underline transition-colors hover:text-accent"
        >
          Open policy monitor →
        </a>
      </p>
    </div>
  );
}
