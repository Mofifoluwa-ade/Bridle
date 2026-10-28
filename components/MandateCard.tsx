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
  approved: {
    bg: "bg-[#E7F2EE] dark:bg-accent-tint",
    fg: "text-[#0A7C59] dark:text-[#46D9A4]",
  },
  blocked: {
    bg: "bg-[#FDECEA] dark:bg-bad-tint/15",
    fg: "text-[#B42318] dark:text-bad",
  },
  waiting: {
    bg: "bg-[#FEF3E2] dark:bg-warn-tint/15",
    fg: "text-[#B54708] dark:text-warn",
  },
} as const;

function StatusIcon({ kind }: { kind: FeedItem["kind"] }) {
  const common = {
    width: 17,
    height: 17,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.4,
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
      <path d="M9 7v10M15 7v10" />
    </svg>
  );
}

export function MandateCard() {
  return (
    <div>
      <div className="rounded-3xl border border-line dark:border-dark-border bg-white dark:bg-dark-card p-5 sm:p-7 md:p-8 shadow-sm transition-colors text-ink dark:text-dark-text">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-xs uppercase tracking-[0.1em] text-mute dark:text-dark-mute font-medium">
            Mandate
          </span>
          <span className="inline-flex items-center rounded-full bg-accent-tint border border-accent/20 px-3 py-1 text-xs font-semibold text-accent dark:text-[#46D9A4]">
            Active
          </span>
        </div>

        <p className="mt-4 sm:mt-5 text-[20px] sm:text-[25px] font-medium leading-[1.3] tracking-[-0.02em] text-ink dark:text-white">
          Up to $50 a day, to three approved recipients. Pause anything over
          $20.
        </p>

        <div className="mt-4 sm:mt-5 flex flex-wrap gap-2">
          {["Base", "Solana", "USDC"].map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-line dark:border-dark-border bg-paper dark:bg-dark-bg px-3 py-1.5 text-[13px] text-mute dark:text-dark-mute font-medium"
            >
              {chip}
            </span>
          ))}
        </div>

        <div className="mb-2 mt-6 sm:mt-7 h-px bg-line dark:bg-dark-border" />
        <span className="mb-2 block font-mono text-xs uppercase tracking-[0.1em] text-mute dark:text-dark-mute font-medium">
          Live feed
        </span>

        <ul className="space-y-1">
          {feed.map((item, i) => (
            <li
              key={item.title}
              className={`flex items-center gap-3 sm:gap-4 py-3 px-2 sm:px-3 -mx-2 sm:-mx-3 rounded-2xl transition-all duration-200 hover:bg-paper/70 dark:hover:bg-dark-card-hover/50 ${
                i < feed.length - 1 ? "border-b border-line/60 dark:border-dark-border/60" : ""
              }`}
            >
              <div
                className={`flex h-10 w-10 sm:h-11 sm:w-11 flex-none items-center justify-center rounded-full transition-transform hover:scale-105 shadow-2xs ${tone[item.kind].bg} ${tone[item.kind].fg}`}
              >
                <StatusIcon kind={item.kind} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14.5px] sm:text-[15px] font-semibold text-ink dark:text-white truncate">{item.title}</div>
                <div className="text-[12.5px] sm:text-[13px] text-mute dark:text-dark-mute truncate">{item.detail}</div>
              </div>
              <div
                className={`font-mono text-[15px] sm:text-base font-semibold flex-none pl-2 ${
                  item.kind === "blocked" ? "text-mute dark:text-dark-mute line-through" : "text-ink dark:text-white"
                }`}
              >
                {item.amount}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-3.5 text-center text-[12.5px] text-mute dark:text-dark-mute">
        <a
          href="/app"
          className="font-medium text-ink dark:text-white underline transition-colors hover:text-accent dark:hover:text-accent"
        >
          Open policy monitor →
        </a>
      </p>
    </div>
  );
}
