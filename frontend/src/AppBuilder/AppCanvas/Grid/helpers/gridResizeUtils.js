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
 * The height a grid widget keeps when a resize ends. Only a resize that moves a top or bottom edge changes it (snapped
 * to whole rows); a width-only resize keeps the saved height. It used to snap the box to the nearest row even then:
 * a 36px Button resized sideways showed a 40px box while its saved height stayed 36, so it drew at 36 inside a 40px
 * box and went back to 36 on reload.
 */
export function gridResizeEndHeight({ direction, lastHeight, currentHeight, topAlignmentAddedHeight = 0, gridHeight }) {
  if (!direction?.[1]) return currentHeight;
  return Math.max(gridHeight, Math.round((lastHeight - topAlignmentAddedHeight) / gridHeight) * gridHeight);
}
