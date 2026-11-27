import {
  computeFlexChildFlexStyle,
  flexCardHeaderPx,
  flexChildLineWidth,
  followContentInSlot,
  leavesFlexFlow,
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

  it('ignores the minimum width in a row that does not wrap, where it could only push the row past its edge', () => {
    // Two 220px-minimum fields in a 404px drawer row that does not wrap overflowed by 48px and cut the right column off.
    expect(computeFlexChildFlexStyle({ ...row, fillWidth: true, grow: 1, minWidthPx: 220, wraps: false })).toEqual({
      flex: '1 1 0px',
      minWidth: '0px',
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
  it('reserves the card header only when it has text', () => {
    expect(flexCardHeaderPx({ cardStyle: 'shadcnCard', cardTitle: 'Fleet' })).toBe(48);
    expect(flexCardHeaderPx({ cardStyle: 'shadcnCard' })).toBe(0);
  });

  it('reserves a shadcn header for a title, taller with a description', () => {
    expect(flexCardHeaderPx({ cardStyle: 'shadcnCard', cardTitle: 'Revenue' })).toBe(48);
    expect(flexCardHeaderPx({ cardStyle: 'shadcnCard', cardTitle: 'Revenue', cardExtra: 'Last 30 days' })).toBe(70);
    expect(flexCardHeaderPx({ cardStyle: 'shadcnCard' })).toBe(0);
    expect(flexCardHeaderPx({ cardStyle: 'none', cardTitle: 'Ignored' })).toBe(0);
  });
});

describe('a dialog without its trigger button in a flex container', () => {
  it('leaves the flow of a new container in the viewer', () => {
    expect(leavesFlexFlow({ modalWithoutTrigger: true, mode: 'view', layoutV2: true })).toBe(true);
    expect(leavesFlexFlow({ modalWithoutTrigger: true, mode: 'edit', layoutV2: true })).toBe(false);
    expect(leavesFlexFlow({ modalWithoutTrigger: false, mode: 'view', layoutV2: true })).toBe(false);
  });

  it('keeps its slot in a container saved before layout version 2, as on lts-3.16', () => {
    expect(leavesFlexFlow({ modalWithoutTrigger: true, mode: 'view', layoutV2: false })).toBe(false);
  });
});

describe('the slot of a child whose box follows its content (dynamic height, in the viewer)', () => {
  // The slot is sized by what the child draws, so the browser lays the container out from real heights and the height
  // registry measures them. Its floor is the height the child is drawn at, never one measured before: a measured floor
  // could only grow.
  it('[DynamicHeight-FLEXSLOT-001] in a column, grows from an auto basis instead of a fixed one', () => {
    const style = computeFlexChildFlexStyle({ isFlexRow: false, fillWidth: true, effectiveHeightPx: 60 });
    expect(followContentInSlot(style, { isFlexRow: false, floorPx: 60 })).toMatchObject({
      flex: '0 0 auto',
      height: 'auto',
      minHeight: '60px',
    });
  });

  it('[DynamicHeight-FLEXSLOT-002] in a row, keeps its width basis and takes an auto height', () => {
    const style = computeFlexChildFlexStyle({
      isFlexRow: true,
      fillWidth: false,
      effectiveWidthPx: 300,
      effectiveHeightPx: 60,
    });
    expect(followContentInSlot(style, { isFlexRow: true, floorPx: 60 })).toMatchObject({
      flex: '0 0 300px',
      height: 'auto',
      minHeight: '60px',
    });
    const fill = computeFlexChildFlexStyle({ isFlexRow: true, fillWidth: true, grow: 2, effectiveHeightPx: 60 });
    expect(followContentInSlot(fill, { isFlexRow: true, floorPx: 60 }).flex).toBe('2 1 0px');
  });

  it('[DynamicHeight-FLEXSLOT-003] grows from an auto basis when stacked in a column', () => {
    const style = computeFlexChildFlexStyle({
      isFlexRow: false,
      flexShouldStack: true,
      fillWidth: true,
      effectiveHeightPx: 60,
    });
    expect(followContentInSlot(style, { isFlexRow: false, floorPx: 60 })).toMatchObject({
      flex: '0 0 auto',
      height: 'auto',
      minHeight: '60px',
    });
  });
});
