import { useEffect, useMemo } from 'react';
import type React from 'react';
import type { BoardColumn } from './board';

// A touch move for a Kanban card. Phone browsers start no HTML drag from a touch, so a board that only listens for
// dragstart/dragover/drop cannot be rearranged on a phone. A long press (LONG_PRESS_MS, cancelled by moving more than
// MOVE_SLOP first, so a swipe still scrolls the board) picks the card up; moving the finger reports the point under it
// for the board to draw the same drop line as a mouse drag; lifting it drops the card through the same move. Cards are
// found by their data-kb-card (the card's key) and columns by data-kb-col (the column id). The same file in every pack
// (keep the copies the same).

export const LONG_PRESS_MS = 400;
export const MOVE_SLOP = 8;
// Within this many pixels of the board's or a column list's edge, a held card scrolls it.
const EDGE = 36;
const EDGE_STEP = 10;

export type DropPoint = { columnId: string; before: string | null };

export type TouchDragOptions = {
  /** Off when dragging is not allowed (allowDrag false, disabled, loading). */
  enabled: boolean;
  onPick: (key: string) => void;
  /** The finger is at (x, y) in the viewport. */
  onOver: (x: number, y: number) => void;
  onDrop: (key: string) => void;
  onCancel: () => void;
};

type Root = Document | ShadowRoot;
const rootOf = (el: Element): Root => {
  const node = el.getRootNode();
  return node instanceof ShadowRoot ? node : document;
};

/** Where a card held at (x, y) over `board` would land: before a card (its upper half) or after it, or a column's end. */
export const dropPointAt = (board: HTMLElement | null, columns: BoardColumn[], x: number, y: number): DropPoint | null => {
  if (!board) return null;
  const hit = rootOf(board).elementFromPoint?.(x, y) ?? null;
  if (!hit || !board.contains(hit)) return null;
  const col = hit.closest<HTMLElement>('[data-kb-col]');
  if (!col || !board.contains(col)) return null;
  const columnId = col.getAttribute('data-kb-col') ?? '';
  const column = columns.find((c) => c.id === columnId);
  if (!column) return null;
  const card = hit.closest<HTMLElement>('[data-kb-card]');
  if (!card || !col.contains(card)) return { columnId, before: null };
  const key = card.getAttribute('data-kb-card') ?? '';
  const at = column.cards.findIndex((c) => c.__key === key);
  if (at < 0) return { columnId, before: null };
  const rect = card.getBoundingClientRect();
  return { columnId, before: y < rect.top + rect.height / 2 ? key : column.cards[at + 1]?.__key ?? null };
};

const scrollable = (el: HTMLElement, axis: 'x' | 'y') => {
  const style = getComputedStyle(el);
  const overflow = axis === 'x' ? style.overflowX : style.overflowY;
  return /(auto|scroll)/.test(overflow) && (axis === 'x' ? el.scrollWidth > el.clientWidth : el.scrollHeight > el.clientHeight);
};
// Scroll `el` along `axis` when (x, y) is near its edge; whether it moved.
const edgeScroll = (el: HTMLElement, axis: 'x' | 'y', x: number, y: number) => {
  if (!scrollable(el, axis)) return false;
  const r = el.getBoundingClientRect();
  const [p, lo, hi] = axis === 'x' ? [x, r.left, r.right] : [y, r.top, r.bottom];
  const step = p < lo + EDGE ? -EDGE_STEP : p > hi - EDGE ? EDGE_STEP : 0;
  if (!step) return false;
  const before = axis === 'x' ? el.scrollLeft : el.scrollTop;
  if (axis === 'x') el.scrollLeft += step;
  else el.scrollTop += step;
  return (axis === 'x' ? el.scrollLeft : el.scrollTop) !== before;
};

// The browser decides at a touch's start whether it may hold back the touch's moves, and in ToolJet's widget shadow
// roots a listener on the board did not count (the touch arrived uncancelable and the first move after a long press
// started a scroll, pointercancel). One document listener, not passive, while any board is mounted: it holds back a
// move only while a card is held.
let held = 0;
let boards = 0;
const holdMove = (e: TouchEvent) => {
  if (held > 0 && e.cancelable) e.preventDefault();
};
const noop = () => {};
const addBoard = () => {
  if (boards++ === 0) {
    document.addEventListener('touchstart', noop, { passive: false });
    document.addEventListener('touchmove', holdMove, { passive: false });
  }
};
const removeBoard = () => {
  if (--boards === 0) {
    document.removeEventListener('touchstart', noop);
    document.removeEventListener('touchmove', holdMove);
  }
};

