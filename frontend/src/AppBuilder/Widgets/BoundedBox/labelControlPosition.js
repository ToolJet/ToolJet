// Label (and delete) controls sit under their annotation; keep them inside the widget: near the right edge they
// slide left, near the bottom edge they move up over the annotation instead of hanging below the widget.
const CONTROL_MIN_WIDTH = '125px';
const CONTROL_HEIGHT = '38px';

export const getLabelControlPosition = (geometry) => ({
  position: 'absolute',
  left: `clamp(0px, ${geometry.x}%, calc(100% - max(${geometry.width}%, ${CONTROL_MIN_WIDTH})))`,
  top: `min(${geometry.y + geometry.height}%, calc(100% - ${CONTROL_HEIGHT}))`,
  width: `${geometry.width}%`,
  minWidth: CONTROL_MIN_WIDTH,
});
