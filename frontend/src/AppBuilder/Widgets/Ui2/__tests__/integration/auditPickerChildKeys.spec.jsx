import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
/**
 * UI 2.0 pickers: a key pressed on a chip's Remove button or a Clear button belongs to that button, not to the field
 * around it. From the Codex audit (PICKER-CHILD-EVENT-OWNERSHIP-016, currentPickerChildEventOwnership016.spec.jsx and
 * the review fixtures it imports): the Multiselect field ran its own shortcuts for keys from inside it, so Enter or
 * Space on Remove Design opened the menu instead of removing Design, and Backspace with Remove Design (or Clear)
 * focused removed Engineering, the last chip. After a keyboard removal on Combobox or Tags input the focused button
 * was gone and focus fell out of the field to the page.
 *
 * The field's own shortcuts (Enter opens, Backspace drops the last chip) still work when the field itself has focus.
 */
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const press = async (button, method) => {
  const user = userEvent.setup({ delay: null });
  if (method === 'pointer') return user.click(button);
  act(() => button.focus());
  expect(button).toHaveFocus();
  return user.keyboard(method === 'Enter' ? '{Enter}' : ' ');
};

describe('Multiselect chip and Clear buttons', () => {
  const w = createWidgetHarness({
    componentType: 'ShadMultiselect',
    id: 'teams1',
    handle: 'teams1',
    widgetWidth: 500,
    widgetHeight: 150,
  });
  beforeEach(() => w.setup());
  afterEach(w.teardown);
  const mount = async () => {
    w.render({
      currentMode: 'view',
      properties: {
        label: binding('Teams'),
        options: binding('{{[{label:"Design",value:"design"},{label:"Engineering",value:"engineering"}]}}'),
        defaultValue: binding('{{["design","engineering"]}}'),
      },
    });
    await waitFor(() => expect(w.exposed().values).toEqual(['design', 'engineering']));
  };
  const trigger = () => screen.getByRole('combobox', { name: 'Teams', exact: true });

  test.each(['remove', 'clear'].flatMap((target) => ['Enter', 'Space', 'pointer'].map((method) => [target, method])))(
    '%s by %s acts without opening the menu',
    async (target, method) => {
      await mount();
      await press(
        screen.getByRole('button', { name: target === 'remove' ? 'Remove Design' : 'Clear selection' }),
        method
      );
      expect({ values: w.exposed().values, open: trigger().getAttribute('aria-expanded') }).toEqual({
        values: target === 'remove' ? ['engineering'] : [],
        open: 'false',
      });
    }
  );

  test('Enter on the field itself still opens the options', async () => {
    await mount();
    act(() => trigger().focus());
    await userEvent.setup({ delay: null }).keyboard('{Enter}');
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  test.each(['Remove Design', 'Clear selection', 'field'])(
    'Backspace on %s does not run another control',
    async (target) => {
      await mount();
      w.setEvents(countInvocationsOn('teams1', 'onSelect', { key: 'changes' }));
      const focused = target === 'field' ? trigger() : screen.getByRole('button', { name: target, exact: true });
      act(() => focused.focus());
      expect(focused).toHaveFocus();
      await userEvent.setup({ delay: null }).keyboard('{Backspace}');
      expect({ values: w.exposed().values, changes: w.variables().changes || 0 }).toEqual(
        target === 'field' ? { values: ['design'], changes: 1 } : { values: ['design', 'engineering'], changes: 0 }
      );
    }
  );

  test('after a keyboard removal focus moves to the next chip, and to the field after the last one', async () => {
    await mount();
    await press(screen.getByRole('button', { name: 'Remove Design' }), 'Enter');
    expect(w.exposed().values).toEqual(['engineering']);
    expect(screen.getByRole('button', { name: 'Remove Engineering' })).toHaveFocus();
    await userEvent.setup({ delay: null }).keyboard('{Enter}');
    expect(w.exposed().values).toEqual([]);
    expect(trigger()).toHaveFocus();
  });
});

describe.each(['ShadCombobox', 'ShadTagsInput'])('%s child buttons', (componentType) => {
  const combo = componentType === 'ShadCombobox';
  const w = createWidgetHarness({
    componentType,
    id: 'picker1',
    handle: 'picker1',
    widgetWidth: 500,
    widgetHeight: 150,
  });
  beforeEach(() => w.setup());
  afterEach(w.teardown);
  const read = () => (combo ? w.exposed().value : w.exposed().values);
  const mount = async (initial = ['design', 'engineering']) => {
    const properties = combo
      ? {
          label: binding('Country'),
          options: binding('{{[{label:"Japan",value:"jp"}]}}'),
          defaultValue: binding('jp'),
        }
      : {
          label: binding('Tags'),
          defaultValue: binding(`{{${JSON.stringify(initial)}}}`),
          suggestions: binding('{{[]}}'),
        };
    const view = w.render({ currentMode: 'view', properties });
    await waitFor(() => expect(read()).toEqual(combo ? 'jp' : initial));
    return view.container.querySelector('.tj-shadcn');
  };
  const button = () => screen.getByRole('button', { name: combo ? 'Clear selection' : 'Remove design', exact: true });

  test.each(['Enter', 'Space', 'pointer'])('%s activates the button without opening a menu', async (method) => {
    await mount();
    await press(button(), method);
    expect(read()).toEqual(combo ? '' : ['engineering']);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  // Tags input: a chip with a sibling after it, and the only chip.
  test.each(
    (combo
      ? [['only', ['design']]]
      : [
          ['with a sibling', ['design', 'engineering']],
          ['only', ['design']],
        ]
    ).flatMap(([name, initial]) => ['Enter', 'Space', 'pointer'].map((method) => [name, method, initial]))
  )('focus stays in the field when the %s button goes, by %s', async (_name, method, initial) => {
    const owner = await mount(initial);
    const child = button();
    if (method === 'pointer') act(() => screen.getByRole('combobox', { name: combo ? 'Country' : 'Tags' }).focus());
    await press(child, method);
    expect(read()).toEqual(combo ? '' : initial.filter((v) => v !== 'design'));
    expect(child).not.toBeInTheDocument();
    await waitFor(() => expect(owner.contains(document.activeElement)).toBe(true), { timeout: 250 });
    expect(document.activeElement.isConnected).toBe(true);
  });
});

describe.each([
  ['ShadMultiselect', 'Remove Design', ['engineering'], 'onSelect'],
  ['ShadMultiselect', 'Clear selection', [], 'onSelect'],
  ['ShadCombobox', 'Clear selection', '', 'onSelect'],
  ['ShadTagsInput', 'Remove Design', ['Engineering'], 'onTagDeleted'],
])('%s %s by pointer', (type, name, expected, event) => {
  const w = createWidgetHarness({
    componentType: type,
    id: 'choice1',
    handle: 'choice1',
    widgetWidth: 500,
    widgetHeight: 150,
  });
  beforeEach(() => w.setup());
  afterEach(w.teardown);
  test('emits its event once and leaves the menu closed', async () => {
    const combo = type === 'ShadCombobox';
    const tags = type === 'ShadTagsInput';
    const initial = combo ? 'design' : tags ? ['Design', 'Engineering'] : ['design', 'engineering'];
    w.render({
      currentMode: 'view',
      properties: {
        label: binding('Choice'),
        options: binding([
          { label: 'Design', value: 'design' },
          { label: 'Engineering', value: 'engineering' },
        ]),
        defaultValue: binding(initial),
        suggestions: binding([]),
      },
    });
    const key = combo ? 'value' : 'values';
    await waitFor(() => expect(w.exposed()[key]).toEqual(initial));
    w.setEvents([
      ...countInvocationsOn('choice1', event, { key: 'changes' }),
      ...(tags ? countInvocationsOn('choice1', 'onChange', { key: 'genericChanges' }) : []),
    ]);
    await userEvent.setup({ delay: null }).click(screen.getByRole('button', { name, exact: true }));
    expect(w.exposed()[key]).toEqual(expected);
    expect(w.variables().changes).toBe(1);
    if (tags) expect(w.variables().genericChanges).toBe(1);
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});