const bind = (root: HTMLElement, opts: React.MutableRefObject<TouchDragOptions>) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let frame = 0;
  let key: string | null = null;
  let card: HTMLElement | null = null;
  let start = { x: 0, y: 0 };
  let at = { x: 0, y: 0 };
  let pointerId = -1;
  let dragging = false;
  let swallowClick = false;
  const cardStyle = { userSelect: '', webkitUserSelect: '', webkitTouchCallout: '' };
  let wasDraggable = false;

  const holdCard = (el: HTMLElement | null) => {
    const s = el?.style as (CSSStyleDeclaration & { webkitTouchCallout?: string }) | undefined;
    if (!s) return;
    // No text selection or callout from the long press itself.
    cardStyle.userSelect = s.userSelect;
    cardStyle.webkitUserSelect = s.webkitUserSelect;
    cardStyle.webkitTouchCallout = s.webkitTouchCallout ?? '';
    s.userSelect = 'none';
    s.webkitUserSelect = 'none';
    s.webkitTouchCallout = 'none';
    // A long press on an HTML-draggable element is the browser's own gesture (a drag it may not finish, a context
    // menu): it cancels the pointer and turns the touch's moves uncancelable. The held card is not draggable meanwhile.
    wasDraggable = el!.draggable;
    el!.draggable = false;
  };
  const releaseCard = () => {
    const s = card?.style as (CSSStyleDeclaration & { webkitTouchCallout?: string }) | undefined;
    if (s) {
      s.userSelect = cardStyle.userSelect;
      s.webkitUserSelect = cardStyle.webkitUserSelect;
      s.webkitTouchCallout = cardStyle.webkitTouchCallout;
    }
    if (card && wasDraggable) card.draggable = true;
    wasDraggable = false;
  };
  const stop = () => {
    if (timer) clearTimeout(timer);
    timer = undefined;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    releaseCard();
    if (dragging) {
      root.removeAttribute('data-kb-touch-drag');
      held -= 1;
    }
    dragging = false;
    key = null;
    card = null;
    pointerId = -1;
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onPointerCancel);
  };
  // While a card is held near an edge, keep scrolling the board (sideways) and the column list under the finger.
  const tick = () => {
    frame = 0;
    if (!dragging) return;
    let moved = edgeScroll(root, 'x', at.x, at.y);
    const hit = rootOf(root).elementFromPoint?.(at.x, at.y) ?? null;
    for (let el = hit instanceof HTMLElement ? hit : null; el && el !== root && root.contains(el); el = el.parentElement) {
      if (scrollable(el, 'y')) {
        moved = edgeScroll(el, 'y', at.x, at.y) || moved;
        break;
      }
    }
    if (moved) opts.current.onOver(at.x, at.y);
    frame = requestAnimationFrame(tick);
  };
  const pick = () => {
    timer = undefined;
    if (!key || !opts.current.enabled) return stop();
    dragging = true;
    held += 1;
    root.setAttribute('data-kb-touch-drag', '');
    window.getSelection?.()?.removeAllRanges();
    opts.current.onPick(key);
    opts.current.onOver(at.x, at.y);
    if (typeof requestAnimationFrame === 'function') frame = requestAnimationFrame(tick);
  };
  const onDown = (e: PointerEvent) => {
    if (e.pointerType !== 'touch' || e.isPrimary === false || pointerId !== -1) return;
    if (!opts.current.enabled) return;
    const target = e.target instanceof Element ? e.target : null;
    const el = target?.closest<HTMLElement>('[data-kb-card]') ?? null;
    if (!el || !root.contains(el)) return;
    // A press on a control inside the card (delete, show more, a custom card's field) is that control's.
    const control = target?.closest('button, a[href], input, textarea, select, [contenteditable="true"]');
    if (control && el.contains(control)) return;
    key = el.getAttribute('data-kb-card');
    card = el;
    pointerId = e.pointerId;
    start = { x: e.clientX, y: e.clientY };
    at = start;
    holdCard(el);
    timer = setTimeout(pick, LONG_PRESS_MS);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onPointerCancel);
  };
  const onMove = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    at = { x: e.clientX, y: e.clientY };
    if (!dragging) {
      // Moved before the long press: a scroll or a swipe, not a pick up.
      if (Math.hypot(at.x - start.x, at.y - start.y) > MOVE_SLOP) stop();
      return;
    }
    opts.current.onOver(at.x, at.y);
  };
  const onUp = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    const lifted = dragging ? key : null;
    stop();
    if (!lifted) return;
    // The lift that drops a card is not also a tap on it.
    swallowClick = true;
    setTimeout(() => (swallowClick = false), 400);
    if (opts.current.enabled) opts.current.onDrop(lifted);
    else opts.current.onCancel();
  };
  const onPointerCancel = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    const was = dragging;
    stop();
    if (was) opts.current.onCancel();
  };
  const onContextMenu = (e: Event) => {
    if (key) e.preventDefault();
  };
  const onClick = (e: Event) => {
    if (!swallowClick) return;
    swallowClick = false;
    e.preventDefault();
    e.stopPropagation();
  };
  // A browser that does start an HTML drag from the touch (it fires dragstart) moves the card its own way.
  const onDragStart = () => {
    if (key) stop();
  };
  root.addEventListener('pointerdown', onDown);
  addBoard();
  root.addEventListener('contextmenu', onContextMenu);
  root.addEventListener('click', onClick, true);
  root.addEventListener('dragstart', onDragStart, true);
  return () => {
    stop();
    root.removeEventListener('pointerdown', onDown);
    removeBoard();
    root.removeEventListener('contextmenu', onContextMenu);
    root.removeEventListener('click', onClick, true);
    root.removeEventListener('dragstart', onDragStart, true);
  };
};

/** A ref for the board element that binds long-press touch moves to it whenever React attaches it (a board can mount
 *  after its owner rendered, inside a provider that waits for its popup container). `options` is read at each event. */
export const useTouchDragRef = <T extends HTMLElement = HTMLDivElement>(options: React.MutableRefObject<TouchDragOptions>) => {
  const ref = useMemo(() => {
    let el: T | null = null;
    let off: (() => void) | null = null;
    return {
      get current() {
        return el;
      },
      set current(next: T | null) {
        if (next === el) return;
        off?.();
        off = null;
        el = next;
        if (el) off = bind(el, options);
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(
    () => () => {
      ref.current = null;
    },
    [ref]
  );
  return ref as React.MutableRefObject<T | null>;
};

/** Touch off: what a board's options hold until its first render sets them. */
export const NO_TOUCH: TouchDragOptions = { enabled: false, onPick: () => {}, onOver: () => {}, onDrop: () => {}, onCancel: () => {} };
