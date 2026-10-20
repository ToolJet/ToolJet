import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
// Release audit (Codex fixtures reviewModuleFieldDomIdentity and auditModuleChoiceLabelOwnership, trimmed): two module
// instances hold the same component ids, and a UI 2.0 field's DOM id was `shad-<component id>` outside List view rows.
// Both instances' controls had one id, so the second instance's label named the first instance's control: clicking
// Beta's label focused, edited or toggled Alpha's Input, Textarea, Radio group, Checkbox or Switch, and Alpha's
// handlers ran. Each rendered control now has its own id. The audit also checked that the EE module slices resolve;
// that guard is left out, as the fault is in the field ids and shows with the core store's module namespaces alone.
import React from 'react';
import { act, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition } from '@/test/app-builder/seed';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const SLICES = [
  'initializeComponentsSlice',
  'initializeAppSlice',
  'initializeEventsSlice',
  'initializeResolvedSlice',
  'initializeDependencySlice',
  'initializeDataQuerySlice',
  'initializeModeSlice',
  'initializeLoaderSlice',
];

/** Seeds each [moduleId, componentId, definition, events] in its own module namespace and renders them side by side. */
const mountModules = async (session, type, height, modules) => {
  await act(async () => {
    for (const [moduleId, id, definition, events] of modules) {
      const s = useStore.getState();
      SLICES.forEach((method) => s[method](moduleId));
      seedApp({ [id]: definition }, { moduleId });
      s.setEditorLoading(false, moduleId);
      s.setCurrentMode('view', moduleId);
      if (events) s.eventsSlice.setEvents(events, moduleId);
    }
    session.render(
      <>
        {modules.map(([moduleId, id]) => (
          <ModuleProvider key={moduleId} moduleId={moduleId} isModuleMode>
            <div data-testid={moduleId}>
              <RenderWidget
                id={id}
                componentType={type}
                moduleId={moduleId}
                currentMode="view"
                currentLayout="desktop"
                widgetHeight={height}
                widgetWidth={400}
                inCanvas
                darkMode={false}
                onOptionChange={() => {}}
                onOptionsChange={() => {}}
              />
            </div>
          </ModuleProvider>
        ))}
      </>
    );
  });
};

describe.each(['ShadInput', 'ShadTextarea'])('%s in two module instances', (type) => {
  const w = createWidgetHarness({ componentType: type, id: 'shared-field', handle: 'field1', widgetWidth: 400 });
  beforeEach(() => w.setup());
  afterEach(w.teardown);

  const mount = async (shared = true) => {
    const firstId = shared ? 'shared-field' : 'other-field';
    const field = (id, label) =>
      componentDefinition(id, 'field1', type, {
        label: binding(label),
        description: binding(`${label} help`),
        defaultValue: binding(`${label} value`),
      });
    await mountModules(w.session, type, 120, [
      ['m1', firstId, field(firstId, 'Alpha')],
      ['m2', 'shared-field', field('shared-field', 'Beta')],
    ]);
    await waitFor(() => expect(screen.getAllByRole('textbox')).toHaveLength(2));
    const [a, b] = ['m1', 'm2'].map((id) => within(screen.getByTestId(id)).getByRole('textbox'));
    expect([a.value, b.value]).toEqual(['Alpha value', 'Beta value']);
    return { a, b, firstId };
  };

  test.each([false, true])('each control has its own id and help note, shared component id=%s', async (shared) => {
    const { a, b } = await mount(shared);
    expect(a.id).not.toBe('');
    expect(a.id).not.toBe(b.id);
    expect(a.getAttribute('aria-describedby')).not.toBe(b.getAttribute('aria-describedby'));
    expect(document.getElementById(b.getAttribute('aria-describedby')).textContent).toBe('Beta help');
    expect(screen.getByLabelText('Beta')).toBe(b);
  });

  test('clicking the second instance label focuses its own control', async () => {
    const { b } = await mount(true);
    await userEvent.setup({ delay: null }).click(within(screen.getByTestId('m2')).getByText('Beta'));
    expect(b).toHaveFocus();
  });

  test.each([false, true])('typing after the second label edits only that instance, shared id=%s', async (shared) => {
    const { a, b, firstId } = await mount(shared);
    const user = userEvent.setup({ delay: null });
    await user.click(within(screen.getByTestId('m2')).getByText('Beta'));
    await user.keyboard('{End}X');
    const state = useStore.getState();
    expect({
      visibleA: a.value,
      visibleB: b.value,
      storedA: state.getExposedValueOfComponent(firstId, 'm1').value,
      storedB: state.getExposedValueOfComponent('shared-field', 'm2').value,
    }).toEqual({ visibleA: 'Alpha value', visibleB: 'Beta valueX', storedA: 'Alpha value', storedB: 'Beta valueX' });
  });
});

describe.each([
  ['ShadRadioGroup', 'radio'],
  ['ShadCheckbox', 'checkbox'],
  ['ShadSwitch', 'switch'],
])('%s in two module instances', (type, role) => {
  const w = createWidgetHarness({ componentType: type, id: 'choice1', handle: 'choice1', widgetWidth: 400 });
  beforeEach(() => w.setup());
  afterEach(w.teardown);

  test.each([false, true].flatMap((shared) => ['control', 'label'].map((route) => [shared, route])))(
    'shared component id=%s, a click on the %s changes only its own instance',
    async (shared, route) => {
      const firstId = shared ? 'choice1' : 'other-choice';
      const initial = role === 'radio' ? 'standard' : false;
      const chosen = role === 'radio' ? 'premium' : true;
      const choice = (id, label) => [
        componentDefinition(id, 'choice1', type, {
          label: binding(`${label} choice`),
          defaultChecked: binding('{{false}}'),
          defaultValue: binding('standard'),
          options: binding(
            `{{[{label:'${label} standard',value:'standard'},{label:'${label} premium',value:'premium'}]}}`
          ),
        }),
        [
          {
            id: 'choice-event',
            index: 0,
            sourceId: id,
            name: 'choice-event',
            target: 'component',
            event: {
              eventId: role === 'radio' ? 'onSelectionChange' : 'onChange',
              actionId: 'set-custom-variable',
              key: 'seen',
              value: '{{components.choice1.value}}',
            },
          },
        ],
      ];
      await mountModules(w.session, type, 180, [
        ['m1', firstId, ...choice(firstId, 'Alpha')],
        ['m2', 'choice1', ...choice('choice1', 'Beta')],
      ]);
      const exposed = (owner) =>
        useStore.getState().getExposedValueOfComponent(owner === 'm1' ? firstId : 'choice1', owner);
      await waitFor(() => expect([exposed('m1').value, exposed('m2').value]).toEqual([initial, initial]));
      const controls = ['m1', 'm2'].map((owner) => within(screen.getByTestId(owner)).getAllByRole(role).slice(-1)[0]);
      const user = userEvent.setup({ delay: null });
      if (route === 'control') await user.click(controls[1]);
      else
        await user.click(within(screen.getByTestId('m2')).getByText(role === 'radio' ? 'Beta premium' : 'Beta choice'));
      await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
      const seen = (owner) => useStore.getState().resolvedStore.modules[owner].exposedValues.variables.seen;
      expect({
        values: [exposed('m1').value, exposed('m2').value],
        checked: controls.map((node) => node.getAttribute('aria-checked')),
        events: [seen('m1'), seen('m2')],
      }).toEqual({ values: [initial, chosen], checked: ['false', 'true'], events: [undefined, chosen] });
    }
  );
});
