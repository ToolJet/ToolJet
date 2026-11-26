import { SIDEBAR_ITEMS, RIGHT_PANEL_ITEMS, getPanelCloseLabel } from '../panelLayout';

describe('Variables panel layout', () => {
  it('names the Variables rail item and tooltip', () => {
    expect(SIDEBAR_ITEMS.variables).toEqual({ name: 'Variables', label: 'Vars', cy: 'variables' });
  });

  it('names the contextual variable configuration panel', () => {
    expect(RIGHT_PANEL_ITEMS.variable).toEqual({ name: 'Variable configuration' });
    expect(getPanelCloseLabel('variable')).toBe('Close variable configuration');
  });
});
