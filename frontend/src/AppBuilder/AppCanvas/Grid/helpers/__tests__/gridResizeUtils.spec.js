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

describe('resize clamping scope', () => {
  // Break this catches: stretching the bottom handle past the visible bottom of the main canvas clamps y
  // against the visible canvas height minus the grown widget height, which goes negative and shifts the
  // widget upward instead of letting it extend (the main canvas grows downward and has no bottom border).
  it('does not bound y when no bottom limit is given, so a main-canvas widget can extend downward', () => {
    expect(clampResizeTranslate({ x: 50, y: 900, maxX: 500 })).toEqual({ x: 50, y: 900 });
  });

  it('still pins a negative y to the top border when no bottom limit is given', () => {
    expect(clampResizeTranslate({ x: 50, y: -20, maxX: 500 })).toEqual({ x: 50, y: 0 });
  });

  // Break these catch: applying the border clamps to widgets inside a Container/Form snaps and crunches
  // them on a minor resize, because those canvases are scrollable/padded and their client box is not the
  // widget's true bound. Nested widgets must keep their pre-fix behaviour.
  it('leaves the resized box of a nested widget untouched', () => {
    const box = { x: -60, y: -30, width: 900, height: 700 };
    expect(clampResizeToCanvas({ ...box, containerWidth: 600, containerHeight: 400, isNested: true })).toEqual(box);
  });

  it('leaves the translate of a nested widget untouched', () => {
    expect(clampResizeTranslate({ x: -42, y: 800, maxX: 500, maxY: 300, isNested: true })).toEqual({
      x: -42,
      y: 800,
    });
  });
});

describe('resize clamping for top-aligned label widgets', () => {
  const canvas = { containerWidth: 600 };

  // Break this catches: a top-aligned input's live (DOM) height includes the label increment but its stored
  // height does not, so the top-resize y offset derived from the difference reads 20px too negative. A
  // widget sitting at the top border then loses that 20px from its height as soon as its top handle is
  // dragged upward, instead of staying the same size.
  it('does not treat the label increment as top-border overshoot', () => {
    expect(clampResizeToCanvas({ x: 50, y: -20, width: 300, height: 520, extraHeight: 20, ...canvas })).toEqual({
      x: 50,
      y: 0,
      width: 300,
      height: 520,
    });
  });

  it('still removes only the real overshoot beyond the label increment', () => {
    expect(clampResizeToCanvas({ x: 50, y: -50, width: 300, height: 520, extraHeight: 20, ...canvas })).toEqual({
      x: 50,
      y: 0,
      width: 300,
      height: 490,
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
