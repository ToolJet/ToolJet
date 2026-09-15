import { computeFlexResizeEndPatch, computeFlexResizeStyles } from '../gridResizeUtils';

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
