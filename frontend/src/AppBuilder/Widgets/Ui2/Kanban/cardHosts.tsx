import React, { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import type { BoardColumn } from './kanbanBoard';

// A card keeps one element for its life on the board, wherever it is drawn: the board renders every card into its own
// host element (a portal), and the column it sits in only places that host (CardSlot). Rendered by its column, a card
// that changed column was a new element there: a custom card's components mounted again from their defaults and lost
// what was typed in them. A reorder in a column never had this, since the column kept the element.

/** Each card's host element, by card key, made on first use; a card's host goes when the card leaves the board. */
export const useCardHosts = (columns: BoardColumn[]) => {
  const hosts = useRef(new Map<string, HTMLDivElement>());
  const hostOf = useCallback((key: string) => {
    let host = hosts.current.get(key);
    if (!host) {
      host = document.createElement('div');
      // The card itself is the box in its slot.
      host.style.display = 'contents';
      hosts.current.set(key, host);
    }
    return host;
  }, []);
  useEffect(() => {
    const keys = new Set(columns.flatMap((column) => column.cards.map((card) => card.__key)));
    for (const key of [...hosts.current.keys()]) if (!keys.has(key)) hosts.current.delete(key);
  }, [columns]);
  return hostOf;
};

/** Where a card sits in its column: it holds the card's host. A layout effect, so the host is in place before the
 *  card (rendered after the columns) measures itself, and before paint. */
export const CardSlot = ({ host }: { host: HTMLDivElement }) => {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const slot = ref.current;
    if (!slot) return undefined;
    slot.appendChild(host);
    // A card that moved is already in its new slot.
    return () => {
      if (host.parentNode === slot) slot.removeChild(host);
    };
  }, [host]);
  return <div ref={ref} />;
};
