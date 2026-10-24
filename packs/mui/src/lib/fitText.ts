import { useLayoutEffect, useRef } from 'react';

/**
 * Shrinks a one-line value until it fits its box, down to `min` of its own size, and only then cuts it with an
 * ellipsis (the element's CSS: nowrap, overflow hidden, text-overflow ellipsis). A stat's figure such as
 * $10,416,100.00 in a quarter-width card was cut mid-number. `selector` picks the element inside the ref'd one, for a
 * vendor component that draws it (Ant's Statistic). Refitted when the box changes width or `deps` change.
 */
export const useFitText = <T extends HTMLElement>(deps: unknown[], { selector, min = 0.55 }: { selector?: string; min?: number } = {}) => {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const root = ref.current;
    const el = (selector ? root?.querySelector<HTMLElement>(selector) : root) ?? null;
    if (!el) return undefined;
    let width = -1;
    const fit = () => {
      if (el.clientWidth === width) return;
      width = el.clientWidth;
      el.style.fontSize = '';
      const base = parseFloat(getComputedStyle(el).fontSize) || 16;
      let size = base;
      while (el.scrollWidth > el.clientWidth + 1 && size > base * min) {
        size -= 1;
        el.style.fontSize = `${size}px`;
      }
    };
    fit();
    // Width only: the shrink changes the height, which must not refit (and loop).
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(fit);
    observer?.observe(el);
    return () => observer?.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
};
