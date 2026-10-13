import { useEffect, useState, type RefObject } from "react";

type InViewOptions = IntersectionObserverInit & { once?: boolean };

export function useInView(
  ref: RefObject<HTMLElement | null>,
  options: InViewOptions = {},
) {
  const [isInView, setIsInView] = useState(false);
  const { once = true, root = null, rootMargin = "0px 0px -48px 0px", threshold = 0.12 } = options;

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (once) {
            observer.disconnect();
          }
          return;
        }
        if (!once) {
          setIsInView(false);
        }
      },
      { root, rootMargin, threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, once, root, rootMargin, threshold]);

  return isInView;
}
