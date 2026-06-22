import { useEffect, useState, type RefObject } from "react";

/**
 * Returns true when `ref` enters the viewport. Defaults to `true` when
 * IntersectionObserver is unavailable or the user prefers reduced motion,
 * so content is always visible even when the observer never fires.
 */
export function useInView(
  ref: RefObject<Element | null>,
  { rootMargin = "0px 0px -10% 0px", once = true }: { rootMargin?: string; once?: boolean } = {},
): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setInView(false);
          }
        }
      },
      { rootMargin, threshold: 0.05 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, rootMargin, once]);

  return inView;
}
