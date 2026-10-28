import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { DataTable } from '../../../../../../../packs/shadcn/src/components/DataTable';

// A paginated shadcn DataTable keeps a full page's height on a short last page: the blank sits inside the table, not
// under the widget (a card fitted to the table shrank and left a gap on the page).
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const mount = async (props) => {
  loadLibraryModule.mockResolvedValue({ DataTable });
  const view = render(
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey={`paging-${Math.random()}`}
      componentName="DataTable"
      componentProps={props}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={() => {}}
      fireEvent={() => {}}
      actions={new Map()}
      host={{ disabled: false, loading: false, setRows: () => {} }}
      dataCy="pack-widget"
    />
  );
  const root = () => view.container.querySelector('[data-cy="pack-widget"]').shadowRoot;
  await waitFor(() => expect(root().querySelector('tbody')).not.toBeNull());
  return root;
};

const rows = (n) => Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `Client ${i + 1}` }));
const columns = [{ key: 'name', name: 'Client' }];

describe('a paginated DataTable on a short last page', () => {
  test('pads the missing rows inside the table', async () => {
    const root = await mount({ data: rows(23), columns, enablePagination: true, rowsPerPage: 10 });
    fireEvent.click([...root().querySelectorAll('button')].find((b) => b.textContent.trim() === '3'));
    await waitFor(() => expect(root().querySelectorAll('tbody tr:not(.t2-page-filler)')).toHaveLength(3));
    const filler = root().querySelector('tbody tr.t2-page-filler td');
    expect(filler).not.toBeNull();
    expect(parseFloat(filler.style.height)).toBeGreaterThan(0);
  });

  test('adds nothing to a single page or a full page', async () => {
    const single = await mount({ data: rows(4), columns, enablePagination: true, rowsPerPage: 10 });
    expect(single().querySelector('tr.t2-page-filler')).toBeNull();
    const full = await mount({ data: rows(23), columns, enablePagination: true, rowsPerPage: 10 });
    expect(full().querySelector('tr.t2-page-filler')).toBeNull();
  });
});

describe('a DataTable in another language', () => {
  test('draws its own toolbar and footer text', async () => {
    const root = await mount({
      data: rows(23),
      columns,
      enablePagination: true,
      rowsPerPage: 10,
      filterLabel: 'Filtrer',
      columnsLabel: 'Colonnes',
      rowCountLabel: '{count} lignes',
    });
    const text = root().textContent;
    expect(text).toContain('Filtrer');
    expect(text).toContain('Colonnes');
    expect(text).toContain('23 lignes');
    expect(text).not.toMatch(/\bColumns\b/);
  });

  test('keeps the English defaults, with "1 row" for one', async () => {
    const one = await mount({ data: rows(1), columns });
    expect(one().textContent).toContain('1 row');
    expect(one().textContent).toContain('Filter');
  });
});

// A row button's handler reads the row it was pressed on: the table selects that row before onActionButtonClicked
// fires. It fired first, so a query reading selectedRow acted on the row selected before ("Mark resolved" resolved
// nothing, codex lifecycle audit 2026-10-26). onRowClicked still follows the action.
describe('a DataTable row button', () => {
  test('selects its row before its handler runs', async () => {
    const calls = [];
    loadLibraryModule.mockResolvedValue({ DataTable });
    const view = render(
      <InlineLibraryComponent
        bundleUrl="pack.js"
        cssUrl="pack.css"
        cacheKey={`action-${Math.random()}`}
        componentName="DataTable"
        componentProps={{
          data: rows(3),
          allowSelection: true,
          columns: [
            ...columns,
            { key: 'act', name: '', columnType: 'button', buttons: [{ id: 'resolve', label: 'Resolve' }] },
          ],
        }}
        componentStyles={{}}
        renderSlot={() => null}
        setExposedVariable={(name, value) => calls.push(['set', name, value])}
        fireEvent={(name) => calls.push(['event', name])}
        actions={new Map()}
        host={{ disabled: false, loading: false, setRows: () => {} }}
        dataCy="pack-widget"
      />
    );
    const root = () => view.container.querySelector('[data-cy="pack-widget"]').shadowRoot;
    await waitFor(() => expect(root().querySelectorAll('tbody tr')).toHaveLength(3));
    calls.length = 0;
    const second = root().querySelectorAll('tbody tr')[1];
    fireEvent.click([...second.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Resolve'));
    await waitFor(() =>
      expect(calls.some(([kind, name]) => kind === 'event' && name === 'onActionButtonClicked')).toBe(true)
    );
    const fired = calls.findIndex(([kind, name]) => kind === 'event' && name === 'onActionButtonClicked');
    const selectedBefore = calls
      .slice(0, fired)
      .filter(([kind, name]) => kind === 'set' && name === 'selectedRow')
      .pop();
    expect(selectedBefore?.[2]).toMatchObject({ id: 2 });
    const rowClicked = calls.findIndex(([kind, name]) => kind === 'event' && name === 'onRowClicked');
    expect(rowClicked).toBeGreaterThan(fired);
  });
});
