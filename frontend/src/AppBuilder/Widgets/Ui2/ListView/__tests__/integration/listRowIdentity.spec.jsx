/**
 * UI 2.0 List view: which record a row's component values belong to, after the data or the page changes. From the
 * UI 2.0 release audit (findings 10, 27, 28, 29, 67); each test names its finding. Rows hold an Input whose default is
 * the item's name, so a row's exposed value tells which record it was drawn for.
 *
 * Real store, real RenderWidget, real widgets; jsdom's missing layout is given a width so rows mount their canvas.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { componentDefinition } from '@/test/app-builder';
import userEvent from '@testing-library/user-event';
import { binding, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

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
const values = () => boxes().map((box) => box.value);
const labels = () => screen.queryAllByRole('listitem').map((row) => row.querySelector('label')?.textContent);

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

  describe('[finding 67] when records move, their rows keep their values in the store', () => {
    // Alpha's Input is edited, then the records move: each row's exposed values follow its record, as the drawn row does.
    const editAlpha = async (records = [ALPHA, BETA]) => {
      await render(records);
      await act(async () => fireEvent.change(boxes()[0], { target: { value: 'Alpha edited' } }));
      await waitFor(() => expect(published()[0]).toBe('Alpha edited'));
    };
    const move = async (records) => {
      setData(records);
      await waitFor(() => expect(labels()).toEqual(records.map((record) => record.name)));
    };

    test('a reorder', async () => {
      await editAlpha();
      await move([BETA, ALPHA]);
      expect(values()).toEqual(['Beta', 'Alpha edited']);
      await waitFor(() => expect(published()).toEqual(['Beta', 'Alpha edited']));
    });

    test("a row's action after a reorder changes that row", async () => {
      await editAlpha();
      await move([BETA, ALPHA]);
      await waitFor(() => expect(published()).toEqual(['Beta', 'Alpha edited']));
      await act(async () => exposed().children[0].field1.setText('Beta set'));
      await waitFor(() => expect(values()).toEqual(['Beta set', 'Alpha edited']));
      expect(published()).toEqual(['Beta set', 'Alpha edited']);
    });

    test('a selection after a reorder reads the selected record', async () => {
      await editAlpha();
      await move([BETA, ALPHA]);
      await widget.act('selectItem', 'b');
      await waitFor(() => expect(exposed().selectedRecord?.field1?.value).toBe('Beta'));
      expect(exposed().selectedItem).toEqual(BETA);
    });

    test('a record inserted before it', async () => {
      await editAlpha();
      await move([GAMMA, ALPHA, BETA]);
      expect(values()).toEqual(['Gamma', 'Alpha edited', 'Beta']);
      await waitFor(() => expect(published()).toEqual(['Gamma', 'Alpha edited', 'Beta']));
    });

    test('its own removal leaves nothing of it in the rows that stay', async () => {
      await editAlpha();
      await move([BETA]);
      expect(values()).toEqual(['Beta']);
      await waitFor(() => expect(published()).toEqual(['Beta']));
    });
  });

  test('[finding 27] a row is reached and picked from the keyboard; keys typed in its components do not pick it', async () => {
    await render([ALPHA, BETA]);
    widget.setEvents(countInvocationsOn(ID, 'onRecordClicked'));
    const user = userEvent.setup({ delay: null });
    const rows = () => screen.getAllByRole('listitem');

    await user.tab();
    expect(document.activeElement).toBe(rows()[0]);
    await user.keyboard('{Enter}');
    await waitFor(() => expect(exposed().selectedItem).toEqual(ALPHA));
    expect(widget.variables().calls).toBe(1);

    await user.tab();
    expect(document.activeElement).toBe(boxes()[0]);
    await user.keyboard('{Enter} ');
    expect(widget.variables().calls).toBe(1);

    await user.tab();
    expect(document.activeElement).toBe(rows()[1]);
    await user.keyboard(' ');
    await waitFor(() => expect(exposed().selectedItem).toEqual(BETA));
    expect(widget.variables().calls).toBe(2);
  });
});
