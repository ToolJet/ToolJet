import { CANVAS_HEADER_ID, CANVAS_FOOTER_ID } from '../appCanvasConstants';

// Decision logic behind EditorSelecto's marquee (Selecto.jsx). Kept here as pure
// functions because the drag itself is Cypress territory, so this is the layer a
// unit test can actually call rather than mirror.

const MAIN_CANVAS_ID = 'canvas';

/**
 * Which canvas a marquee belongs to, from the element the drag started on.
 *
 * Returns null for the main canvas (its widgets have no `parent`), otherwise the
 * id that this canvas's children carry as their `parent`.
 */
export const resolveMarqueeCanvasId = (target) => {
  const componentId = target.getAttribute('component-id');

  // The header/footer slot IS the canvas its widgets live in having parent id: 'canvas-header' / 'canvas-footer'.
  // Read it off component-id rather than the closest .real-canvas, since a drag starting in the
  // slot's padding sits outside the inner .real-canvas and would otherwise resolve to the main canvas.
  if (componentId === CANVAS_HEADER_ID || componentId === CANVAS_FOOTER_ID) return componentId;
  if (componentId === MAIN_CANVAS_ID) return null;

  return target.closest('.real-canvas')?.getAttribute('data-parentId') ?? null;
};

/**
 * Whether a widget belongs to the canvas the marquee was drawn on.
 *
 * react-selecto matches by bounding-rect intersection and ignores overflow clipping, so a widget
 * scrolled out of view inside another container can still sit under the selection box. Scoping by
 * parent keeps the selection (and any follow-up delete) from leaking across canvas boundaries, and
 * inherently excludes the container being drawn inside, whose own parent is one level up.
 */
export const isInMarqueeCanvas = (parentId, startCanvasId) =>
  !startCanvasId || startCanvasId === MAIN_CANVAS_ID ? !parentId : parentId === startCanvasId;

/**
 * Fold the marquee's own hits into the existing selection.
 *
 * Only the hits are scoped: a selection the user already made in another canvas is deliberately
 * kept, because scoping the merged list would silently drop it.
 */
export const mergeMarqueeSelection = (scopedIds, currentSelection, isMultiSelect) =>
  isMultiSelect ? [...currentSelection.filter((id) => !scopedIds.includes(id)), ...scopedIds] : scopedIds;
