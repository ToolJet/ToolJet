/**
 * UI 2.0 Tabs for assistive tech and the keyboard: each tab names the panel it controls and each panel is named by its
 * tab (release audit 12), and a disabled tab's panel leaves the tab order as it leaves the mouse (55). Titles carry
 * [ShadTabs-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { screen, waitFor } from '@testing-library/react';

const ID = 'tab1';
const widget = createWidgetHarness({
  componentType: 'ShadTabs',
  handle: 'tabs1',
  id: ID,
  widgetHeight: 400,
  widgetWidth: 640,
  capabilities: { dnd: true },
});
const render = () => widget.render({ currentMode: 'view' });
const panelOf = (tab) => document.getElementById(tab.getAttribute('aria-controls'));

describe('UI 2.0 Tabs relationships and disabled panels', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadTabs-A11Y-001] a tab controls its panel, and the panel is named by its tab', async () => {
    render();
    const tabs = await screen.findAllByRole('tab');
    expect(tabs).toHaveLength(3);
    for (const tab of tabs) {
      const panel = panelOf(tab);
      expect(panel).toHaveAttribute('role', 'tabpanel');
      expect(panel.getAttribute('aria-labelledby')).toBe(tab.id);
    }
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName('Overview');
  });

  test('[ShadTabs-DIS-001] the active tab disabled takes its panel out of the tab order (inert)', async () => {
    render();
    const panel = panelOf(await screen.findByRole('tab', { name: /Overview/ }));
    expect(panel.inert).toBeFalsy();
    await widget.act('setTabDisable', 't0', true);
    await waitFor(() => expect(panel.inert).toBe(true));
    expect(panel).toHaveAttribute('aria-disabled', 'true');
    await widget.act('setTabDisable', 't0', false);
    await waitFor(() => expect(panel.inert).toBe(false));
  });
});
