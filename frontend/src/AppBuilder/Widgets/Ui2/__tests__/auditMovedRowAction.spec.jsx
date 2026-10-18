// Release audit round 2 (Codex fixture, kept as written): the control: a row that moves (stable id, reorder) keeps
// its actions.
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

test.each(['reorder', 'prepend'])('retained action follows surviving record after %s', async (change) => {
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
  const retained = w.exposed().children[0].field1.setText;
  const next =
    change === 'reorder'
      ? [
          { id: 'b', name: 'Beta' },
          { id: 'a', name: 'Alpha' },
        ]
      : [
          { id: 'c', name: 'Gamma' },
          { id: 'a', name: 'Alpha' },
          { id: 'b', name: 'Beta' },
        ];
  w.setComponentProperty('list1', 'data', '{{' + JSON.stringify(next) + '}}', 'properties');
  await waitFor(() => expect(screen.getAllByRole('textbox').map((x) => x.value)).toEqual(next.map((x) => x.name)));
  await waitFor(() => expect(w.exposed().children[1].field1.value).toBe('Alpha'));
  await act(async () => retained('Updated Alpha'));
  expect(screen.getAllByRole('textbox').map((x) => x.value)).toEqual(
    next.map((x) => (x.id === 'a' ? 'Updated Alpha' : x.name))
  );
  expect(next.map((_, i) => w.exposed().children[i].field1.value)).toEqual(
    next.map((x) => (x.id === 'a' ? 'Updated Alpha' : x.name))
  );
  expect(w.variables().rowEvents).toEqual(['a']);
});
