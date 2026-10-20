import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
// Release audit (Codex fixture currentNestedFieldLabelGuarded016, trimmed): an Input inside Tabs inside a List view row
// or a Kanban card has no row index of its own (its parent is the Tabs), so its DOM id was `shad-<component id>` in
// every row. The second row's label named the first row's input: clicking it focused row one, and a screen reader read
// row one's name. Each rendered control now has its own id, nested or not.
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { componentDefinition } from '@/test/app-builder';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const IDS = {
  owner: '11111111-1111-4111-8111-111111111111',
  tabs: '22222222-2222-4222-8222-222222222222',
  field: '33333333-3333-4333-8333-333333333333',
};
const ROWS = "{{[{id:'a',name:'Alpha',title:'Alpha',status:'todo'},{id:'b',name:'Beta',title:'Beta',status:'todo'}]}}";

let descriptor;
beforeAll(() => {
  descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
  Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => 650 });
});
afterAll(() => {
  if (descriptor) Object.defineProperty(Element.prototype, 'clientWidth', descriptor);
  else delete Element.prototype.clientWidth;
});

const harnesses = Object.fromEntries(
  ['ShadListView', 'ShadKanban'].map((owner) => [
    owner,
    createWidgetHarness({
      componentType: owner,
      id: IDS.owner,
      handle: 'owner1',
      widgetWidth: 900,
      widgetHeight: 800,
      capabilities: { dnd: true },
      preload: ['ShadTabs', 'ShadInput'],
    }),
  ])
);

test.each(['ShadListView', 'ShadKanban'].flatMap((owner) => [false, true].map((nested) => [owner, nested])))(
  '%s, inside Tabs=%s: each row label names and focuses its own input',
  async (owner, nested) => {
    const w = harnesses[owner];
    await w.setup();
    try {
      const item = owner === 'ShadKanban' ? 'cardData' : 'listItem';
      const extra = {};
      if (nested) {
        const tabs = componentDefinition(IDS.tabs, 'tabs1', 'ShadTabs', {});
        tabs.component.parent = IDS.owner;
        extra[IDS.tabs] = tabs;
      }
      const child = componentDefinition(IDS.field, 'field1', 'ShadInput', {
        label: binding(`{{${item}.name}}`),
        defaultValue: binding('seed'),
      });
      child.component.parent = nested ? `${IDS.tabs}-t0` : IDS.owner;
      extra[IDS.field] = child;
      for (const c of Object.values(extra)) {
        c.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
        c.layouts = { desktop: { top: 0, left: 0, width: 30, height: c === child ? 80 : 220 } };
      }
      const view = w.render({
        currentMode: 'view',
        extraComponents: extra,
        properties: {
          data: binding(ROWS),
          idField: binding('id'),
          enablePagination: binding('{{false}}'),
          cardLayout: binding('custom'),
          cardHeight: binding('{{250}}'),
          columns: binding('{{["todo"]}}'),
          titleField: binding('title'),
          statusField: binding('status'),
        },
      });
      await waitFor(() => expect(screen.getAllByRole('textbox', { hidden: true })).toHaveLength(2));
      const inputs = screen.getAllByRole('textbox', { hidden: true });
      const labels = [...view.container.querySelectorAll('label')].filter((l) =>
        ['Alpha', 'Beta'].includes(l.textContent)
      );
      expect(labels).toHaveLength(2);
      await userEvent.setup({ delay: null }).click(labels[1]);
      await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
      expect({
        uniqueIds: new Set(inputs.map((e) => e.id)).size,
        labelControls: labels.map((l) => inputs.indexOf(l.control)),
        focusedInput: inputs.indexOf(document.activeElement),
        betaNamed: screen.queryAllByRole('textbox', { name: 'Beta', exact: true }).length,
      }).toEqual({ uniqueIds: 2, labelControls: [0, 1], focusedInput: 1, betaNamed: 1 });
    } finally {
      w.teardown();
    }
  },
  30000
);
