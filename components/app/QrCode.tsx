"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Btn } from "@/components/app/ui";

/** A QR code for a link, drawn in the browser. The link never leaves the page. */
export function QrCode({ value, label = "Scan to pay", filename = "bridle-pay-me.png" }: { value: string; label?: string; filename?: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    QRCode.toDataURL(value, { margin: 2, width: 320, errorCorrectionLevel: "M", color: { dark: "#0E1116", light: "#FFFFFF" } })
      .then((u) => live && setSrc(u))
      .catch(() => live && setSrc(null));
    return () => {
      live = false;
    };
  }, [value]);

  if (!src) return null;
  return (
    <div className="flex flex-col items-start gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={`${label}: QR code for the payment link`} width={176} height={176} className="rounded-xl border border-line bg-white" />
      <Btn variant="outline" size="sm" onClick={() => {
        const a = document.createElement("a");
        a.href = src;
        a.download = filename;
        a.click();
      }}>Download QR</Btn>
    </div>
  );
}
