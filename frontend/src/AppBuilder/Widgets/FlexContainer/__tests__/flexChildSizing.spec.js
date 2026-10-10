import {
  computeFlexChildFlexStyle,
  flexCardHeaderPx,
  flexChildLineWidth,
  resolveFlexChildSizing,
} from '../flexContainer.utils';

describe('flex child sizing', () => {
  it('defaults grow to 1 and the wrap width to 0', () => {
    expect(resolveFlexChildSizing({ fillWidth: true, widthPx: 300, height: 120 })).toEqual({
      fillWidth: true,
      widthPx: 300,
      height: 120,
      grow: 1,
      minWidthPx: 0,
    });
  });

  it('reads grow and minWidthPx, ignoring unusable values', () => {
    expect(resolveFlexChildSizing({ grow: 2, minWidthPx: 280 })).toMatchObject({ grow: 2, minWidthPx: 280 });
    expect(resolveFlexChildSizing({ grow: 0, minWidthPx: -5 })).toMatchObject({ grow: 1, minWidthPx: 0 });
    expect(resolveFlexChildSizing({ grow: 'x', minWidthPx: '300' })).toMatchObject({ grow: 1, minWidthPx: 300 });
  });
});

describe('flex child style in a row', () => {
  const row = {
    isFlexRow: true,
    flexShouldStack: false,
    effectiveWidthPx: 400,
    effectiveHeightPx: 160,
    availableWidth: 1200,
  };

  it('lets fill children share the line from a zero basis, so content width cannot claim the whole row', () => {
    expect(computeFlexChildFlexStyle({ ...row, fillWidth: true, grow: 1, minWidthPx: 0 })).toEqual({
      flex: '1 1 0px',
      minWidth: '0px',
      height: '160px',
    });
  });

  it('splits by ratio and wraps below the minimum width', () => {
    expect(computeFlexChildFlexStyle({ ...row, fillWidth: true, grow: 2, minWidthPx: 320 })).toEqual({
      flex: '2 1 0px',
      minWidth: '320px',
      height: '160px',
    });
  });

  it('keeps fixed children at their width but never wider than the row', () => {
    expect(computeFlexChildFlexStyle({ ...row, fillWidth: false, grow: 1, minWidthPx: 0 })).toEqual({
      flex: '0 0 400px',
      minWidth: 0,
      maxWidth: '100%',
      height: '160px',
    });
  });
});

describe('flex child style in a column', () => {
  it('fills the cross axis and fixes the main axis to the height', () => {
    expect(
      computeFlexChildFlexStyle({
        isFlexRow: false,
        flexShouldStack: false,
        fillWidth: true,
        grow: 1,
        minWidthPx: 0,
        effectiveWidthPx: 400,
        effectiveHeightPx: 160,
        availableWidth: 1200,
      })
    ).toEqual({ flex: '0 0 160px', width: '100%', minHeight: 0 });
  });
});

describe('line packing width', () => {
  it('packs a fill child at its minimum width and a fixed child at its width', () => {
    expect(flexChildLineWidth({ fillWidth: true, minWidthPx: 280, width: 900 })).toBe(280);
    expect(flexChildLineWidth({ fillWidth: true, minWidthPx: 0, width: 900 })).toBe(0);
    expect(flexChildLineWidth({ fillWidth: false, minWidthPx: 0, width: 300 })).toBe(300);
  });
});

describe('card header height', () => {
  it('reserves the Ant header only when it has text', () => {
    expect(flexCardHeaderPx({ cardStyle: 'antCard', cardTitle: 'Fleet' })).toBe(56);
    expect(flexCardHeaderPx({ cardStyle: 'antCard' })).toBe(0);
  });

  it('reserves a shadcn header for a title, taller with a description', () => {
    expect(flexCardHeaderPx({ cardStyle: 'shadcnCard', cardTitle: 'Revenue' })).toBe(48);
    expect(flexCardHeaderPx({ cardStyle: 'shadcnCard', cardTitle: 'Revenue', cardExtra: 'Last 30 days' })).toBe(70);
    expect(flexCardHeaderPx({ cardStyle: 'shadcnCard' })).toBe(0);
    expect(flexCardHeaderPx({ cardStyle: 'none', cardTitle: 'Ignored' })).toBe(0);
  });
});
