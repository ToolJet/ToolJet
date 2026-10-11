import { useLayoutEffect, useRef, useState } from 'react';

// shadcn/ui pack (experiment): a repeated canvas (a List view row, a custom Kanban card) that fits its components.
// The native Listview grows its rows through the core reflow, which special-cases its own type; the pack's rows stayed
// at rowHeight (cardHeight), so a child that grew (a long text, an opened accordion, a carousel) was cut off.

const BOTTOM_PADDING = 8;

/** The canvas element's ref and its height: `base`, or (when `enabled`) as tall as the bottom of its own components
 *  (`ownerSelector` keeps a nested list's rows to themselves), never below `base`. */
export const useCanvasFit = (enabled, base, ownerSelector) => {
  const ref = useRef(null);
  const [height, setHeight] = useState(base);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!enabled || !el || typeof MutationObserver === 'undefined') {
      setHeight(base);
      return undefined;
    }
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const top = el.getBoundingClientRect().top;
        let bottom = 0;
        el.querySelectorAll('[class*="ele-"]').forEach((w) => {
          if (ownerSelector && w.parentElement?.closest(ownerSelector) !== el) return;
          const r = w.getBoundingClientRect();
          if (r.height > 0) bottom = Math.max(bottom, r.bottom - top);
        });
        const next = Math.max(base, Math.ceil(bottom + BOTTOM_PADDING));
        setHeight((current) => (Math.abs(current - next) < 1 ? current : next));
      });
    };
    measure();
    // A component growing or moving changes its wrapper's style; a row's data arriving adds components.
    const observer = new MutationObserver(measure);
    observer.observe(el, { attributes: true, attributeFilter: ['style'], subtree: true, childList: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [enabled, base, ownerSelector]);
  return [ref, enabled ? height : base];
};
