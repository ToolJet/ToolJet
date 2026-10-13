import { flexResizePatch, flexResizeStyles } from '../flex';

describe('FlexContainer child resize', () => {
  it('shows and saves the same snapped size', () => {
    const size = { axes: [1, 1], width: 113, height: 67 };
    expect(flexResizeStyles(size, 'row')).toEqual({ width: '110px', height: '70px', flexBasis: '110px' });
    expect(flexResizePatch(size)).toEqual({ widthPx: 110, fillWidth: false, height: 70 });
  });

  it('only touches the axis the handle moves; flexBasis follows the main axis', () => {
    expect(flexResizeStyles({ axes: [0, 1], width: 300, height: 44 }, 'column')).toEqual({
      height: '40px',
      flexBasis: '40px',
    });
    expect(flexResizePatch({ axes: [0, 1], width: 300, height: 44 })).toEqual({ height: 40 });
  });

  it('keeps at least one row and saves nothing for a handle on neither axis', () => {
    expect(flexResizePatch({ axes: [1, 0], width: -50, height: 0 })).toEqual({ widthPx: 10, fillWidth: false });
    expect(flexResizePatch({ axes: [0, 0], width: 10, height: 10 })).toBeNull();
  });
});
