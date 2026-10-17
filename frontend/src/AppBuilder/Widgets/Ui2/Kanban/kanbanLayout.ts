import { closestCorners, pointerWithin } from '@dnd-kit/core';
import type { CollisionDetection } from '@dnd-kit/core';
import type { BoardCard, CardRow } from './kanbanBoard';

// The Kanban's small helpers: how it reads a field name, sizes its columns and finds where a drop lands.

// A field name is text (or a number): anything else bound there (a list of rows) was turned into a 150 KB key for
// every card, which froze the board.
export const fieldName = (value: unknown, fallback: string): string =>
  typeof value === 'string' && value.trim() ? value : typeof value === 'number' ? String(value) : fallback;

/** The narrowest a column gets before the board scrolls: 200px, 160px on a board of six or more stages, and down to
 *  140px when that lets every stage fit the board (three stages in a 620px half of a page cut the third at the edge,
 *  2026-10-14). 16px gaps between columns. */
export const columnMinimum = (count: number, boardWidth: number): number => {
  const base = count >= 6 ? 160 : 200;
  if (!(boardWidth > 0) || count < 1) return base;
  const share = Math.floor((boardWidth - 16 * (count - 1)) / count);
  return Math.max(140, Math.min(base, share));
};

export const strip = (card: BoardCard | null): CardRow => {
  if (!card) return {};
  const { __key, ...plain } = card;
  return plain;
};

export const RIGHT_FADE = {
  maskImage: 'linear-gradient(to right, #000 calc(100% - 48px), transparent)',
  WebkitMaskImage: 'linear-gradient(to right, #000 calc(100% - 48px), transparent)',
};

/** Where a drop lands: what is under the pointer, a card first, then a column (a folded column is a 44px strip that
 *  closestCorners passed over for a card nearby, so drops on it were lost); off the board, the nearest corners. */
export const kanbanCollision: CollisionDetection = (args) => {
  const within = pointerWithin(args);
  const cards = within.filter((c) => c.data?.droppableContainer?.data?.current?.type === 'card');
  if (cards.length) return cards;
  return within.length ? within : closestCorners(args);
};
