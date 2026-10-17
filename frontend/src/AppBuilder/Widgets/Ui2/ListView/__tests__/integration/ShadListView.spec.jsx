/**
 * UI 2.0 List view: a row template (the components placed in the list) repeated per data item, each row reading its
 * item as {{listItem}}, with selection, paging and a grid mode.
 *
 * Real store, real RenderWidget, real widget, real child widgets; nothing about the widget is mocked (jsdom's missing
 * layout is given a width so rows mount their canvas). Standard control behaviour (visibility, disabled, loading,
 * tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx; this file covers what the List
 * view itself does. Titles carry [ShadListView-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import { componentDefinition } from '@/test/app-builder';
import { binding, setVariableOn, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import useStore from '@/AppBuilder/_stores/store';

const ID = 'lv1';
const widget = createWidgetHarness({
  componentType: 'ShadListView',
  handle: 'list1',
  id: ID,
  widgetHeight: 500,
  widgetWidth: 600,
  capabilities: { dnd: true },
  preload: ['ShadText'],
});

/** A Text in the row template showing each row's name. */
const rowText = () => {
  const child = componentDefinition('rowText', 'rowText', 'ShadText', { text: { value: '{{listItem.name}}' } });
  child.component.parent = ID;
  child.component.definition.others = { showOnDesktop: { value: '{{true}}' }, showOnMobile: { value: '{{false}}' } };
  child.layouts = { desktop: { top: 0, left: 0, width: 20, height: 30 } };
  return child;
};
const PEOPLE = "{{[{ key: 'a', name: 'Ada' }, { key: 'b', name: 'Grace' }, { key: 'c', name: 'Alan' }]}}";
const render = (options = {}) =>
  widget.render({ currentMode: 'view', extraComponents: { rowText: rowText() }, ...options });
const items = () => screen.queryAllByRole('listitem');
const names = () => items().map((row) => row.textContent);
const list = () => screen.getByRole('list');
const exposed = () => widget.exposed() ?? {};
const settle = () => act(() => new Promise((r) => setTimeout(r, 30)));
const people = (extra = {}) => ({ data: binding(PEOPLE), idField: binding('key'), ...extra });

let restoreWidth;
beforeAll(() => {
  const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
  Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => 600 });
  restoreWidth = () => Object.defineProperty(Element.prototype, 'clientWidth', descriptor);
});
afterAll(() => restoreWidth?.());

