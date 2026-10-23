// Release audit round 2: Codex's fixture reviewExplicitUi2FormSubmit, kept as written, as the regression check for a fix made earlier
// from its description (see the commit that fixed it).
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { componentDefinition } from '@/test/app-builder';
import { binding, countInvocationsOn, setVariableOn } from '@/AppBuilder/Widgets/widgetHarness';

let descriptor;
beforeAll(() => {
  descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
  Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => 650 });
});
afterAll(() => Object.defineProperty(Element.prototype, 'clientWidth', descriptor));
const w = createWidgetHarness({
  componentType: 'ShadListView',
  id: 'list1',
  handle: 'list1',
  widgetHeight: 900,
  widgetWidth: 900,
  capabilities: { dnd: true },
  preload: ['Form', 'ShadInput', 'ShadButton'],
});
beforeEach(async () => {
  const host = document.createElement('div');
  host.className = 'canvas-content';
  host.innerHTML = '<div class="tj-canvas-area real-canvas"></div>';
  document.body.appendChild(host);
  await w.setup();
});
afterEach(() => {
  w.teardown();
  document.querySelectorAll('.canvas-content').forEach((n) => n.remove());
});

async function renderRows(count) {
  const form = componentDefinition('form1', 'form1', 'Form', {
    advanced: binding('{{false}}'),
    buttonToSubmit: binding('none'),
    showHeader: binding('{{false}}'),
    showFooter: binding('{{false}}'),
    validateOnSubmit: binding('{{true}}'),
    resetOnSubmit: binding('{{false}}'),
  });
  const input = componentDefinition('input1', 'input1', 'ShadInput', {
    label: binding('Name'),
    defaultValue: binding('{{listItem.name}}'),
  });
  const button = componentDefinition('button1', 'button1', 'ShadButton', {
    text: binding('{{"Submit " + listItem.name}}'),
  });
  for (const [child, parent, top, height] of [
    [form, 'list1', 0, 250],
    [input, 'form1', 0, 80],
    [button, 'form1', 100, 40],
  ]) {
    child.component.parent = parent;
    child.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
    child.layouts = { desktop: { top, left: 0, width: 30, height } };
  }
  w.render({
    currentMode: 'view',
    extraComponents: { form1: form, input1: input, button1: button },
    properties: {
      data: binding(count === 1 ? '{{[{id:1,name:"Alpha"}]}}' : '{{[{id:1,name:"Alpha"},{id:2,name:"Beta"}]}}'),
      idField: binding('id'),
      enablePagination: binding('{{false}}'),
    },
  });
  await waitFor(() =>
    expect(screen.getAllByRole('textbox').map((n) => n.value)).toEqual(count === 1 ? ['Alpha'] : ['Alpha', 'Beta'])
  );
  await act(async () => w.setEvents(countInvocationsOn('form1', 'onSubmit')));
}

test.each([1, 2])('explicit UI2 onClick Form action isolates clicked row among %s rows', async (count) => {
  await renderRows(count);
  await act(async () =>
    w.setEvents([
      {
        id: 'submit-explicit',
        index: 0,
        sourceId: 'button1',
        name: 'submit-explicit',
        target: 'component',
        event: {
          eventId: 'onClick',
          actionId: 'control-component',
          componentId: 'form1',
          componentSpecificActionHandle: 'submitForm',
          componentSpecificActionParams: [],
        },
      },
      ...setVariableOn('form1', 'onSubmit', {
        key: 'submittedRows',
        value: '{{[...(variables.submittedRows || []), listItem.name]}}',
      }),
    ])
  );
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Submit Alpha' })));
  await waitFor(() => expect(w.variables().submittedRows).toEqual(['Alpha']));
});
