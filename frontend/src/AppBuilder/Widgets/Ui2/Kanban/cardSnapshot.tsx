import React, { useLayoutEffect, useRef } from 'react';

/** A still copy of a custom card's canvas, for its drag preview: what the card shows now (its typed values), with
 *  nothing live in it. The preview drew the card's components a second time at the same card, and those copies
 *  published their defaults over the card's own values and took over its actions, so after the drag the card's
 *  components no longer answered their actions or the buttons beside them. Null when the card has no canvas yet. */
export const snapshotCard = (host: HTMLElement): HTMLElement | null => {
  const canvas = host.querySelector<HTMLElement>('[data-card-canvas]');
  if (!canvas) return null;
  // A copy keeps a field's typed value and checked state, not a select's chosen option.
  const copy = canvas.cloneNode(true) as HTMLElement;
  const chosen = canvas.querySelectorAll('select');
  copy.querySelectorAll('select').forEach((select, i) => {
    select.selectedIndex = chosen[i]?.selectedIndex ?? select.selectedIndex;
  });
  // No second element by the card's ids, no label naming the card's field, and no radio joining the card's group (a
  // checked one placed in the page would clear the card's own).
  for (const el of [copy, ...copy.querySelectorAll('*')]) {
    ['id', 'for', 'name', 'form', 'data-card-canvas'].forEach((attribute) => el.removeAttribute(attribute));
  }
  copy.setAttribute('aria-hidden', 'true');
  copy.setAttribute('inert', '');
  return copy;
};

/** Shows a snapshotCard copy. */
export const CardSnapshot = ({ node }: { node: HTMLElement | null }) => {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const box = ref.current;
    if (!box || !node) return undefined;
    box.appendChild(node);
    return () => {
      if (node.parentNode === box) box.removeChild(node);
    };
  }, [node]);
  return <div ref={ref} className="tw-pointer-events-none" />;
};
