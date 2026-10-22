/**
 * Switching tabs in the editor flickered the right sidebar between Add new component and the Tabs' properties: every
 * switch cleared the editor selection (for a component of the tab that went away), and the click then selected the
 * Tabs again. The selection now stays, and only a component inside the tab that went away gives way to the Tabs.
 *
 * Real store, real RenderWidget, real widget, a real Input in a tab's canvas.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, waitFor } from '@testing-library/react';
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
const AB = [
  { id: 'a', title: 'Alpha' },
  { id: 'b', title: 'Beta' },
];
const inputIn = (tabId) => {
  const child = componentDefinition('field1', 'field1', 'ShadInput', { label: binding('Draft') });
  child.component.parent = `${ID}-${tabId}`;
  child.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
  child.layouts = { desktop: { top: 0, left: 0, width: 20, height: 70 } };
  return child;
};
const render = () =>
  widget.render({
    currentMode: 'edit',
    extraComponents: { field1: inputIn('b') },
    properties: { useDynamicOptions: binding('{{true}}'), tabs: binding(json(AB)) },
  });
const watchSelection = () => {
  const seen = [];
  const stop = useStore.subscribe((state) => seen.push([...(state.selectedComponents ?? [])]));
  return { seen, stop };
};

describe('UI 2.0 Tabs switching in the editor', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('keeps the Tabs selected, never clearing the selection', async () => {
    render();
    act(() => useStore.getState().setSelectedComponents([ID]));
    const { seen, stop } = watchSelection();
    await widget.act('setTab', 'b');
    await widget.act('setTab', 'a');
    stop();
    expect(seen.some((ids) => ids.length === 0)).toBe(false);
    expect(useStore.getState().selectedComponents).toEqual([ID]);
  });

  test('a component inside the tab that went away gives way to the Tabs', async () => {
    render();
    await widget.act('setTab', 'b');
    await waitFor(() => expect(document.getElementById('field1')).not.toBeNull());
    act(() => useStore.getState().setSelectedComponents(['field1']));
    await widget.act('setTab', 'a');
    await waitFor(() => expect(useStore.getState().selectedComponents).toEqual([ID]));
  });
});
