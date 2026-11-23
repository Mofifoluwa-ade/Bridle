import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#F7F8F6] text-[#111827] dark:bg-[#0B0E14] dark:text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(17,24,39,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(17,24,39,0.055)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_50%_35%,black,transparent_78%)]" />
        <div className="absolute -right-40 -top-48 h-[560px] w-[560px] rounded-full border border-[#111827]/[0.08] dark:border-white/[0.055]" />
        <div className="absolute -right-16 -top-24 h-[320px] w-[320px] rounded-full border border-[#111827]/[0.08] dark:border-white/[0.055]" />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-[1120px] items-center justify-between px-6 py-7 sm:px-10">
        <Link href="/" aria-label="Bridle home" className="inline-flex rounded-md">
          <Logo className="text-[#111827] dark:text-white" />
        </Link>
        <span className="hidden items-center gap-2 rounded-full border border-[#DDE2E0] bg-white/80 dark:border-white/10 dark:bg-white/[0.035] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#596579] dark:text-[#A3ABB8] sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-[#46D9A4]" />
          Bridle · Testnet
        </span>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-[1120px] flex-1 items-center px-6 pb-20 pt-10 sm:px-10 sm:pb-28">
        <div className="grid w-full items-center gap-14 lg:grid-cols-[1fr_0.85fr] lg:gap-20">
          <div className="max-w-[590px]">
            <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[#46D9A4]">
              <span className="h-px w-8 bg-[#46D9A4]/70" />
              Error 404 · Route not found
            </p>
            <h1 className="mt-7 text-[clamp(48px,8vw,88px)] font-semibold leading-[0.98] tracking-[-0.065em] text-[#111827] dark:text-white">
              This route
              <br />
              <span className="text-[#667085] dark:text-[#8B95A5]">isn’t going</span>
              <br />
              anywhere.
            </h1>
            <p className="mt-7 max-w-[440px] text-[15px] leading-[1.8] text-[#596579] dark:text-[#A3ABB8] sm:text-[16px]">
              The page may have moved, the address may be wrong, or the link may have expired. Your next step is still yours to choose.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#46D9A4] px-5 text-[14px] font-semibold text-[#0B0E14] transition-colors hover:bg-[#6CE5B8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#46D9A4]"
              >
                Back to Bridle <span aria-hidden className="ml-2">↗</span>
              </Link>
              <Link
                href="/app"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#D4DAD7] bg-white/70 dark:border-white/15 dark:bg-white/[0.035] px-5 text-[14px] font-medium text-[#111827] dark:text-white transition-colors hover:border-[#AAB5B0] hover:bg-white dark:hover:border-white/30 dark:hover:bg-white/[0.07] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#46D9A4]"
              >
                Open dashboard
              </Link>
            </div>
            <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.13em] text-[#7B8491] dark:text-[#687384]">
              Policy before payment · Always
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-[430px]">
            <div className="absolute -inset-8 rounded-[36px] bg-[#46D9A4]/[0.035] blur-2xl" />
            <div className="relative overflow-hidden rounded-[28px] border border-[#DDE2E0] bg-white/90 dark:border-white/10 dark:bg-[#111720]/90 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.28)] sm:p-8">
              <div className="flex items-center justify-between border-b border-[#E3E7E4] dark:border-white/[0.08] pb-5">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#667085] dark:text-[#8B95A5]">Navigation check</span>
                <span className="rounded-full border border-[#D69B55]/25 bg-[#D69B55]/[0.08] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#D9AD78]">No route</span>
              </div>
              <div className="py-9">
                <svg viewBox="0 0 340 190" role="img" aria-label="A route line reaches a boundary and stops" className="h-auto w-full">
                  <defs>
                    <linearGradient id="routeLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0" stopColor="#46D9A4" stopOpacity="0.9" />
                      <stop offset="1" stopColor="#46D9A4" stopOpacity="0.18" />
                    </linearGradient>
                  </defs>
                  <path d="M28 128 H112 Q132 128 132 108 V82 Q132 62 152 62 H212" fill="none" stroke="url(#routeLine)" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M212 62 H286" fill="none" stroke="#687384" strokeWidth="2" strokeDasharray="4 8" strokeLinecap="round" opacity=".7" />
                  <circle cx="28" cy="128" r="6" fill="#46D9A4" />
                  <circle cx="28" cy="128" r="12" fill="none" stroke="#46D9A4" strokeOpacity=".22" />
                  <circle cx="212" cy="62" r="5" fill="#D9AD78" />
                  <path d="M286 34 V90 M298 34 V90 M280 34 H304 M280 90 H304" stroke="#D9AD78" strokeOpacity=".75" strokeWidth="2" strokeLinecap="round" />
                  <path d="M224 48 L236 60 M236 48 L224 60" stroke="#D9AD78" strokeWidth="2" strokeLinecap="round" />
                  <text x="28" y="158" fill="#8B95A5" fontSize="9" fontFamily="monospace" letterSpacing="1.4">YOU ARE HERE</text>
                  <text x="286" y="112" textAnchor="middle" fill="#8B95A5" fontSize="9" fontFamily="monospace" letterSpacing="1.2">404</text>
                </svg>
              </div>
              <div className="border-t border-[#E3E7E4] dark:border-white/[0.08] pt-5">
                <p className="text-[14px] font-medium text-[#111827] dark:text-white">The destination wasn’t found.</p>
                <p className="mt-1.5 text-[12px] leading-[1.7] text-[#667085] dark:text-[#8B95A5]">No transaction was made. No policy was changed. Try one of the routes above.</p>
              </div>
            </div>
            <p className="mt-4 text-center font-mono text-[9px] uppercase tracking-[0.16em] text-[#7B8491] dark:text-[#687384]">BRIDLE / ROUTE STATUS</p>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-[#E3E7E4] dark:border-white/[0.08]">
        <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-2 px-6 py-5 text-[11px] text-[#7B8491] dark:text-[#687384] sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <span>© {new Date().getFullYear()} Bridle. Open source, built in public.</span>
          <Link href="/support" className="transition-colors hover:text-[#111827] dark:text-white">Need a hand? Visit support ↗</Link>
        </div>
      </footer>
    </main>
  );
}