describe('UI 2.0 List view', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadListView-DEF-001] repeats the row template per item and exposes the records, nothing selected', async () => {
    render();

    await waitFor(() => expect(names()).toEqual(['Ada Lovelace', 'Alan Turing', 'Grace Hopper']));
    expect(exposed().data).toHaveLength(3);
    expect(exposed()).toMatchObject({
      selectedItem: {},
      selectedItemId: null,
      selectedRecord: {},
      selectedRecordId: null,
      pageIndex: 1,
    });
    // children: each row's component values, as on the native List view.
    await waitFor(() => expect(exposed().children?.[1]?.rowText?.text).toBe('Alan Turing'));
  });

  test('[ShadListView-EVT-001] clicking a row fires onRecordClicked with the item, its id and its components already exposed', async () => {
    render({ properties: people() });
    widget.setEvents(setVariableOn(ID, 'onRecordClicked', { value: '{{components.list1.selectedItem.name}}' }));

    await waitFor(() => expect(names()).toEqual(['Ada', 'Grace', 'Alan']));
    fireEvent.click(screen.getByText('Grace'));

    await waitFor(() => expect(widget.variables().seen).toBe('Grace'));
    expect(exposed()).toMatchObject({ selectedItemId: 'b', selectedRecordId: 1 });
    expect(exposed().selectedRecord).toMatchObject({ rowText: { text: 'Grace' } });
    expect(items()[1]).toHaveClass('tw-ring-1');
  });

  test('[ShadListView-PROP-001] data that arrives after the first render fills the rows, and follows changes', async () => {
    render({ properties: { data: binding('{{[]}}'), emptyText: binding('Nobody yet') } });

    expect(await screen.findByText('Nobody yet')).toBeInTheDocument();
    expect(exposed().data).toEqual([]);
    widget.setComponentProperty(ID, 'data', PEOPLE, 'properties');
    await waitFor(() => expect(names()).toEqual(['Ada', 'Grace', 'Alan']));
    widget.setComponentProperty(ID, 'data', "{{[{ id: 9, name: 'Zeta' }]}}", 'properties');
    await waitFor(() => expect(names()).toEqual(['Zeta']));
    // data is the records, so (components.list1.data || []).length counts them.
    expect(exposed().data).toEqual([{ id: 9, name: 'Zeta' }]);
  });

  test('[ShadListView-PROP-002] mode grid lays the rows in columns with a gap; list mode stays one column', async () => {
    render({ properties: people({ mode: binding('grid'), columns: binding('{{2}}'), gap: binding('{{12}}') }) });
    await waitFor(() => expect(list().style.gridTemplateColumns).toBe('repeat(2, minmax(0, 1fr))'));
    expect(list().style.gap).toBe('12px');

    render({ properties: people({ columns: binding('{{2}}') }) });
    await waitFor(() => expect(list().style.gridTemplateColumns).toBe('repeat(1, minmax(0, 1fr))'));
  });

  test('[ShadListView-PROP-003] rowHeight sets each row height; showBorder divides list rows with no gap', async () => {
    render({
      properties: people({
        rowHeight: binding('{{90}}'),
        showBorder: binding('{{true}}'),
        dynamicHeight: binding('{{false}}'),
      }),
    });

    await waitFor(() => expect(items()[0].style.height).toBe('90px'));
    expect(items()[0]).toHaveClass('tw-border-b');
    expect(list().style.gap).toBe('0');
  });

  // A row stayed at rowHeight while a component in it grew, cutting it off (a long bound note grew its Text to 116px in
  // a 60px row, 2026-10-11). The reflow sizes each row from its components, as the native Listview's rows.
  test('[ShadListView-PROP-008] with dynamicHeight in an app each row fits its components, each row on its own', async () => {
    const tall = rowText();
    tall.id = 'rowNote';
    tall.name = 'rowNote';
    tall.component.name = 'rowNote';
    tall.layouts = { desktop: { top: 40, left: 0, width: 20, height: 110 } };
    render({
      properties: people({ rowHeight: binding('{{72}}') }),
      extraComponents: { rowText: rowText(), rowNote: tall },
    });

    // Laid out to 150px: the row grows to it, plus 8px under it.
    await waitFor(() => expect(items().map((row) => row.style.height)).toEqual(['158px', '158px', '158px']));
    // A component grown in one row (the reflow writes that row's height) grows that row only.
    act(() => useStore.getState().setTemporaryLayouts({ 'lv1-1': { height: 260 } }));
    await waitFor(() => expect(items()[1].style.height).toBe('260px'));
    expect(items()[0].style.height).toBe('158px');
  });

  // Inside a container that gives its children no path of its own (a native Kanban card), the list is reflowed at
  // [card] and its rows at [card, row]. Keyed [row] alone, row 0 read the list's own height in card 0 and the two grew
  // each other without end.
  test('[ShadListView-PROP-010] in a card of another container its rows never read the height of the list itself', async () => {
    render({ subContainerIndex: 0, properties: people({ rowHeight: binding('{{72}}') }) });
    await waitFor(() => expect(items()).toHaveLength(3));
    act(() => useStore.getState().setTemporaryLayouts({ 'lv1-0': { height: 5000 }, 'lv1-0.1': { height: 260 } }));
    await waitFor(() => expect(items()[1].style.height).toBe('260px'));
    expect(items()[0].style.height).not.toBe('5000px');
  });

  // The first edit-mode render loads the editor's own modules (about 4s in jest), so this one gets more time.
  test('[ShadListView-PROP-009] in the editor rows keep rowHeight whatever the reflow wrote', async () => {
    render({ currentMode: 'edit', properties: people({ rowHeight: binding('{{72}}') }) });
    await waitFor(() => expect(items()).toHaveLength(3));
    act(() => useStore.getState().setTemporaryLayouts({ 'lv1-1': { height: 260 } }));
    await settle();
    expect(items()[1].style.height).toBe('72px');
  }, 15000);

  test('[ShadListView-PROP-004] highlightSelectedRow off selects a row without marking it', async () => {
    render({ properties: people({ highlightSelectedRow: binding('{{false}}') }) });

    await waitFor(() => expect(names()).toHaveLength(3));
    fireEvent.click(screen.getByText('Alan'));
    await waitFor(() => expect(exposed().selectedItemId).toBe('c'));
    expect(items()[2]).not.toHaveClass('tw-ring-1');
  });

  test('[ShadListView-PROP-005] idField keys the selection, so it follows its item when the data reorders', async () => {
    render({ properties: people() });

    await waitFor(() => expect(names()).toHaveLength(3));
    fireEvent.click(screen.getByText('Ada'));
    await waitFor(() => expect(exposed().selectedItemId).toBe('a'));
    widget.setComponentProperty(
      ID,
      'data',
      "{{[{ key: 'c', name: 'Alan' }, { key: 'a', name: 'Ada' }]}}",
      'properties'
    );
    await waitFor(() => expect(names()).toEqual(['Alan', 'Ada']));
    expect(items()[1]).toHaveClass('tw-ring-1');
    expect(items()[0]).not.toHaveClass('tw-ring-1');
  });

  // Review: the highlight followed the record key, but selectedItem kept the old record after a refresh (.data had
  // the new name, .selectedItem the old one). The selection is kept by key with the fresh record, at its new place,
  // and cleared when the key is gone; none of this fires an event.
  test('[ShadListView-PROP-011] a data refresh updates the selected item, follows it when reordered and clears it when removed', async () => {
    render({ properties: people() });
    widget.setEvents(countInvocationsOn(ID, 'onRecordClicked', { key: 'clicks' }));
    await waitFor(() => expect(names()).toHaveLength(3));
    fireEvent.click(screen.getByText('Grace'));
    await waitFor(() => expect(exposed().selectedItem).toEqual({ key: 'b', name: 'Grace' }));

    const setData = (d) => widget.setComponentProperty(ID, 'data', d, 'properties');
    setData("{{[{ key: 'a', name: 'Ada' }, { key: 'b', name: 'Grace Hopper' }, { key: 'c', name: 'Alan' }]}}");
    await waitFor(() => expect(exposed().selectedItem).toEqual({ key: 'b', name: 'Grace Hopper' }));
    expect(exposed()).toMatchObject({ selectedItemId: 'b', selectedRecordId: 1 });

    setData("{{[{ key: 'b', name: 'Grace Hopper' }, { key: 'a', name: 'Ada' }]}}");
    await waitFor(() => expect(exposed().selectedRecordId).toBe(0));
    expect(exposed()).toMatchObject({ selectedItem: { key: 'b', name: 'Grace Hopper' }, selectedItemId: 'b' });

    setData("{{[{ key: 'a', name: 'Ada' }]}}");
    await waitFor(() => expect(exposed().selectedItemId).toBeNull());
    expect(exposed()).toMatchObject({ selectedItem: {}, selectedRecord: {}, selectedRecordId: null });
    expect(items()[0]).not.toHaveClass('tw-ring-1');
    expect(widget.variables().clicks).toBe(1);
  });

  test('[ShadListView-PROP-006] enablePagination with rowsPerPage pages the rows; Next fires onPageChanged with pageIndex set', async () => {
    render({ properties: people({ enablePagination: binding('{{true}}'), rowsPerPage: binding('{{2}}') }) });
    widget.setEvents(setVariableOn(ID, 'onPageChanged', { value: '{{components.list1.pageIndex}}' }));

    await waitFor(() => expect(names()).toEqual(['Ada', 'Grace']));
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));

    await waitFor(() => expect(widget.variables().seen).toBe(2));
    expect(names()).toEqual(['Alan']);
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  test('[ShadListView-PROP-007] serverSidePagination shows the data as the page and counts pages from totalRecords', async () => {
    render({
      properties: people({
        enablePagination: binding('{{true}}'),
        rowsPerPage: binding('{{3}}'),
        serverSidePagination: binding('{{true}}'),
        totalRecords: binding('{{40}}'),
      }),
    });

    await waitFor(() => expect(names()).toEqual(['Ada', 'Grace', 'Alan']));
    expect(screen.getByText('Page 1 of 14')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await waitFor(() => expect(exposed().pageIndex).toBe(2));
    // The app fetches the next page; until then the rows are what data holds.
    expect(names()).toEqual(['Ada', 'Grace', 'Alan']);
  });

  test('[ShadListView-ACT-001] selectItem selects by id without firing onRecordClicked; clearSelection empties it', async () => {
    render({ properties: people() });
    widget.setEvents(setVariableOn(ID, 'onRecordClicked'));

    await waitFor(() => expect(names()).toHaveLength(3));
    await widget.act('selectItem', 'c');
    await waitFor(() => expect(exposed()).toMatchObject({ selectedItemId: 'c', selectedRecordId: 2 }));
    expect(exposed().selectedItem).toEqual({ key: 'c', name: 'Alan' });
    expect(items()[2]).toHaveClass('tw-ring-1');
    await widget.act('clearSelection');
    await waitFor(() => expect(exposed().selectedItemId).toBeNull());
    expect(exposed()).toMatchObject({ selectedItem: {}, selectedRecord: {}, selectedRecordId: null });
    expect(widget.variables().seen).toBeUndefined();
  });

  test('[ShadListView-ACT-002] setPage moves to a page without firing onPageChanged', async () => {
    render({ properties: people({ enablePagination: binding('{{true}}'), rowsPerPage: binding('{{1}}') }) });
    widget.setEvents(setVariableOn(ID, 'onPageChanged'));

    await waitFor(() => expect(names()).toEqual(['Ada']));
    await widget.act('setPage', 2);
    await waitFor(() => expect(names()).toEqual(['Grace']));
    expect(exposed().pageIndex).toBe(2);
    await settle();
    expect(widget.variables().seen).toBeUndefined();
  });

  test('[ShadListView-DEF-002] draws 100 rows of a big binding without paging, then 100 more per press', async () => {
    render({
      properties: { data: binding("{{Array.from({ length: 250 }, (_, i) => ({ id: i, name: 'Row ' + i }))}}") },
    });

    await waitFor(() => expect(items()).toHaveLength(100));
    fireEvent.click(screen.getByText('Show 100 more of 150'));
    await waitFor(() => expect(items()).toHaveLength(200));
  });

  // The rows' {{listItem}} values were written to the store during the list's render: React warned that another
  // component updated while this one rendered, and it risked a render loop.
  test('[ShadListView-DEF-003] writes its rows to the store outside render', async () => {
    const errors = [];
    const spy = jest.spyOn(console, 'error').mockImplementation((...args) => errors.push(args.join(' ')));
    try {
      render({ properties: people() });
      await waitFor(() => expect(names()).toHaveLength(3));
      widget.setComponentProperty(ID, 'data', "{{[{ id: 4, name: 'Dee' }, { id: 5, name: 'Eve' }]}}", 'properties');
      await waitFor(() => expect(names()).toEqual(['Dee', 'Eve']));
    } finally {
      spy.mockRestore();
    }
    expect(errors.filter((e) => /Cannot update a component/.test(e))).toEqual([]);
  });

  test('[ShadListView-STY-001] list, item, selection and divider styles reach the list', async () => {
    const { container } = render({
      properties: people({ dynamicHeight: binding('{{false}}') }),
      styles: {
        accentColor: binding('#db2777'),
        backgroundColor: binding('#fdf2f8'),
        itemBackgroundColor: binding('#ffffff'),
        itemHoverBackgroundColor: binding('#fce7f3'),
        selectedItemBackgroundColor: binding('#fbcfe8'),
        itemBorderColor: binding('#f9a8d4'),
        dividerColor: binding('#f472b6'),
        itemBorderRadius: binding('{{10}}'),
        itemVariant: binding('outline'),
        itemShadow: binding('sm'),
        padding: binding('{{6}}'),
        emptyTextColor: binding('#9d174d'),
      },
    });

    const root = container.querySelector('.tj-shadcn');
    await waitFor(() => expect(items()).toHaveLength(3));
    expect(
      ['--sc-primary', '--lv-hover-bg', '--lv-selected-bg', '--lv-divider', '--lv-item-border', '--lv-empty'].map((v) =>
        root.style.getPropertyValue(v)
      )
    ).toEqual(['#db2777', '#fce7f3', '#fbcfe8', '#f472b6', '#f9a8d4', '#9d174d']);
    expect(root.style.background).toBe('rgb(253, 242, 248)');
    expect(root.style.padding).toBe('6px');
    // An outlined item is framed by the border class (the pack reset zeroes inline borders).
    expect(items()[0]).toHaveClass('tw-border');
    expect(items()[0].style.background).toBe('rgb(255, 255, 255)');
    expect(items()[0].style.borderRadius).toBe('10px');
    expect(items()[0].style.boxShadow).toBe('0 1px 2px 0 rgb(0 0 0 / 0.05)');
  });
});
