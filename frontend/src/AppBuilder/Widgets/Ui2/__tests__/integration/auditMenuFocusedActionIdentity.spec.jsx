// Release audit round 4 (Codex fixture auditDropdownFocusedActionIdentity): with a DropdownMenu or a Navigation menu
// open and an action focused from the keyboard, a refresh of its items that moved that action (reorder, an item put
// before it, its removal) left focus on the same row element, now drawing another action, and Enter or Space picked
// that other action. Menu rows were keyed by position; they now keep each action's own row.
import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const alpha = { label: 'Inspect Alpha', value: 'a', description: 'Original metadata' };
const beta = { label: 'Inspect Beta', value: 'b' };
const gamma = { label: 'Inspect Gamma', value: 'c' };
const expr = (value) => '{{' + JSON.stringify(value) + '}}';
describe.each(['dropdown', 'horizontal navigation', 'collapsed navigation'])('%s focused action identity', (kind) => {
  const dropdown = kind === 'dropdown';
  const w = createWidgetHarness({
    componentType: dropdown ? 'ShadDropdownMenu' : 'ShadNavigation',
    handle: 'menu1',
    id: 'dd1',
    widgetWidth: 500,
    widgetHeight: 360,
  });
  const wrap = (rows) =>
    dropdown
      ? rows
      : [
          { label: 'Home', value: 'home' },
          { label: 'Actions', value: 'actions', children: rows },
        ];
  beforeEach(() => w.setup());
  afterEach(w.teardown);
  async function start() {
    const user = userEvent.setup({ delay: null });
    w.render({
      currentMode: 'view',
      properties: {
        label: binding('Actions'),
        items: binding(expr(wrap([alpha, beta]))),
        ...(!dropdown
          ? {
              defaultValue: binding('home'),
              ...(kind === 'horizontal navigation'
                ? { orientation: binding('horizontal') }
                : { collapsed: binding('{{true}}') }),
            }
          : {}),
      },
    });
    w.setEvents(
      setVariableOn('dd1', dropdown ? 'onSelect' : 'onClick', {
        key: 'picked',
        value:
          '{{[...(variables.picked || []),components.menu1.' +
          (dropdown ? 'lastClickedOption' : 'selectedItem') +
          ']}}',
      })
    );
    const trigger = await screen.findByRole('button', { name: /Actions/ });
    act(() => trigger.focus());
    await user.keyboard('{Enter}');
    const focused = await screen.findByRole('menuitem', { name: /Inspect Alpha/ });
    expect(focused).toHaveFocus();
    return { user, focused };
  }
  async function refresh(rows) {
    await act(async () => w.setComponentProperty('dd1', 'items', expr(wrap(rows)), 'properties'));
  }
  describe.each(['Enter', 'Space'])('focused menu identity, %s', (key) => {
    test.each(['unchanged', 'metadata', 'reorder', 'prepend', 'remove'])(
      'activation following %s cannot transfer to another action',
      async (mode) => {
        const { user, focused } = await start();
        const changed = { ...alpha, label: 'Inspect Alpha updated', description: 'Current metadata' };
        const rows = {
          unchanged: [alpha, beta],
          metadata: [changed, beta],
          reorder: [beta, alpha],
          prepend: [gamma, alpha, beta],
          remove: [beta],
        }[mode];
        await refresh(rows);
        if (screen.queryByRole('menu')) expect(screen.getAllByRole('menuitem')).toHaveLength(rows.length);
        const focusAfterRefresh = document.activeElement;
        const silentFocusedReplacement =
          focusAfterRefresh === focused &&
          rows.some((row) => row.value !== 'a' && focusAfterRefresh.textContent.includes(row.label));
        // No pointer click or programmatic item refocus after refresh: exercise the held keyboard intent.
        await user.keyboard(key === 'Enter' ? '{Enter}' : ' ');
        await act(async () => {});
        const picks = w.variables().picked || [];
        if (['unchanged', 'metadata'].includes(mode)) {
          await waitFor(() => expect(w.variables().picked?.map((p) => p.value)).toEqual(['a']));
          if (mode === 'metadata') expect(w.variables().picked[0].label).toBe(changed.label);
        } else {
          // Closing/neutralizing the menu is allowed; surviving focus may select only the original stable action.
          expect({ pickedValues: picks.map((p) => p.value), silentFocusedReplacement }).toEqual({
            pickedValues: mode === 'remove' || !picks.length ? [] : ['a'],
            silentFocusedReplacement: false,
          });
        }
      }
    );
  });
  test('explicitly clicking a fresh reordered Beta action selects Beta once (control)', async () => {
    const { user } = await start();
    await refresh([beta, alpha]);
    await user.click(await screen.findByRole('menuitem', { name: 'Inspect Beta', exact: true }));
    await waitFor(() => expect(w.variables().picked?.map((p) => p.value)).toEqual(['b']));
  });
  // Rows are keyed by value and type, else label, with a count for repeats: duplicate, mixed-type and absent values
  // still draw every row (a repeated React key would drop or merge rows, and the console guard fails on its warning).
  // A Navigation keeps one item per value by design (navItems), so this is the DropdownMenu's case.
  (dropdown ? test : test.skip)('draws every row when values repeat, differ only in type or are absent', async () => {
    await start();
    const rows = [
      { label: 'One number', value: 1 },
      { label: 'One text', value: '1' },
      { label: 'First copy', value: 'a' },
      { label: 'Second copy', value: 'a' },
      { label: 'No value' },
      { label: 'No value' },
    ];
    await refresh(rows);
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual(rows.map((row) => row.label));
  });
});
