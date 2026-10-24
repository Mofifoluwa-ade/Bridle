type MarkProps = {
  size?: number;
  /** Stroke weight in the 64-unit viewBox. Use a heavier stroke at tiny sizes. */
  strokeWidth?: number;
  className?: string;
  title?: string;
};

/** The Bridle mark: one line, two rings. Inherits color from `currentColor`. */
export function LogoMark({
  size = 30,
  strokeWidth = 4.5,
  className,
  title,
}: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d="M24 10V58" />
      <circle cx="35" cy="21" r="11" />
      <circle cx="37" cy="45" r="13" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-semibold tracking-[-0.03em] ${className}`}
    >
      Bridle
    </span>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <LogoMark size={30} />
      <Wordmark className="text-[22px]" />
    </span>
  );
}
