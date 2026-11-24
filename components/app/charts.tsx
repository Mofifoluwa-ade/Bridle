"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { DayPoint } from "@/lib/adminStats";

const fmtDay = (t: number, long = false) =>
  new Date(t).toLocaleDateString(undefined, long ? { weekday: "short", month: "short", day: "numeric" } : { month: "short", day: "numeric" });

/** Which day columns get an axis label. Fewer labels on narrow ranges so they never collide. */
const labelEvery = (n: number) => (n <= 10 ? 1 : n <= 16 ? 3 : 5);
const showLabel = (i: number, n: number) => (n - 1 - i) % labelEvery(n) === 0;

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.clientWidth);
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

const TIP =
  "pointer-events-none absolute z-20 min-w-[7.5rem] rounded-xl border border-line bg-white px-3 py-2 text-[12px] shadow-md dark:border-dark-border dark:bg-dark-card";

function Tip({ title, rows }: { title: string; rows: { label: string; value: string; dot?: string }[] }) {
  return (
    <>
      <p className="font-mono text-[11px] text-mute dark:text-dark-mute">{title}</p>
      <ul className="mt-1 space-y-0.5">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between gap-4 text-ink dark:text-white">
            <span className="flex items-center gap-1.5 text-mute dark:text-dark-mute">
              {r.dot && <span className={`h-2 w-2 rounded-full ${r.dot}`} />}
              {r.label}
            </span>
            <span className="font-semibold">{r.value}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

function DayAxis({ days, x }: { days: number[]; x: (i: number) => number }) {
  const n = days.length;
  return (
    <div className="relative mt-2 h-4 font-mono text-[11px] text-mute dark:text-dark-mute" aria-hidden>
      {days.map((t, i) =>
        showLabel(i, n) ? (
          <span
            key={t}
            className={`absolute -translate-x-1/2 whitespace-nowrap ${i === n - 1 ? "font-semibold text-ink dark:text-white" : ""}`}
            style={{ left: x(i) }}
          >
            {new Date(t).getDate()}
          </span>
        ) : null,
      )}
    </div>
  );
}

/* ---------- Stacked columns: one bar per day, split by category ---------- */

export type StackPoint = { t: number; parts: number[] };
export type StackSeries = { label: string; dot: string; bar: string };

export function StackedBars({
  data,
  series,
  height = 150,
}: {
  data: StackPoint[];
  series: StackSeries[];
  height?: number;
}) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const n = data.length;
  const max = Math.max(1, ...data.map((d) => d.parts.reduce((a, b) => a + b, 0)));
  const colW = w / n;
  const x = (i: number) => colW * i + colW / 2;
  const pick = (clientX: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setHover(Math.max(0, Math.min(n - 1, Math.floor((clientX - r.left) / colW))));
  };

  return (
    <div>
      <div
        ref={ref}
        className="relative flex touch-pan-y items-end gap-[3px]"
        style={{ height }}
        role="img"
        aria-label={`Daily totals for the last ${n} days`}
        onPointerMove={(e) => pick(e.clientX)}
        onPointerDown={(e) => pick(e.clientX)}
        onPointerLeave={(e) => e.pointerType === "mouse" && setHover(null)}
      >
        {data.map((d, i) => {
          const total = d.parts.reduce((a, b) => a + b, 0);
          const h = total === 0 ? 0 : Math.max(4, (total / max) * (height - 8));
          return (
            <div key={d.t} className="flex h-full min-w-0 flex-1 flex-col justify-end">
              {total === 0 ? (
                <span className="mx-auto block h-1 w-1 rounded-full bg-line dark:bg-dark-border" />
              ) : (
                <div
                  className={`flex flex-col-reverse overflow-hidden rounded-[4px] transition-opacity ${hover !== null && hover !== i ? "opacity-40" : ""}`}
                  style={{ height: h }}
                >
                  {d.parts.map((v, k) =>
                    v > 0 ? <span key={k} className={series[k].bar} style={{ height: `${(v / total) * 100}%` }} /> : null,
                  )}
                </div>
              )}
            </div>
          );
        })}
        {hover !== null && (
          <div className={TIP} style={{ top: 0, left: Math.min(Math.max(x(hover), 70), Math.max(70, w - 70)), transform: "translateX(-50%)" }}>
            <Tip
              title={fmtDay(data[hover].t, true)}
              rows={[
                ...series.map((s, k) => ({ label: s.label, value: String(data[hover].parts[k]), dot: s.dot })).filter((r) => r.value !== "0"),
                { label: "Total", value: String(data[hover].parts.reduce((a, b) => a + b, 0)) },
              ]}
            />
          </div>
        )}
      </div>
      <DayAxis days={data.map((d) => d.t)} x={x} />
      {series.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-mute dark:text-dark-mute">
          {series.map((s) => (
            <span key={s.label} className="inline-flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${s.dot}`} />
              {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Area / step line, one or more series, with a hover read-out ---------- */

export type LineSeries = { label: string; data: DayPoint[]; color: string; dot: string };

export function AreaChart({
  series,
  format,
  step = false,
  height = 150,
  extra,
}: {
  series: LineSeries[];
  format: (v: number) => string;
  step?: boolean;
  height?: number;
  /** Extra line in the tooltip for the hovered day. */
  extra?: (i: number) => { label: string; value: string } | null;
}) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const days = series[0].data.map((d) => d.t);
  const n = days.length;
  const padX = 8;
  const top = 18;
  const bottom = 4;
  const max = Math.max(1, ...series.flatMap((s) => s.data.map((d) => d.v)));
  const x = (i: number) => padX + (n === 1 ? 0 : (i * (w - padX * 2)) / (n - 1));
  const y = (v: number) => top + (1 - v / max) * (height - top - bottom);

  const path = (data: DayPoint[]) => {
    if (w === 0) return "";
    let d = `M${x(0)},${y(data[0].v)}`;
    for (let i = 1; i < n; i++) {
      if (step) d += ` H${x(i)} V${y(data[i].v)}`;
      else {
        const mid = (x(i - 1) + x(i)) / 2;
        d += ` C${mid},${y(data[i - 1].v)} ${mid},${y(data[i].v)} ${x(i)},${y(data[i].v)}`;
      }
    }
    return d;
  };
  const pick = (clientX: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r || n < 2) return;
    setHover(Math.max(0, Math.min(n - 1, Math.round(((clientX - r.left - padX) / (w - padX * 2)) * (n - 1)))));
  };
  const gid = useRef(`g${Math.random().toString(36).slice(2, 8)}`).current;

  return (
    <div>
      <div
        ref={ref}
        className="relative touch-pan-y"
        style={{ height }}
        role="img"
        aria-label={`Daily values for the last ${n} days`}
        onPointerMove={(e) => pick(e.clientX)}
        onPointerDown={(e) => pick(e.clientX)}
        onPointerLeave={(e) => e.pointerType === "mouse" && setHover(null)}
      >
        <span className="absolute left-0 top-0 font-mono text-[10px] text-dim dark:text-dark-dim">{format(max)}</span>
        {w > 0 && (
          <svg width={w} height={height} className="block overflow-visible">
            {[0, 0.5, 1].map((f) => (
              <line key={f} x1={0} x2={w} y1={y(max * f)} y2={y(max * f)} className="stroke-line dark:stroke-dark-border" strokeDasharray={f === 0 ? undefined : "3 5"} />
            ))}
            {series.map((s, k) => (
              <g key={s.label} className={s.color}>
                <defs>
                  <linearGradient id={`${gid}${k}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="currentColor" stopOpacity={series.length > 1 ? 0.16 : 0.28} />
                    <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <path d={`${path(s.data)} L${x(n - 1)},${y(0)} L${x(0)},${y(0)} Z`} fill={`url(#${gid}${k})`} />
                <path d={path(s.data)} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                {hover === null && <circle cx={x(n - 1)} cy={y(s.data[n - 1].v)} r={4} fill="currentColor" />}
                {hover !== null && <circle cx={x(hover)} cy={y(s.data[hover].v)} r={4.5} fill="currentColor" className="stroke-white dark:stroke-dark-card" strokeWidth={2} />}
              </g>
            ))}
            {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={top - 6} y2={y(0)} className="stroke-ink/30 dark:stroke-white/30" />}
          </svg>
        )}
        {hover !== null && (
          <div className={TIP} style={{ top: 0, left: Math.min(Math.max(x(hover), 70), Math.max(70, w - 70)), transform: "translateX(-50%)" }}>
            <Tip
              title={fmtDay(days[hover], true)}
              rows={[
                ...series.map((s) => ({ label: s.label, value: format(s.data[hover].v), dot: s.dot })),
                ...(extra?.(hover) ? [extra(hover)!] : []),
              ]}
            />
          </div>
        )}
      </div>
      <DayAxis days={days} x={x} />
      {series.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-mute dark:text-dark-mute">
          {series.map((s) => (
            <span key={s.label} className="inline-flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${s.dot}`} />
              {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Funnel: how many made it from one step to the next ---------- */

export function Funnel({ steps }: { steps: { label: string; n: number }[] }) {
  const top = Math.max(1, steps[0]?.n ?? 1);
  return (
    <ul className="space-y-4">
      {steps.map((s, i) => {
        const prev = i === 0 ? null : steps[i - 1].n;
        const pct = prev ? Math.round((s.n / prev) * 100) : null;
        return (
          <li key={s.label}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[14px] text-ink dark:text-white">{s.label}</span>
              <span className="flex items-baseline gap-2">
                {pct !== null && <span className="font-mono text-[11px] text-mute dark:text-dark-mute">{pct}% of previous</span>}
                <span className="text-[17px] font-semibold text-ink dark:text-white">{s.n}</span>
              </span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-line/70 dark:bg-dark-border">
              <div className="h-full rounded-full bg-accent dark:bg-accent-dark transition-all" style={{ width: `${Math.max(s.n ? 2 : 0, (s.n / top) * 100)}%`, opacity: 1 - i * 0.14 }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function ChartNote({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-[12px] leading-relaxed text-mute dark:text-dark-mute">{children}</p>;
}
