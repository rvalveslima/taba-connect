/**
 * In-product motif: two overlapping circles representing shared ground
 * between two specific people. Outline circle = "you", filled = "them".
 *
 * This motif is intentionally distinct from the brand logo (scattered dots
 * with three connected). Do not merge them.
 */
export function OverlapCircles({
  count,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <svg
        viewBox="0 0 140 80"
        className="h-20 w-36"
        role="img"
        aria-label="Shared ground between two people"
      >
        {/* you — outline */}
        <circle
          cx="52"
          cy="40"
          r="34"
          fill="none"
          stroke="var(--foreground)"
          strokeWidth="2"
        />
        {/* them — filled clay */}
        <circle cx="88" cy="40" r="34" fill="var(--primary)" />
        {/* intersection accent */}
        <path
          d="M 70 8 A 34 34 0 0 0 70 72 A 34 34 0 0 0 70 8 Z"
          fill="var(--cobalt)"
          opacity="0.85"
        />
        {typeof count === "number" && (
          <text
            x="70"
            y="46"
            textAnchor="middle"
            fontFamily="var(--font-display)"
            fontWeight="700"
            fontSize="22"
            fill="var(--cobalt-foreground)"
          >
            {count}
          </text>
        )}
      </svg>
    </div>
  );
}
