import { getLabelControlPosition } from '../labelControlPosition';

// The label control under an annotation must stay inside the widget near its right and bottom edges.
describe('[BoundedBox-POS-001] label control position', () => {
  // Break this catches: placing the control at the annotation's left/bottom with a 125px minimum width and no
  // clamp, so near the right edge it covers the neighbour and near the bottom it hangs below the widget.
  test('[BoundedBox-POS-001] is clamped to the widget on both axes', () => {
    const style = getLabelControlPosition({ x: 92, y: 85, width: 6, height: 10 });

    expect(style.left).toBe('clamp(0px, 92%, calc(100% - max(6%, 125px)))');
    expect(style.top).toBe('min(95%, calc(100% - 38px))');
    expect(style.width).toBe('6%');
    expect(style.minWidth).toBe('125px');
  });
});
