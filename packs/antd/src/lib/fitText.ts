import { useLayoutEffect, useRef, useState } from 'react';

/**
 * Shrinks a one-line value until it fits its box, down to `min` of its own size, and only then cuts it with an
 * ellipsis (the element's CSS: nowrap, overflow hidden, text-overflow ellipsis). A stat's figure such as
 * $10,416,100.00 in a quarter-width card was cut mid-number. `selector` picks the element inside the ref'd one, for a
 * vendor component that draws it (Ant's Statistic, MUI's Typography in a Card). Refitted when the box changes width or `deps` change.
 *
 * `height`: the ref'd element is the widget's box, and the value also shrinks until the box's content fits its
 * height (a stat card in a 56px box cut its figure); refitted when the box changes size too. `root`: the box itself
 * (one useFitLayout reads too, kept in state by a callback ref, so a box mounted late is still fitted), else the
 * returned ref's element.
 */
export const useFitText = <T extends HTMLElement>(
  deps: unknown[],
  { selector, min = 0.55, height = false, root: given }: { selector?: string; min?: number; height?: boolean; root?: HTMLElement | null } = {}
) => {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const root = given !== undefined ? given : ref.current;
    const el = (selector ? root?.querySelector<HTMLElement>(selector) : root) ?? null;
    if (!el) return undefined;
    const box = height && root && root !== el ? root : null;
    const sizeKey = () => (box ? `${el.clientWidth}x${box.clientWidth}x${box.clientHeight}` : `${el.clientWidth}`);
    let size = '';
    const fit = () => {
      if (sizeKey() === size) return;
      el.style.fontSize = '';
      const base = parseFloat(getComputedStyle(el).fontSize) || 16;
      let px = base;
      const over = () => el.scrollWidth > el.clientWidth + 1 || (!!box && box.clientHeight > 0 && box.scrollHeight > box.clientHeight + 1);
      while (over() && px > base * min) {
        px -= 1;
        el.style.fontSize = `${px}px`;
      }
      // Width, and the box's size: the shrink changes the value's height only, which must not refit (and loop).
      size = sizeKey();
    };
    fit();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(fit);
    observer?.observe(el);
    if (box) observer?.observe(box);
    return () => observer?.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, given]);
  return ref;
};

/**
 * The first of `layouts` (class names for the box, '' for its own layout) under which the box's content fits its
 * height; the last when none does. A stat card in a 56px box cut its figure: a short layout trims the padding, an
 * inline one sets the title beside the figure, as shadcn's Stat does. Each is tried on the box itself (its classes put
 * back after) with the value at its own size (`selector`: the value useFitText shrinks), and picked again when the box
 * changes size or `deps` change. Without a layout (no height measured) it keeps the first. `box` is the element itself
 * (from a callback ref into state), so a box its provider mounts after the first render is still measured.
 */
export const useFitLayout = (box: HTMLElement | null, layouts: string[], deps: unknown[], { selector }: { selector?: string } = {}) => {
  const [layout, setLayout] = useState(layouts[0]!);
  useLayoutEffect(() => {
    if (!box) return undefined;
    const own = [...new Set(layouts.flatMap((l) => l.split(' ')).filter(Boolean))];
    let size = '';
    const pick = () => {
      const key = `${box.clientWidth}x${box.clientHeight}`;
      if (key === size || !box.clientHeight) return;
      size = key;
      const value = selector ? box.querySelector<HTMLElement>(selector) : null;
      const shrunk = value?.style.fontSize ?? '';
      if (value) value.style.fontSize = '';
      const kept = own.filter((c) => box.classList.contains(c));
      let chosen = layouts[layouts.length - 1]!;
      for (const l of layouts) {
        box.classList.remove(...own);
        if (l) box.classList.add(...l.split(' '));
        if (box.scrollHeight <= box.clientHeight + 1) {
          chosen = l;
          break;
        }
      }
      box.classList.remove(...own);
      if (kept.length) box.classList.add(...kept);
      if (value) value.style.fontSize = shrunk;
      setLayout(chosen);
    };
    pick();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(pick);
    observer?.observe(box);
    return () => observer?.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, box]);
  return layout;
};
