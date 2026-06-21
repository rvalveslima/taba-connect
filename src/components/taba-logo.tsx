export function TabaLogo({
  className = "",
  height = 24,
  alt = "Taba",
  showWordmark = true,
}: {
  className?: string;
  height?: number;
  alt?: string;
  showWordmark?: boolean;
}) {
  // Mark is designed on a 64x40 viewBox. Wordmark adds width when enabled.
  const markW = 64;
  const markH = 40;
  const wordmarkW = showWordmark ? 78 : 0;
  const gap = showWordmark ? 10 : 0;
  const totalW = markW + gap + wordmarkW;
  const width = (height * totalW) / markH;

  // Triad coordinates (clay dots) — equilateral-ish triangle
  const a = { x: 22, y: 14 }; // top-left
  const b = { x: 42, y: 14 }; // top-right
  const c = { x: 32, y: 30 }; // bottom

  // Scattered ambient dots (the "disconnected people")
  const ambient = [
    { x: 6, y: 6, r: 1.4 },
    { x: 58, y: 5, r: 1.4 },
    { x: 3, y: 24, r: 1.2 },
    { x: 60, y: 22, r: 1.6 },
    { x: 14, y: 36, r: 1.2 },
    { x: 52, y: 36, r: 1.4 },
  ];

  return (
    <svg
      role="img"
      aria-label={alt}
      viewBox={`0 0 ${totalW} ${markH}`}
      height={height}
      width={width}
      style={{ height, width: "auto" }}
      className={className}
    >
      {/* Ambient disconnected dots */}
      {ambient.map((d, i) => (
        <circle
          key={i}
          cx={d.x}
          cy={d.y}
          r={d.r}
          fill="currentColor"
          opacity={0.28}
        />
      ))}

      {/* Connecting lines — the triad */}
      <g
        stroke="var(--primary, #C97B4A)"
        strokeWidth={1.6}
        strokeLinecap="round"
        fill="none"
      >
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
        <line x1={b.x} y1={b.y} x2={c.x} y2={c.y} />
        <line x1={c.x} y1={c.y} x2={a.x} y2={a.y} />
      </g>

      {/* Three connected dots */}
      <g fill="var(--primary, #C97B4A)">
        <circle cx={a.x} cy={a.y} r={4} />
        <circle cx={b.x} cy={b.y} r={4} />
        <circle cx={c.x} cy={c.y} r={4.4} />
      </g>

      {/* Wordmark */}
      {showWordmark && (
        <text
          x={markW + gap}
          y={28}
          fontFamily="Poppins, ui-sans-serif, system-ui, sans-serif"
          fontWeight={700}
          fontSize={24}
          letterSpacing={-0.5}
          fill="currentColor"
        >
          taba
        </text>
      )}
    </svg>
  );
}
