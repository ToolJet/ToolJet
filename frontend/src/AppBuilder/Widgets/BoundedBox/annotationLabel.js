export const ANNOTATION_LABEL_MIN_WIDTH = 125;
export const ANNOTATION_LABEL_HEIGHT = 40;

const percentage = (value) => (Number.isFinite(value) ? value : 0);

// Labels normally start at the annotation's left/bottom edges. When that
// crosses the image frame, align them to the opposite edges instead.
export function getAnnotationLabelStyle(
  geometry,
  containerSize,
  minWidth = ANNOTATION_LABEL_MIN_WIDTH,
  labelHeight = ANNOTATION_LABEL_HEIGHT
) {
  const x = percentage(geometry?.x);
  const y = percentage(geometry?.y);
  const width = percentage(geometry?.width);
  const height = percentage(geometry?.height);
  const defaultTop = `${y + height}%`;

  if (!Number.isFinite(containerSize?.width) || containerSize.width <= 0) {
    return { left: `${x}%`, top: defaultTop, width: `${width}%`, minWidth: `${minWidth}px` };
  }

  const annotationLeft = (x / 100) * containerSize.width;
  const annotationRight = ((x + width) / 100) * containerSize.width;
  const labelWidth = Math.min(Math.max((width / 100) * containerSize.width, minWidth), containerSize.width);
  const fitsRight = annotationLeft + labelWidth <= containerSize.width;
  const left = fitsRight ? annotationLeft : Math.max(0, annotationRight - labelWidth);

  if (!Number.isFinite(containerSize?.height) || containerSize.height <= 0) {
    return { left: `${left}px`, top: defaultTop, width: `${labelWidth}px` };
  }

  const annotationTop = (y / 100) * containerSize.height;
  const annotationBottom = ((y + height) / 100) * containerSize.height;
  const fitsBelow = annotationBottom + labelHeight <= containerSize.height;
  const top = fitsBelow ? annotationBottom : Math.max(0, annotationTop - labelHeight);

  return { left: `${left}px`, top: `${top}px`, width: `${labelWidth}px` };
}
