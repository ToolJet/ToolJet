import {
  computeFlexResizeEndPatch,
  computeFlexResizeStyles,
  computeResizeStopPosition,
  clampResizeToCanvas,
  computeResizeEndRect,
} from '../gridResizeUtils';

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
  // Break these catch: applying the border clamps to widgets inside a Container/Form snaps and crunches
  // them on a minor resize, because those canvases are scrollable/padded and their client box is not the
  // widget's true bound. Nested widgets must keep their pre-fix behaviour.
  it('leaves the resized box of a nested widget untouched', () => {
    const box = { x: -60, y: -30, width: 900, height: 700 };
    expect(clampResizeToCanvas({ ...box, containerWidth: 600, containerHeight: 400, isNested: true })).toEqual(box);
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

describe('resize-end rectangle', () => {
  const grid = { gridWidth: 10, gridHeight: 10 };

  // Break this catches: clamping a width that was already rounded to the grid in one place and the raw
  // event width in another lets the DOM preview and the saved layout disagree for the same resize (the
  // left-edge case previewed 150px but saved 160px). One clamp on the raw rectangle, snapped once, keeps them equal.
  it('clamps the raw left-edge overshoot and snaps the width once', () => {
    expect(computeResizeEndRect({ x: -12, y: 50, width: 165, height: 100, containerWidth: 430, ...grid })).toEqual({
      x: 0,
      y: 50,
      width: 150,
      height: 100,
    });
  });

  it('caps the width at the right border before snapping', () => {
    expect(computeResizeEndRect({ x: 400, y: 50, width: 94, height: 100, containerWidth: 430, ...grid })).toEqual({
      x: 400,
      y: 50,
      width: 30,
      height: 100,
    });
  });

  it('caps the width at the 43-column grid', () => {
    expect(computeResizeEndRect({ x: 400, y: 0, width: 60, height: 100, containerWidth: 1000, ...grid })).toEqual({
      x: 400,
      y: 0,
      width: 30,
      height: 100,
    });
  });

  it('does not clamp a nested widget, only snaps its width', () => {
    expect(
      computeResizeEndRect({ x: -12, y: -30, width: 165, height: 100, containerWidth: 430, isNested: true, ...grid })
    ).toEqual({ x: -12, y: -30, width: 170, height: 100 });
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
