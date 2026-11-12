/** A small stable avatar for a NEAR account: the same name always gets the same colours. */
export function AccountAvatar({ id, size = 36 }: { id: string; size?: number }) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const a = h % 360;
  const b = (a + 48) % 360;
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full font-mono font-medium uppercase text-white"
      style={{ width: size, height: size, fontSize: size * 0.4, background: `linear-gradient(135deg, hsl(${a} 55% 42%), hsl(${b} 60% 30%))` }}
    >
      {id.slice(0, 1)}
    </span>
  );
}
