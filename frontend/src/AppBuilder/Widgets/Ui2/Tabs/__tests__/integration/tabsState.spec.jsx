/**
 * UI 2.0 Tabs: what a tab keeps and what the widget exposes when tabs hide, load or go away. From the UI 2.0 audit
 * round 2; each describe names its item.
 *
 * Real store, real RenderWidget, real widget, a real Input in a tab's canvas.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { componentDefinition } from '@/test/app-builder';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import useStore from '@/AppBuilder/_stores/store';

const ID = 'tab1';
const widget = createWidgetHarness({
  componentType: 'ShadTabs',
  handle: 'tabs1',
  id: ID,
  widgetHeight: 400,
  widgetWidth: 640,
  capabilities: { dnd: true },
  preload: ['ShadInput'],
});
const json = (value) => `{{${JSON.stringify(value)}}}`;
const ABC = [
  { id: 'a', title: 'Alpha' },
  { id: 'b', title: 'Beta' },
  { id: 'c', title: 'Gamma' },
];
const exposed = () => widget.exposed() ?? {};
const render = (tabs = ABC, properties = {}, extraComponents = {}) =>
  widget.render({
    currentMode: 'view',
    extraComponents,
    properties: { useDynamicOptions: binding('{{true}}'), tabs: binding(json(tabs)), ...properties },
  });

/** An Input in tab `tabId`'s canvas. */
const inputIn = (tabId) => {
  const child = componentDefinition('field1', 'field1', 'ShadInput', { label: binding('Draft') });
  child.component.parent = `${ID}-${tabId}`;
  child.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
  child.layouts = { desktop: { top: 0, left: 0, width: 20, height: 70 } };
  return child;
};
const fieldValue = () => useStore.getState().resolvedStore.modules.canvas.exposedValues.components.field1?.value;

describe('UI 2.0 Tabs state', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  describe.each([
    ['setTabLoading', true, false],
    ['setTabVisibility', false, true],
  ])("a tab's edits survive %s and back", (action, on, off) => {
    test('with every tab mounted (renderOnlyActiveTab off)', async () => {
      render(ABC, {}, { field1: inputIn('b') });
      await widget.act('setTab', 'b');
      const box = await screen.findByRole('textbox');
      await act(async () => fireEvent.change(box, { target: { value: 'my draft' } }));
      await waitFor(() => expect(fieldValue()).toBe('my draft'));

      await widget.act(action, 'b', on);
      await widget.act(action, 'b', off);
      await widget.act('setTab', 'b');
      expect(screen.getByRole('textbox')).toHaveValue('my draft');
      expect(fieldValue()).toBe('my draft');
    });
  });

  describe('tab ids that differ only in whitespace and underscores', () => {
    test('give each tab and panel its own DOM id', async () => {
      render([
        { id: 'a b', title: 'Spaced' },
        { id: 'a_b', title: 'Underscored' },
      ]);
      await waitFor(() => expect(screen.getAllByRole('tab')).toHaveLength(2));
      const tabIds = screen.getAllByRole('tab').map((tab) => tab.id);
      const panelIds = [...document.querySelectorAll('[role="tabpanel"]')].map((panel) => panel.id);
      expect(new Set(tabIds).size).toBe(2);
      expect(new Set(panelIds).size).toBe(2);
      // Each tab still controls its own panel.
      const [spaced, underscored] = screen.getAllByRole('tab');
      expect(document.getElementById(spaced.getAttribute('aria-controls'))).toHaveAttribute('activetab', 'a b');
      expect(document.getElementById(underscored.getAttribute('aria-controls'))).toHaveAttribute('activetab', 'a_b');
    });
  });

  describe('with no tab left', () => {
    test('hiding every tab leaves no current tab, as an empty list starts', async () => {
      render();
      await waitFor(() => expect(exposed().currentTab).toBe('a'));
      for (const tab of ['a', 'b', 'c']) await widget.act('setTabVisibility', tab, false);
      expect(exposed()).toMatchObject({ currentTab: undefined, currentTabTitle: '' });
    });

    test('removing every tab leaves no current tab', async () => {
      render();
      await waitFor(() => expect(exposed().currentTab).toBe('a'));
      await act(async () => widget.setComponentProperty(ID, 'tabs', '{{[]}}', 'properties'));
      await waitFor(() => expect(exposed()).toMatchObject({ currentTab: undefined, currentTabTitle: '' }));
    });

    test('a tab shown again becomes current again', async () => {
      render();
      await waitFor(() => expect(exposed().currentTab).toBe('a'));
      for (const tab of ['a', 'b', 'c']) await widget.act('setTabVisibility', tab, false);
      await widget.act('setTabVisibility', 'b', true);
      expect(exposed()).toMatchObject({ currentTab: 'b', currentTabTitle: 'Beta' });
    });
  });

  describe('hiding the current tab, then the next action', () => {
    test('nextTab after hiding the current tab moves on from the tab that took its place', async () => {
      render();
      await waitFor(() => expect(exposed().currentTab).toBe('a'));
      let afterHide;
      await act(async () => {
        await exposed().setTabVisibility('a', false);
        afterHide = exposed().currentTab;
        await exposed().nextTab();
      });
      expect(afterHide).toBe('b');
      expect(exposed().currentTab).toBe('c');
    });
  });

  describe('a hidden tab', () => {
    test('keeps its panel mounted but not as a tab panel, so no panel names a tab that is not drawn', async () => {
      render(ABC, {}, { field1: inputIn('b') });
      await waitFor(() => expect(screen.getAllByRole('tab')).toHaveLength(3));
      await widget.act('setTabVisibility', 'b', false);
      const panels = [...document.querySelectorAll('[role="tabpanel"]')];
      expect(panels.map((panel) => panel.getAttribute('activetab'))).toEqual(['a', 'c']);
      expect(document.querySelector('[activetab="b"]')).toBeInTheDocument();
    });
  });

  describe.each(['pills', 'underline', 'steps'])('the %s strip with its selected tab disabled', (variant) => {
    test('keeps one tab that can be picked as its keyboard entry', async () => {
      render(ABC, { variant: binding(variant), linearSteps: binding('{{false}}') });
      await waitFor(() => expect(exposed().currentTab).toBe('a'));
      await widget.act('setTabDisable', 'a', true);
      const stops = screen.getAllByRole('tab').filter((tab) => tab.tabIndex === 0);
      expect(stops.map((tab) => tab.textContent)).toEqual([expect.stringContaining('Beta')]);
      expect(stops[0]).not.toBeDisabled();
    });
  });
});
