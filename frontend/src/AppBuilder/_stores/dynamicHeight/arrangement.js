import { buildBlockers, sortBoxes } from './solver';

// ─────────────────────────────────────────────────────────────────────────────
// A canvas's arrangement, kept between passes.
//
// Placing a canvas has two parts (solver.js): the arrangement (the boxes in
// saved order, and which box can push which) and the tops (where each box is
// drawn for the heights of this pass). The arrangement depends only on saved
// layouts, so it is the same from pass to pass while nobody edits the canvas,
// yet it is most of the work: sorting, then a sweep over every column.
//
// So it is kept per page and per canvas, and reused while every box still has
// the same saved inputs. Nothing is trusted blindly: the boxes are compared
// field by field (cheap next to building it again), and an edited page is a
// new components object, which never finds the old page's arrangements.
// ─────────────────────────────────────────────────────────────────────────────

// Every input the arrangement is built from (solver.js reads these and nothing else).
const sameBox = (a, b) =>
  a.id === b.id &&
  a.top === b.top &&
  a.left === b.left &&
  a.width === b.width &&
  a.height === b.height &&
  a.collapsible === b.collapsible &&
  a.updatedAt === b.updatedAt;

const sameBoxes = (a, b) => a.length === b.length && a.every((box, index) => sameBox(box, b[index]));

export const createArrangementCache = () => {
  // page (its components object) → canvas key → { boxes, sorted, blockers }
  const byPage = new WeakMap();

  /**
   * The canvas's boxes in saved order and their blockers (solver.js), built again only when a box changed.
   *
   * @param {object} page  the page's components object: a new one after every edit
   * @param {string} canvasKey  which canvas on the page
   * @param {Array<object>} boxes  the canvas's boxes, in a stable order (the page's)
   */
  const arrange = (page, canvasKey, boxes) => {
    let byCanvas = byPage.get(page);
    if (!byCanvas) {
      byCanvas = new Map();
      byPage.set(page, byCanvas);
    }
    const kept = byCanvas.get(canvasKey);
    if (kept && sameBoxes(kept.boxes, boxes)) return kept;

    const sorted = sortBoxes(boxes);
    const arrangement = { boxes, sorted, blockers: buildBlockers(sorted) };
    byCanvas.set(canvasKey, arrangement);
    return arrangement;
  };

  return { arrange };
};
