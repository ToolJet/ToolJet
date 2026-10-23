// Release audit round 2 (Codex fixture, kept as written): a retained reference to a removed List view row's action
// wrote over its successor's exposed value and ran the old row's workflow. Actions now belong to their instance and
// do nothing once it unmounts (withControlState).
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor } from '@testing-library/react';
import { componentDefinition } from '@/test/app-builder';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/widgetHarness';

const w = createWidgetHarness({
  componentType: 'ShadListView',
  id: 'list1',
  handle: 'list1',
  widgetHeight: 500,
  widgetWidth: 600,
  capabilities: { dnd: true },
  preload: ['ShadInput'],
});
let descriptor;
beforeAll(() => {
  descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
  Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => 600 });
});
afterAll(() => {
  if (descriptor) Object.defineProperty(Element.prototype, 'clientWidth', descriptor);
  else delete Element.prototype.clientWidth;
});
beforeEach(() => w.setup());
afterEach(w.teardown);

test.each([false, true])('row action after removal, stale=%s', async (stale) => {
  const child = componentDefinition('field1', 'field1', 'ShadInput', {
    label: binding('{{listItem.name}}'),
    defaultValue: binding('{{listItem.name}}'),
  });
  child.component.parent = 'list1';
  child.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
  child.layouts = { desktop: { top: 0, left: 0, width: 20, height: 90 } };
  w.render({
    currentMode: 'view',
    extraComponents: { field1: child },
    properties: {
      data: binding('{{[{id:"a",name:"Alpha"},{id:"b",name:"Beta"}]}}'),
      enablePagination: binding('{{false}}'),
    },
  });
  await waitFor(() => expect(w.exposed().children?.[1]?.field1?.setText).toBeInstanceOf(Function));
  w.setEvents(
    setVariableOn('field1', 'onChange', { key: 'rowEvents', value: '{{[...(variables.rowEvents || []),listItem.id]}}' })
  );
  const removedAction = w.exposed().children[0].field1.setText;
  w.setComponentProperty('list1', 'data', '{{[{id:"b",name:"Beta"}]}}', 'properties');
  await waitFor(() => expect(screen.getAllByRole('textbox')).toHaveLength(1));
  await waitFor(() => expect(w.exposed().children[0].field1.value).toBe('Beta'));
  expect(screen.getByRole('textbox')).toHaveValue('Beta');
  await act(async () => (stale ? removedAction : w.exposed().children[0].field1.setText)('Updated'));
  expect({
    visible: screen.getByRole('textbox').value,
    exposed: w.exposed().children[0].field1.value,
    events: w.variables().rowEvents || [],
  }).toEqual(
    stale ? { visible: 'Beta', exposed: 'Beta', events: [] } : { visible: 'Updated', exposed: 'Updated', events: ['b'] }
  );
});
