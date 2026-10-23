import { computeFlexResizeEndPatch, computeFlexResizeStyles, gridResizeEndHeight } from '../gridResizeUtils';

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

describe('the height a grid widget keeps when a resize ends', () => {
  // A 36px Button (between rows 3 and 4) resized sideways showed a 40px box while its saved height stayed 36: it drew
  // at 36 inside the box and went back to 36 on reload. A width-only resize keeps the saved height.
  it('keeps the saved height when only the width changed', () => {
    expect(gridResizeEndHeight({ direction: [1, 0], lastHeight: 36, currentHeight: 36, gridHeight: 10 })).toBe(36);
    expect(gridResizeEndHeight({ direction: [-1, 0], lastHeight: 36, currentHeight: 36, gridHeight: 10 })).toBe(36);
  });

  it('snaps to whole rows when a top or bottom edge moved', () => {
    expect(gridResizeEndHeight({ direction: [0, 1], lastHeight: 47, currentHeight: 36, gridHeight: 10 })).toBe(50);
    expect(gridResizeEndHeight({ direction: [1, -1], lastHeight: 36, currentHeight: 36, gridHeight: 10 })).toBe(40);
    expect(gridResizeEndHeight({ direction: [0, 1], lastHeight: 3, currentHeight: 36, gridHeight: 10 })).toBe(10);
  });

  it('leaves out the label row a top-aligned label adds', () => {
    expect(
      gridResizeEndHeight({
        direction: [0, 1],
        lastHeight: 72,
        currentHeight: 40,
        topAlignmentAddedHeight: 20,
        gridHeight: 10,
      })
    ).toBe(50);
  });
});
