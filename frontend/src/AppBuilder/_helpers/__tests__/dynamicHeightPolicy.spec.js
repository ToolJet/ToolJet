import { fitsContentInView, heightHeldInView, stretchesInRow } from '../dynamicHeightPolicy';

describe('which widgets fit their content in the viewer', () => {
  it('follows the Dynamic height property for native widgets', () => {
    expect(fitsContentInView('Table', { dynamicHeight: true })).toBe(true);
    expect(fitsContentInView('Table', { dynamicHeight: false })).toBe(false);
    expect(fitsContentInView('Table', {})).toBe(false);
  });

  it('always fits a FlexContainer card or a new row; a plain column follows the property', () => {
    const v2 = { layoutVersion: '2' };
    expect(fitsContentInView('FlexContainer', { cardStyle: 'shadcnCard' })).toBe(true);
    expect(fitsContentInView('FlexContainer', { cardStyle: 'shadcnCard', dynamicHeight: false })).toBe(true);
    expect(fitsContentInView('FlexContainer', { ...v2, direction: 'row' })).toBe(true);
    expect(fitsContentInView('FlexContainer', { ...v2, direction: 'column' })).toBe(false);
    expect(fitsContentInView('FlexContainer', { ...v2, direction: 'column', dynamicHeight: true })).toBe(true);
  });

  it('lets a row saved before layout version 2 follow its Dynamic height property, as on lts-3.16', () => {
    expect(fitsContentInView('FlexContainer', { direction: 'row' })).toBe(false);
    expect(fitsContentInView('FlexContainer', { direction: 'row', dynamicHeight: true })).toBe(true);
    expect(heightHeldInView('FlexContainer', { direction: 'row', dynamicHeight: false })).toBe(true);
    expect(heightHeldInView('FlexContainer', { direction: 'row', dynamicHeight: false, layoutVersion: '2' })).toBe(
      false
    );
  });

  it('fits a pack widget unless its Dynamic height is turned off', () => {
    expect(fitsContentInView('ShadStat', {})).toBe(true);
    expect(fitsContentInView('ShadTable', { dynamicHeight: false })).toBe(false);
  });
});

describe('which children an Equal heights row stretches to the line', () => {
  const equal = { equalHeights: true };

  it('stretches a FlexContainer child when the row is Equal heights or its Align is Stretch', () => {
    expect(stretchesInRow(equal, 'FlexContainer', {}, 'edit')).toBe(true);
    expect(stretchesInRow({ alignItems: 'stretch' }, 'FlexContainer', {}, 'view')).toBe(true);
    expect(stretchesInRow({}, 'FlexContainer', {}, 'view')).toBe(false);
  });

  it('stretches a Stat card that fits its content, in the viewer only', () => {
    expect(stretchesInRow(equal, 'ShadStat', {}, 'view')).toBe(true);
    expect(stretchesInRow(equal, 'ShadStat', {}, 'edit')).toBe(false);
    expect(stretchesInRow({}, 'ShadStat', {}, 'view')).toBe(false);
    // Without its card there is no surface to fill, and a fixed-height Stat keeps its height.
    expect(stretchesInRow(equal, 'ShadStat', { card: false }, 'view')).toBe(false);
    expect(stretchesInRow(equal, 'ShadStat', { dynamicHeight: false }, 'view')).toBe(false);
  });

  it('stretches a component pack Stat card the same way, by its manifest role', () => {
    const fits = { dynamicHeight: true };
    expect(stretchesInRow(equal, 'LibraryComponent', fits, 'view', 'stat')).toBe(true);
    expect(stretchesInRow(equal, 'LibraryComponent', { ...fits, card: false }, 'view', 'stat')).toBe(false);
    expect(stretchesInRow(equal, 'LibraryComponent', fits, 'view', 'button')).toBe(false);
    expect(stretchesInRow(equal, 'LibraryComponent', fits, 'view')).toBe(false);
  });

  it('leaves other widgets at their own height, so the row keeps its Align (a heading beside a button)', () => {
    expect(stretchesInRow(equal, 'ShadHeading', {}, 'view')).toBe(false);
    expect(stretchesInRow(equal, 'Button', { dynamicHeight: true }, 'view')).toBe(false);
  });
});
