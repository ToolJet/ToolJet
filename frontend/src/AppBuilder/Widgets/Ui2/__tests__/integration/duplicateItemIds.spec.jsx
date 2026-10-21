/**
 * Card grid, Record list and Progress list with two items that share an id. Builders bind to selectedItemId, the data's
 * id, so it stays the shared id; the selection itself is kept by a per-item key (the id plus its occurrence), so a
 * click on the other duplicate moves the highlight, publishes that item's row and index, and fires the event; and a
 * data refresh keeps the selection on the same duplicate, even when other items are added in front of it.
 * Real store, real RenderWidget, real widgets.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, waitFor } from '@testing-library/react';
import { binding, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const rowsOf = (items) =>
  binding(`{{${JSON.stringify(items.map(([id, name]) => ({ id, name, value: 10, done: 50, status: 'Open' })))}}}`);
const DUPES = [
  [1, 'First one'],
  [1, 'Second one'],
  [2, 'Other'],
];
// The duplicates with a new item in front of them.
const SHIFTED = [[3, 'New'], ...DUPES];

const WIDGETS = [
  ['ShadCardGrid', 'onCardClicked', { titleField: binding('name') }, '[role=button]'],
  ['ShadRecordList', 'onItemClicked', { titleField: binding('name') }, 'li > [role=button]'],
  [
    'ShadProgressList',
    'onItemClicked',
    { labelField: binding('name'), valueField: binding('done') },
    'li[role=button]',
  ],
];

describe.each(WIDGETS)('%s with a repeated id', (componentType, event, fields, itemSelector) => {
  const widget = createWidgetHarness({ componentType, handle: 'w1', id: 'w1', widgetHeight: 500, widgetWidth: 700 });
  const items = () => [...document.querySelectorAll(`.canvas-component ${itemSelector}`)];
  const item = (name) => items().find((el) => el.textContent.includes(name));
  const exposed = () => widget.exposed() ?? {};
  const render = (data) => widget.render({ currentMode: 'view', properties: { data: rowsOf(data), ...fields } });

  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('a click on the other duplicate selects it: its row, its index, the shared id, and the event', async () => {
    render(DUPES);
    widget.setEvents(countInvocationsOn('w1', event));
    await waitFor(() => expect(items()).toHaveLength(3));

    fireEvent.click(item('First one'));
    await waitFor(() => expect(exposed().selectedItem?.name).toBe('First one'));
    expect(exposed().selectedItemId).toBe(1);
    expect(exposed().selectedItemIndex).toBe(0);

    fireEvent.click(item('Second one'));
    await waitFor(() => expect(exposed().selectedItem?.name).toBe('Second one'));
    expect(exposed().selectedItemId).toBe(1);
    expect(exposed().selectedItemIndex).toBe(1);
    await waitFor(() => expect(widget.variables().calls).toBe(2));
    if (componentType !== 'ShadProgressList') {
      expect(item('Second one').closest('[data-selected]')).not.toBeNull();
      expect(item('First one').closest('[data-selected]')).toBeNull();
    }
  });

  test('a data refresh keeps the selection on the same duplicate, with an item added in front of it', async () => {
    render(DUPES);
    widget.setEvents(countInvocationsOn('w1', event));
    await waitFor(() => expect(items()).toHaveLength(3));
    fireEvent.click(item('Second one'));
    await waitFor(() => expect(exposed().selectedItem?.name).toBe('Second one'));

    act(() =>
      widget.setComponentProperty(
        'w1',
        'data',
        `{{${JSON.stringify(SHIFTED.map(([id, name]) => ({ id, name, value: 10, done: 50, status: 'Open' })))}}}`,
        'properties'
      )
    );
    await waitFor(() => expect(items()).toHaveLength(4));
    await waitFor(() => expect(exposed().selectedItemIndex).toBe(2));
    expect(exposed().selectedItem?.name).toBe('Second one');
    expect(exposed().selectedItemId).toBe(1);
  });
});
