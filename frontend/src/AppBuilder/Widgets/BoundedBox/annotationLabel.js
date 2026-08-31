/**
 * Height reserved for an annotation's label row, in px.
 *
 * The row is a react-select plus a delete button; ~40px covers it at every
 * density the widget renders at. It only decides which side of the annotation
 * the label is anchored to, so being a few px out shifts the flip threshold
 * slightly rather than mispositioning anything.
 */
export const ANNOTATION_LABEL_HEIGHT = 40;

/**
 * Where to anchor an annotation's label.
 *
 * Labels sit under their annotation box, positioned as a percentage of the
 * image. They are absolutely positioned, so they add no height to the widget,
 * and no ancestor clips overflow — a label under an annotation near the bottom
 * of the image renders outside the widget box and over the components below it.
 *
 * When there is no room beneath, the label is flipped to sit above the box
 * instead. That keeps it inside the widget and usable, and needs no changes to
 * the grid's height bookkeeping.
 *
 * @param {{ y?: number, height?: number }} geometry annotation geometry, in %
 *        of the image. POINT annotations carry no height.
 * @param {number|undefined} containerHeight rendered image height in px, or
 *        undefined before BoundedBox has measured it.
 * @returns {{ top: string } | { bottom: string }} a CSS anchor
 */
export function annotationLabelPosition(geometry, containerHeight, labelHeight = ANNOTATION_LABEL_HEIGHT) {
  const y = Number.isFinite(geometry?.y) ? geometry.y : 0;
  const height = Number.isFinite(geometry?.height) ? geometry.height : 0;
  const below = y + height;

  const canMeasure = Number.isFinite(containerHeight) && containerHeight > 0;
  if (!canMeasure) return { top: `${below}%` };

  const labelPercent = (labelHeight / containerHeight) * 100;
  const overflowsBottom = below + labelPercent > 100;
  const hasRoomAbove = y - labelPercent >= 0;

  // Flipping is only an improvement when the label actually fits above; if it
  // does not, anchoring below keeps it adjacent to its own box.
  if (overflowsBottom && hasRoomAbove) return { bottom: `${100 - y}%` };

  return { top: `${below}%` };
}
