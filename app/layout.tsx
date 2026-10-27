import type { Metadata } from "next";
import { Instrument_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bridle-agent.vercel.app"),
  title: "Bridle — Steer your agents. Don't trust them.",
  description:
    "Bridle lets AI agents make payments within strict spending limits, without ever holding a private key.",
  openGraph: {
    title: "Bridle — Steer your agents. Don't trust them.",
    description:
      "Policy-bound payments for AI agents. Set the limits. Let the contract enforce them.",
    url: "https://bridle-agent.vercel.app/",
    siteName: "Bridle",
    type: "website",
    images: [
      {
        url: "/bridle-og.png",
        width: 1200,
        height: 630,
        alt: "Bridle — Steer your agents. Don't trust them.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bridle — Steer your agents. Don't trust them.",
    description:
      "Policy-bound payments for AI agents. Set the limits. Let the contract enforce them.",
    images: ["/bridle-og.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
              try {
                var theme = localStorage.getItem("bridle_theme");
                if (theme === "dark") {
                  document.documentElement.classList.add("dark");
                } else if (theme === "light") {
                  document.documentElement.classList.remove("dark");
                }
              } catch (e) {}
            })();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
