/**
 * UI 2.0 List view: which record a row's component values belong to, after the data or the page changes. From the
 * UI 2.0 release audit (findings 10, 27, 28, 29, 67); each test names its finding. Rows hold an Input whose default is
 * the item's name, so a row's exposed value tells which record it was drawn for.
 *
 * Real store, real RenderWidget, real widgets; jsdom's missing layout is given a width so rows mount their canvas.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { componentDefinition } from '@/test/app-builder';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'list1';
const widget = createWidgetHarness({
  componentType: 'ShadListView',
  handle: 'list1',
  id: ID,
  widgetHeight: 500,
  widgetWidth: 600,
  capabilities: { dnd: true },
  preload: ['ShadInput'],
});

const ALPHA = { id: 'a', name: 'Alpha' };
const BETA = { id: 'b', name: 'Beta' };
const GAMMA = { id: 'c', name: 'Gamma' };
const DELTA = { id: 'd', name: 'Delta' };
const json = (records) => `{{${JSON.stringify(records)}}}`;

/** An Input per row, labelled and defaulted with the row's name. */
const field = () => {
  const child = componentDefinition('field1', 'field1', 'ShadInput', {
    label: binding('{{listItem.name}}'),
    defaultValue: binding('{{listItem.name}}'),
  });
  child.component.parent = ID;
  child.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
  child.layouts = { desktop: { top: 0, left: 0, width: 25, height: 90 } };
  return child;
};

const exposed = () => widget.exposed() ?? {};
/** The Input values the store holds per row, in row order. */
const published = () => Object.values(exposed().children ?? {}).map((row) => row.field1?.value);
const boxes = () => screen.queryAllByRole('textbox');

/** Renders the list and waits for its first `rows` rows (all records by default) to publish their values. */
const render = async (records, properties = {}, rows = records.length) => {
  widget.render({
    currentMode: 'view',
    extraComponents: { field1: field() },
    properties: { data: binding(json(records)), idField: binding('id'), ...properties },
  });
  await waitFor(() => expect(published()).toHaveLength(rows));
};

const paged = { enablePagination: binding('{{true}}'), rowsPerPage: binding('{{2}}') };
const setData = (records) => widget.setComponentProperty(ID, 'data', json(records), 'properties');

let restoreWidth;
beforeAll(() => {
  const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
  Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => 600 });
  restoreWidth = () => Object.defineProperty(Element.prototype, 'clientWidth', descriptor);
});
afterAll(() => restoreWidth?.());

describe('UI 2.0 List view row identity', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[finding 10] data refreshed to nothing leaves no rows in children', async () => {
    await render([ALPHA, BETA]);
    setData([]);
    await waitFor(() => expect(boxes()).toHaveLength(0));
    expect(exposed().data).toEqual([]);
    await waitFor(() => expect(Object.keys(exposed().children ?? {})).toHaveLength(0));
  });

  test('[finding 29] a page clamped after the data shrinks is the page published', async () => {
    await render([ALPHA, BETA, GAMMA, DELTA], paged, 2);
    await widget.act('setPage', 2);
    await waitFor(() => expect(screen.getByText('Page 2 of 2')).toBeInTheDocument());
    setData([ALPHA, BETA]);
    await waitFor(() => expect(screen.getByText('Page 1 of 1')).toBeInTheDocument());
    await waitFor(() => expect(exposed().pageIndex).toBe(1));
  });

  test.each(['setPage', 'the Next button'])(
    '[finding 28] after a page turn by %s, the selection pairs no other record with the selected item',
    async (how) => {
      await render([ALPHA, BETA, GAMMA, DELTA], paged, 2);
      await widget.act('selectItem', 'b');
      expect(exposed().selectedRecord.field1.value).toBe('Beta');

      if (how === 'setPage') await widget.act('setPage', 2);
      else fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
      await waitFor(() => expect(published()).toEqual(['Gamma', 'Delta']));
      // Beta stays selected (by its id), but no row on this page is its record.
      await waitFor(() => expect(exposed().selectedRecordId).toBeNull());
      expect(exposed().selectedItem).toEqual(BETA);
      expect(exposed().selectedRecord).toEqual({});

      await widget.act('setPage', 1);
      await waitFor(() => expect(exposed().selectedRecord?.field1?.value).toBe('Beta'));
      expect(exposed().selectedRecordId).toBe(1);
    }
  );
});
