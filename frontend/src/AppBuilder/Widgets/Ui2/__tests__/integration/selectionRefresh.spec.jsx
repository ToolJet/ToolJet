/**
 * UI 2.0 widgets that select an item: the exposed selection follows a data refresh.
 *
 * Review (2026-10-17): a List view's highlight followed the record key, but selectedItem kept the old record after a
 * refresh. The rule (README, "Selection after a data change"): a widget keeps its selection by the item's key; when
 * the data changes it re-publishes the selection from the fresh record, and clears it when the key is gone. No event
 * fires for either.
 *
 * Each case selects an item (by its action, or a click where the widget has no action), then renames it, reorders the
 * data and removes it, reading what an app sees after each step.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { binding, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { shadcnConfigs } from '../../../../WidgetManager/widgets/shadcn';

const ID = 'w1';
const rows = (field, names, extra = {}) =>
  `{{${JSON.stringify(names.map(([id, name]) => ({ id, [field]: name, ...extra })))}}}`;
const click = (text) => act(async () => fireEvent.click(screen.getByText(text)));

// [componentType, data property, data for names, select, read the selected name, read "nothing selected"]
const CASES = [
  [
    'ShadRecordList',
    'data',
    (names) => rows('customer', names),
    () => click('Grace'),
    (e) => e.selectedItem?.customer,
    (e) => e.selectedItemId === null || e.selectedItemId === undefined,
  ],
  [
    'ShadCardGrid',
    'data',
    (names) => rows('name', names),
    () => click('Grace'),
    (e) => e.selectedItem?.name,
    (e) => e.selectedItemId === null || e.selectedItemId === undefined,
  ],
  [
    'ShadKanban',
    'data',
    (names) => rows('title', names, { status: 'todo' }),
    () => click('Grace'),
    (e) => e.lastSelectedCard?.title,
    (e) => !e.lastSelectedCard || Object.keys(e.lastSelectedCard).length === 0,
  ],
  [
    'ShadTable',
    'data',
    (names) => rows('name', names),
    (widget) => widget.actNow('selectRow', 'id', 2),
    (e) => e.selectedRow?.name,
    (e) => e.selectedRowId === null || e.selectedRowId === undefined,
  ],
  [
    'ShadNavigation',
    'items',
    (names) => `{{${JSON.stringify(names.map(([id, label]) => ({ label, value: `v${id}` })))}}}`,
    (widget) => widget.actNow('selectItem', 'v2'),
    (e) => e.selectedItem?.label,
    (e) => e.selectedItem?.value !== 'v2',
  ],
  [
    'ShadCombobox',
    'options',
    (names) => `{{${JSON.stringify(names.map(([id, label]) => ({ label, value: `v${id}` })))}}}`,
    (widget) => widget.actNow('selectOption', 'v2'),
    (e) => e.selectedOption?.label,
    (e) => e.value === '' && Object.keys(e.selectedOption || {}).length === 0,
  ],
  [
    'ShadMultiselect',
    'options',
    (names) => `{{${JSON.stringify(names.map(([id, label]) => ({ label, value: `v${id}` })))}}}`,
    (widget) => widget.actNow('selectOptions', ['v2']),
    (e) => e.selectedOptions?.[0]?.label,
    (e) => (e.values || []).length === 0 && (e.selectedOptions || []).length === 0,
  ],
];

const harnesses = Object.fromEntries(
  CASES.map(([componentType]) => [
    componentType,
    createWidgetHarness({
      componentType,
      handle: 'widget1',
      id: ID,
      widgetHeight: 500,
      widgetWidth: 900,
      preload: [componentType],
      capabilities: { dnd: true },
    }),
  ])
);
const eventsOf = (componentType) => Object.keys(shadcnConfigs.find((c) => c.name === componentType)?.events || {});

describe('UI 2.0 selections follow a data refresh', () => {
  it.each(CASES)('%s', async (componentType, dataKey, data, select, selectedName, nothingSelected) => {
    const widget = harnesses[componentType];
    await widget.setup();
    try {
      const extra = componentType === 'ShadMultiselect' ? { defaultValue: binding('{{[]}}') } : {};
      widget.render({
        currentMode: 'view',
        properties: {
          [dataKey]: binding(
            data([
              [1, 'Ada'],
              [2, 'Grace'],
              [3, 'Alan'],
            ])
          ),
          ...extra,
        },
      });
      const exposed = () => widget.exposed() ?? {};
      await waitFor(() =>
        expect(screen.queryAllByText('Ada').length + (dataKey === 'data' ? 0 : 1)).toBeGreaterThan(0)
      );
      await select(widget);
      await waitFor(() => expect(selectedName(exposed())).toBe('Grace'));

      const all = eventsOf(componentType);
      widget.setEvents(all.flatMap((event) => countInvocationsOn(ID, event, { key: `n_${event}` })));
      const setData = (names) => widget.setComponentProperty(ID, dataKey, data(names), 'properties');

      setData([
        [1, 'Ada'],
        [2, 'Grace Hopper'],
        [3, 'Alan'],
      ]);
      await waitFor(() => expect(selectedName(exposed())).toBe('Grace Hopper'));
      setData([
        [2, 'Grace Hopper'],
        [1, 'Ada'],
      ]);
      await waitFor(() => expect(selectedName(exposed())).toBe('Grace Hopper'));
      setData([[1, 'Ada']]);
      await waitFor(() => expect(nothingSelected(exposed())).toBe(true));

      const fired = all.filter((event) => widget.variables()[`n_${event}`]);
      expect(fired).toEqual([]);
    } finally {
      widget.teardown();
    }
  });
});
