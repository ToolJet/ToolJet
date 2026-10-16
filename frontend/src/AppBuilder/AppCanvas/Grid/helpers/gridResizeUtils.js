/**
 * Returns the inline styles needed while resizing a FlexContainer child.
 * Live dimensions stay unsnapped so the rendered edge remains aligned with
 * Moveable's control box. Grid snapping is applied when the resize is committed.
 */
export function computeFlexResizeStyles({ direction, parentDirection, width, height, gridHeight }) {
  const isHorizontalResize = Boolean(direction?.[0]);
  const isVerticalResize = Boolean(direction?.[1]);
  const liveWidth = Math.max(gridHeight, width ?? gridHeight);
  const liveHeight = Math.max(gridHeight, height ?? gridHeight);
  const styles = {};

  if (isHorizontalResize) {
    styles.width = `${liveWidth}px`;
    if (parentDirection === 'row') styles.flexBasis = `${liveWidth}px`;
  }
  if (isVerticalResize) {
    styles.height = `${liveHeight}px`;
    if (parentDirection !== 'row') styles.flexBasis = `${liveHeight}px`;
  }

  return styles;
}

/**
 * Resolves the layout patch committed when a FlexContainer child finishes resizing.
 * A click on a resizer/edge fires resizeEnd with no lastEvent (no drag happened); in that
 * case we return null so the caller skips committing a phantom resize that would otherwise
 * snap the child down to grid-minimum dimensions.
 */
export function computeFlexResizeEndPatch({ lastEvent, gridHeight }) {
  if (!lastEvent) return null;
  const isHorizontalResize = Boolean(lastEvent.direction?.[0]);
  const isVerticalResize = Boolean(lastEvent.direction?.[1]);
  if (!isHorizontalResize && !isVerticalResize) return null;

  const patch = {};

  if (isHorizontalResize) {
    patch.widthPx = Math.max(gridHeight, Math.round((lastEvent.width ?? gridHeight) / gridHeight) * gridHeight);
    patch.fillWidth = false;
  }
  if (isVerticalResize) {
    patch.height = Math.max(gridHeight, Math.round((lastEvent.height ?? gridHeight) / gridHeight) * gridHeight);
  }

  return patch;
}

/**
 * Converts a resize-stop event's raw x/y pixel offsets into grid position units,
 * clamping both axes to the canvas's top-left boundary (0,0).
 */
export function computeResizeStopPosition({ x, y, gw, gridHeight }) {
  let top = Math.round(y / gridHeight) * gridHeight;
  if (top < 0) top = 0;

  let left = Math.round(x / gw);
  if (left < 0) left = 0;

  return { top, left };
}

/**
 * Clamps a resize-end pixel translate to the canvas's bounds so it can be written
 * straight to the DOM without waiting on a store round-trip to correct it. Needed
 * because a widget already sitting at a boundary produces an unchanged store value
 * (e.g. left: 0 -> 0), which skips the re-render that would otherwise fix the transform.
 * Omit `maxY` for the main canvas, which grows downward; bounding y by the visible height would shift a
 * widget stretched past the visible bottom upward. Nested widgets are returned unchanged.
 */
export function clampResizeTranslate({ x, y, maxX = Infinity, maxY = Infinity, isNested = false }) {
  if (isNested) return { x, y };
  return {
    x: Math.max(0, Math.min(x, maxX)),
    y: Math.max(0, Math.min(y, maxY)),
  };
}

/**
 * Clamps a resized box to the canvas borders while keeping the opposite edge fixed: overshoot past the
 * left/top border is removed from the width/height instead of only pinning x/y to 0, and a size that
 * would cross the right/bottom border is capped. Omit `containerHeight` for canvases that grow downward.
 * Widgets nested in a Container/Form keep their original resize behaviour: those canvases scroll and are
 * padded, so their client box is not a reliable border and clamping against it crunches the widget.
 */
export function clampResizeToCanvas({
  x,
  y,
  width,
  height,
  containerWidth,
  containerHeight = Infinity,
  isNested = false,
}) {
  if (isNested) return { x, y, width, height };
  if (x < 0) {
    width += x;
    x = 0;
  }
  if (y < 0) {
    height += y;
    y = 0;
  }
  return {
    x,
    y,
    width: Math.min(width, Math.max(0, containerWidth - x)),
    height: Math.min(height, Math.max(0, containerHeight - y)),
  };
}
