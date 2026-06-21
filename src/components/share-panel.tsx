import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

export function SharePanel({ eventId, eventCode }: { eventId: string; eventCode?: string | null }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/join/${eventId}` : `/join/${eventId}`;

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 180,
        margin: 1,
        color: { dark: "#211C18", light: "#FAF6F0" },
      });
    }
  }, [url]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="font-heading text-lg font-semibold">Share with attendees</h2>
        <p className="text-sm text-muted-foreground">Anyone with this link or QR can join.</p>
      </div>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="rounded-lg border border-border bg-background p-2">
          <canvas ref={canvasRef} aria-label="Join QR code" />
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex items-stretch overflow-hidden rounded-md border border-border bg-background">
            <input readOnly value={url} className="flex-1 bg-transparent px-3 py-2 text-sm outline-none" />
            <button
              onClick={copy}
              className="border-l border-border bg-muted px-3 text-xs font-semibold hover:bg-accent"
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
          {eventCode && (
            <p className="text-xs text-muted-foreground">
              Or join with code{" "}
              <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">{eventCode}</span>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
