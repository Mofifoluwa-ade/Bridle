import { Container, PrimaryButton } from "./Container";
import { Logo } from "./Logo";

const links = [
  { href: "#how", label: "How it works" },
  { href: "#principles", label: "Principles" },
  { href: "#edges", label: "Limits" },
];

export function Nav() {
  return (
    <Container>
      <nav
        aria-label="Primary"
        className="flex flex-wrap items-center justify-between gap-4 py-7"
      >
        <a href="#top" className="text-ink">
          <Logo />
        </a>
        <div className="flex flex-wrap items-center gap-7">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[15px] text-mute transition-colors hover:text-ink"
            >
              {l.label}
            </a>
          ))}
          <PrimaryButton href="/app">Open app</PrimaryButton>
        </div>
      </nav>
    </Container>
  );
}
