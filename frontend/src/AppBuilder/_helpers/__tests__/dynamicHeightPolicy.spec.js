import { fitsContentInView } from '../dynamicHeightPolicy';

describe('which widgets fit their content in the viewer', () => {
  it('follows the Dynamic height property for native widgets', () => {
    expect(fitsContentInView('Table', { dynamicHeight: true })).toBe(true);
    expect(fitsContentInView('Table', { dynamicHeight: false })).toBe(false);
    expect(fitsContentInView('Table', {})).toBe(false);
  });

  it('always fits a FlexContainer card or row; a plain column follows the property', () => {
    expect(fitsContentInView('FlexContainer', { cardStyle: 'shadcnCard' })).toBe(true);
    expect(fitsContentInView('FlexContainer', { cardStyle: 'antCard', dynamicHeight: false })).toBe(true);
    expect(fitsContentInView('FlexContainer', { direction: 'row' })).toBe(true);
    expect(fitsContentInView('FlexContainer', { direction: 'column' })).toBe(false);
    expect(fitsContentInView('FlexContainer', { direction: 'column', dynamicHeight: true })).toBe(true);
  });

  it('fits a pack widget unless its Dynamic height is turned off', () => {
    expect(fitsContentInView('ShadStat', {})).toBe(true);
    expect(fitsContentInView('ShadTable', { dynamicHeight: false })).toBe(false);
    expect(fitsContentInView('AntTable', {})).toBe(true);
  });
});
