import { useRef, type CSSProperties, type ReactNode } from "react";
import { useInView } from "@/hooks/use-in-view";

type Variant = "fade-up" | "fade" | "scale-in" | "slide-left" | "slide-right";

export function Reveal({
  children,
  variant = "fade-up",
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  variant?: Variant;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "span" | "li";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const visible = useInView(ref as React.RefObject<Element | null>);

  const style: CSSProperties = {
    animationDelay: visible ? `${delay}ms` : undefined,
  };

  const cls = [
    "reveal",
    `reveal-${variant}`,
    visible ? "reveal-in" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // @ts-expect-error — runtime tag, ref typing is fine
  return <Tag ref={ref} className={cls} style={style}>{children}</Tag>;
}
