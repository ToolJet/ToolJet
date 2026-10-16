/**
 * Resizing a FlexContainer child. Its container lays it out, so a resize sets its fixed size (`widthPx`, `height`)
 * rather than grid columns: snapped to GRID_HEIGHT px both while resizing and when saved, so the two agree.
 */
import { ROW, snapRow } from './geometry';

/** Size after a resize: `axes` from the handle ([x, y], 0 = that axis untouched), `width`/`height` in px. */
const snapped = ({ width, height }) => ({
  width: Math.max(ROW, snapRow(width)),
  height: Math.max(ROW, snapRow(height)),
});

/** Inline styles that show the child at that size; `flexBasis` follows the container's main axis. */
export const flexResizeStyles = (size, containerDirection = 'column') => {
  const [ax, ay] = size.axes;
  const { width, height } = snapped(size);
  const styles = {};
  if (ax) {
    styles.width = `${width}px`;
    if (containerDirection === 'row') styles.flexBasis = `${width}px`;
  }
  if (ay) {
    styles.height = `${height}px`;
    if (containerDirection !== 'row') styles.flexBasis = `${height}px`;
  }
  return styles;
};

/** The layout change to save, or null when the handle touched neither axis. */
export const flexResizePatch = (size) => {
  const [ax, ay] = size.axes;
  if (!ax && !ay) return null;
  const { width, height } = snapped(size);
  const patch = {};
  if (ax) Object.assign(patch, { widthPx: width, fillWidth: false });
  if (ay) patch.height = height;
  return patch;
};
