import {
  computeFlexResizeEndPatch,
  computeFlexResizeStyles,
  computeResizeStopPosition,
  clampResizeTranslate,
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
