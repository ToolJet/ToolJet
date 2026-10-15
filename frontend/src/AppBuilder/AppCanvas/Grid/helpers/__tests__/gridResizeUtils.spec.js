import {
  computeFlexResizeEndPatch,
  computeFlexResizeStyles,
  computeResizeStopPosition,
  clampResizeTranslate,
  clampResizeToCanvas,
} from '../gridResizeUtils';

describe('resize live-drag translate clamping', () => {
  it('clamps a translate that overshoots the left/top canvas edge back to the boundary', () => {
    // Break this catches: writing an unclamped resize-end transform straight to the DOM lets a
    // widget already sitting at left:0 escape past the left edge again, because the store value
    // (0 -> 0) doesn't change and so never triggers a corrective re-render.
    expect(clampResizeTranslate({ x: -42, y: -8, maxX: 500, maxY: 300 })).toEqual({ x: 0, y: 0 });
  });

  it('clamps a translate that overshoots the right/bottom canvas edge back to the boundary', () => {
    expect(clampResizeTranslate({ x: 600, y: 400, maxX: 500, maxY: 300 })).toEqual({ x: 500, y: 300 });
  });

  it('preserves an in-bounds translate unchanged', () => {
    expect(clampResizeTranslate({ x: 120, y: 40, maxX: 500, maxY: 300 })).toEqual({ x: 120, y: 40 });
  });
});

describe('resize clamping to the canvas borders', () => {
  const canvas = { containerWidth: 600, containerHeight: 400 };

  // Break these catch: clamping only the position leaves the stretched size untouched, so the widget
  // grows (or shifts) past the border instead of its dragged edge stopping at it.
  it('left border: pins x to 0 and removes the overshoot from the width', () => {
    expect(clampResizeToCanvas({ x: -60, y: 50, width: 300, height: 100, ...canvas })).toEqual({
      x: 0,
      y: 50,
      width: 240,
      height: 100,
    });
  });

  it('top border: pins y to 0 and removes the overshoot from the height', () => {
    expect(clampResizeToCanvas({ x: 50, y: -30, width: 300, height: 100, ...canvas })).toEqual({
      x: 50,
      y: 0,
      width: 300,
      height: 70,
    });
  });

  it('right border: caps the width so the right edge stops at the canvas edge', () => {
    expect(clampResizeToCanvas({ x: 200, y: 50, width: 500, height: 100, ...canvas })).toEqual({
      x: 200,
      y: 50,
      width: 400,
      height: 100,
    });
  });

  it('bottom border: caps the height so the bottom edge stops at the canvas edge', () => {
    expect(clampResizeToCanvas({ x: 50, y: 300, width: 300, height: 250, ...canvas })).toEqual({
      x: 50,
      y: 300,
      width: 300,
      height: 100,
    });
  });

  it('does not cap the bottom when the canvas has no fixed height (main canvas grows downward)', () => {
    expect(clampResizeToCanvas({ x: 50, y: 300, width: 300, height: 250, containerWidth: 600 })).toEqual({
      x: 50,
      y: 300,
      width: 300,
      height: 250,
    });
  });

  it('leaves an in-bounds resize unchanged', () => {
    expect(clampResizeToCanvas({ x: 50, y: 50, width: 300, height: 100, ...canvas })).toEqual({
      x: 50,
      y: 50,
      width: 300,
      height: 100,
    });
  });
});

describe('canvas resize-stop position clamping', () => {
  it('clamps a negative left position to the canvas edge, mirroring the existing top clamp', () => {
    // Break this catches: a resize ending past the canvas's left edge persists a negative `left`,
    // letting the widget render outside the grid instead of snapping to the boundary.
    expect(computeResizeStopPosition({ x: -37, y: -12, gw: 20, gridHeight: 10 })).toEqual({
      top: 0,
      left: 0,
    });
  });

  it('preserves an in-bounds position unchanged', () => {
    expect(computeResizeStopPosition({ x: 123, y: 47, gw: 20, gridHeight: 10 })).toEqual({
      top: 50,
      left: 6,
    });
  });
});

describe('flex child resize styles', () => {
  it('keeps live resize dimensions aligned with the Moveable control box', () => {
    expect(
      computeFlexResizeStyles({
        direction: [1, 1],
        parentDirection: 'row',
        width: 113,
        height: 67,
        gridHeight: 10,
      })
    ).toEqual({
      width: '113px',
      height: '67px',
      flexBasis: '113px',
    });
  });

  it('snaps dimensions only when the resize is committed', () => {
    expect(
      computeFlexResizeEndPatch({
        lastEvent: { direction: [1, 1], width: 113, height: 67 },
        gridHeight: 10,
      })
    ).toEqual({
      widthPx: 110,
      height: 70,
      fillWidth: false,
    });
  });
});
