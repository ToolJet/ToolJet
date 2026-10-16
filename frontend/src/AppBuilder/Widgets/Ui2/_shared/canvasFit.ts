import { useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

// ToolJet UI 2.0: a repeated canvas (a List view row, a custom Kanban card) that fits its components.
// The native Listview grows its rows through the core reflow, which special-cases its own type; the pack's rows stayed
// at rowHeight (cardHeight), so a child that grew (a long text, an opened accordion, a carousel) was cut off.

const BOTTOM_PADDING = 8;

/** The canvas element's ref and its height: `base`, or (when `enabled`) as tall as the bottom of its own components
 *  (`ownerSelector` keeps a nested list's rows to themselves), never below `base` unless `shrink` (a Kanban card fits
 *  its content both ways when part of it is hidden: drawn at 272px for expandable details, a collapsed deal card stayed
 *  272px and mostly empty). */
const MIN_SHRUNK = 40;
export const useCanvasFit = (
  enabled: boolean,
  base: number,
  ownerSelector?: string,
  { shrink = false }: { shrink?: boolean } = {}
): [RefObject<HTMLDivElement>, number] => {
  const ref = useRef<HTMLDivElement>(null);
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
        let anyHidden = false;
        el.querySelectorAll('[class*="ele-"]').forEach((w) => {
          if (ownerSelector && w.parentElement?.closest(ownerSelector) !== el) return;
          // A component whose content is not drawn (hidden in this row or card) keeps a slot the size of its layout:
          // collapseWhenHidden is decided once per component, not per row, so it does not count here.
          const content = w.querySelector('.canvas-component')?.firstElementChild;
          if (content && content.getBoundingClientRect().height === 0) {
            anyHidden = true;
            return;
          }
          const r = w.getBoundingClientRect();
          if (r.height > 0) bottom = Math.max(bottom, r.bottom - top);
        });
        const fitted = Math.ceil(bottom + BOTTOM_PADDING);
        // Below the set height only when something in it is hidden (an expandable card's details): a card without
        // hidden parts keeps the height its author set (cardHeight).
        const next = shrink && anyHidden ? Math.max(MIN_SHRUNK, fitted) : Math.max(base, fitted);
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
  }, [enabled, base, ownerSelector, shrink]);
  return [ref, enabled ? height : base];
};
