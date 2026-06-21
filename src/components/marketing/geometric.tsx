/**
 * Bauhaus-meets-nature geometric primitives.
 * Bold primary shapes with slightly organic placement.
 */

export function ClayCircle({ className }: { className?: string }) {
  return (
    <div
      className={className}
      style={{
        background: "var(--primary)",
        borderRadius: "9999px",
      }}
      aria-hidden
    />
  );
}

export function CobaltTriangle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      aria-hidden
      preserveAspectRatio="none"
    >
      <polygon points="50,4 96,96 4,96" fill="var(--cobalt)" />
    </svg>
  );
}

export function InkSquare({ className }: { className?: string }) {
  return (
    <div
      className={className}
      style={{ background: "var(--foreground)" }}
      aria-hidden
    />
  );
}

export function InkRule({
  className,
  thickness = 2,
}: {
  className?: string;
  thickness?: number;
}) {
  return (
    <div
      className={className}
      style={{
        height: thickness,
        background: "var(--foreground)",
      }}
      aria-hidden
    />
  );
}

export function GridLines({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      aria-hidden
      preserveAspectRatio="none"
    >
      {[...Array(9)].map((_, i) => (
        <line
          key={`v${i}`}
          x1={(i + 1) * 20}
          y1="0"
          x2={(i + 1) * 20}
          y2="200"
          stroke="var(--foreground)"
          strokeWidth="0.5"
          opacity="0.18"
        />
      ))}
      {[...Array(9)].map((_, i) => (
        <line
          key={`h${i}`}
          x1="0"
          y1={(i + 1) * 20}
          x2="200"
          y2={(i + 1) * 20}
          stroke="var(--foreground)"
          strokeWidth="0.5"
          opacity="0.18"
        />
      ))}
    </svg>
  );
}

/**
 * Subtle film-grain texture overlay — softens the bauhaus geometry
 * with an organic, hand-made feel.
 */
export function GrainOverlay({ className }: { className?: string }) {
  return (
    <div
      className={className}
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        opacity: 0.35,
        mixBlendMode: "multiply",
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.13 0 0 0 0 0.11 0 0 0 0 0.09 0 0 0 0.18 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
      }}
    />
  );
}
