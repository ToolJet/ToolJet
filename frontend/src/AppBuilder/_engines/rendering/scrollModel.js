import { maxListHeight } from './sizeIndex';

/**
 * Where a long list's items are for its scroll position.
 *
 * A list element can't be taller than the browser allows (~33M px in Chrome), so a list of millions of rows is drawn in
 * a shorter element and its scroll position is mapped to an `offset` into all the items: the items at `offset` show at
 * the top of the viewport. Up to that height the two are the same (scale 1).
 *
 * When scaled, how the scroll position moved decides the offset:
 * - Wheel, touch, keys, focus and anything else move the items 1:1: exactly what the browser has already shown on
 *   screen, so nothing leaps, whatever the distance or speed.
 * - Dragging the scrollbar maps proportionally, from where the drag started, so the thumb's ends are the list's ends.
 * - The very top and bottom are the first and last items.
 * Scrolling 1:1 leaves the thumb a little off from the items it shows. When scrolling stops and an end is near, the
 * thumb is put back where 1:1 scrolling reaches the end together with the items (`resync`) — moved by a fraction of a
 * pixel of its track, and the items stay where they are (see `windowTop`).
 */

// How far, in viewports, wheel and keys always scroll 1:1 before an end of the scroll range: resync keeps at least this
// much room (or the room the items need, if less).
export const ROOM_VIEWPORTS = 100;

// Items are placed relative to an anchor that moves in steps of this many px, so their positions stay small numbers
// the browser can lay out, and change only when the anchor moves.
export const ANCHOR_STEP = 1 << 20;

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

/**
 * The list element's height, and how scroll positions map to offsets: `scale` 1 when it fits, else
 * `(maxOffset / maxTop)`: scroll positions 0…maxTop cover offsets 0…maxOffset. `margin` is how far below the top of
 * the scroll element the list starts, under a header that stays in view (sticky): the items show in the viewport's
 * height less that.
 */
export const listShape = (total, viewportHeight, maxHeight = maxListHeight(), margin = 0) => {
  const height = Math.min(total, maxHeight);
  const maxTop = Math.max(0, margin + height - viewportHeight);
  const maxOffset = Math.max(0, total - (viewportHeight - margin));
  const scale = total > maxHeight && maxTop > 0 ? maxOffset / maxTop : 1;
  return { height, scale, maxTop, maxOffset };
};

/** The anchor that items around `offset` are placed against (0 when the list fits). */
export const anchorOf = (shape, offset) => (shape.scale === 1 ? 0 : offset - (offset % ANCHOR_STEP));

/**
 * Where an item's top goes, given its offset from the anchor (`start`): px inside the list element for a list that fits;
 * else relative to the `--tj-window-top` property the list's element carries (see `windowTop`).
 */
export const itemTop = (shape, start) =>
  shape.scale === 1 ? `${start}px` : `calc(var(--tj-window-top, 0px) + ${start}px)`;

/** The `--tj-window-top` that places the items of `anchor` for scroll position `top` and `offset`. */
export const windowTop = (top, offset, anchor) => `${top - offset + anchor}px`;

/** Where the scroll position is (`top`) and which offset it shows (`offset`), and how they move. */
export const createScrollModel = () => {
  let top = 0;
  let offset = 0;
  // Where a scrollbar drag started, while it lasts.
  let drag = null;
  // A scroll position set here (resync, scrollTo, adjust): its scroll event changes nothing.
  let expected = null;

  const dragged = (shape, start, next) => {
    if (next <= start.top) return start.top <= 0 ? 0 : start.offset * (next / start.top);
    const rest = shape.maxTop - start.top;
    return rest <= 0 ? shape.maxOffset : start.offset + (shape.maxOffset - start.offset) * ((next - start.top) / rest);
  };

  // A scroll position, as close to `wanted` as keeps ROOM_VIEWPORTS of 1:1 room toward each end (or what the items
  // need, when they are closer to it).
  const roomy = (shape, wanted, viewportHeight) => {
    const room = ROOM_VIEWPORTS * viewportHeight;
    const low = Math.min(offset, room);
    const high = shape.maxTop - Math.min(shape.maxOffset - offset, room);
    return Math.round(low <= high ? clamp(wanted, low, high) : offset / shape.scale);
  };

  return {
    get top() {
      return top;
    },
    get offset() {
      return offset;
    },
    get dragging() {
      return drag !== null;
    },
    /** A scrollbar drag starts: until `endDrag`, the scroll position maps proportionally. */
    beginDrag() {
      drag = { top, offset };
    },
    endDrag() {
      drag = null;
    },
    /** The list scrolled to `next`: returns the offset shown there. */
    follow(shape, next) {
      if (expected !== null && Math.abs(next - expected) < 1) {
        expected = null;
        top = next;
        return offset;
      }
      expected = null;
      if (shape.scale === 1) offset = next;
      else if (next <= 0) offset = 0;
      else if (next >= shape.maxTop) offset = shape.maxOffset;
      else if (drag) offset = dragged(shape, drag, next);
      else offset = clamp(offset + (next - top), 0, shape.maxOffset);
      top = next;
      return offset;
    },
    /** The list changed size: keeps the offset in range. */
    reshape(shape) {
      if (shape.scale === 1) offset = top;
      else offset = clamp(offset, 0, shape.maxOffset);
    },
    /**
     * When scrolling has stopped: the scroll position to set so wheel and keys reach both ends 1:1 together with the
     * items, or null when it already does.
     */
    resync(shape, viewportHeight) {
      if (shape.scale === 1 || drag) return null;
      const next = roomy(shape, top, viewportHeight);
      if (Math.abs(next - top) < 1) return null;
      top = next;
      expected = next;
      return next;
    },
    /** Shows `target` at the top: returns the scroll position to set. */
    scrollTo(shape, target, viewportHeight) {
      offset = clamp(target, 0, shape.maxOffset);
      top = shape.scale === 1 ? offset : roomy(shape, offset / shape.scale, viewportHeight);
      expected = top;
      return top;
    },
    /**
     * Items above the view changed height by `delta`: moves the offset with them, so the items in view stay put.
     * Returns the scroll position to set (for a list that fits) or null.
     */
    adjust(shape, delta) {
      if (shape.scale === 1) {
        top += delta;
        offset = top;
        expected = top;
        return top;
      }
      offset = clamp(offset + delta, 0, shape.maxOffset);
      return null;
    },
  };
};
