import type { DayPoint } from "@/lib/adminStats";

/**
 * A lollipop chart: one dot per day, a thin stem up to the value, today highlighted.
 * Plain HTML so it scales with its card and never distorts.
 */
export function StemChart({
  data,
  format,
  height = 150,
}: {
  data: DayPoint[];
  format: (v: number) => string;
  height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.v));
  const last = data.length - 1;
  const label = (i: number) => new Date(data[i].t).getDate();
  const showLabel = (i: number) => i === last || (i % 5 === 0 && last - i >= 3);
  const headroom = 30; // space for the value bubble above the tallest stem

  return (
    <div>
      <div className="flex items-end gap-px" style={{ height }} role="img" aria-label={`Daily values for the last ${data.length} days`}>
        {data.map((d, i) => {
          const isLast = i === last;
          const h = (d.v / max) * (height - headroom);
          return (
            <div
              key={d.t}
              className="relative flex h-full min-w-0 flex-1 flex-col items-center justify-end"
              title={`${new Date(d.t).toLocaleDateString(undefined, { month: "short", day: "numeric" })}: ${format(d.v)}`}
            >
              {isLast && (
                <span
                  className="absolute right-0 z-10 whitespace-nowrap rounded-full bg-ink px-2.5 py-1 font-mono text-[11px] font-semibold text-white dark:bg-white dark:text-ink"
                  style={{ bottom: h + 14 }}
                >
                  {format(d.v)}
                </span>
              )}
              <span className={`block flex-none rounded-full ${isLast ? "h-2.5 w-2.5 bg-ink dark:bg-white" : "h-1.5 w-1.5 bg-dim dark:bg-dark-dim"}`} />
              <span className={`block w-px flex-none ${isLast ? "bg-ink dark:bg-white" : "bg-line dark:bg-dark-border"}`} style={{ height: h }} />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-px font-mono text-[11px] text-mute dark:text-dark-mute" aria-hidden>
        {data.map((d, i) => (
          <span key={d.t} className={`flex-1 overflow-visible text-center ${i === last ? "font-semibold text-ink dark:text-white" : ""}`}>
            {showLabel(i) ? <span className="inline-block w-0 whitespace-nowrap">{label(i)}</span> : null}
          </span>
        ))}
      </div>
    </div>
  );
}
