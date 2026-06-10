/** Opposite-edge resize: left/top handle drags move the near edge, not the far edge. */
export function computeOppositeEdgeResizeTransform({
  direction,
  currentLeft,
  currentTop,
  currentWidthPx,
  currentHeight,
  newWidthPx,
  newHeightPx,
  gridWidth,
}) {
  const isLeftChanged = direction?.[0] === -1;
  const isTopChanged = direction?.[1] === -1;
  const diffWidth = newWidthPx - currentWidthPx;
  const diffHeight = newHeightPx - currentHeight;
  let transformX = currentLeft * gridWidth;
  let transformY = currentTop;
  if (isLeftChanged) {
    transformX -= diffWidth;
  }
  if (isTopChanged) {
    transformY -= diffHeight;
  }
  return { transformX, transformY };
}

/**
 * Resolves the layout patch committed when a FlexContainer child finishes resizing.
 * A click on a resizer/edge fires resizeEnd with no lastEvent (no drag happened); in that
 * case we return null so the caller skips committing a phantom resize that would otherwise
 * snap the child down to grid-minimum dimensions.
 */
export function computeFlexResizeEndPatch({ lastEvent, gridHeight }) {
  if (!lastEvent) return null;
  const snappedW = Math.max(gridHeight, Math.round((lastEvent.width ?? gridHeight) / gridHeight) * gridHeight);
  const snappedH = Math.max(gridHeight, Math.round((lastEvent.height ?? gridHeight) / gridHeight) * gridHeight);
  return { widthPx: snappedW, height: snappedH, fillWidth: false };
}
