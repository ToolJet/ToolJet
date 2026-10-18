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
});
