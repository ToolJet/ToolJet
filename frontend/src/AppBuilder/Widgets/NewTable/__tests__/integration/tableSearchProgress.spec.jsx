/**
 * Table search over many rows: a search or filter over more rows than SLICED_ROWS runs in the background. As soon as
 * it starts, the rows on screen are the matches found so far ("Searching…" until the first), filling in as it goes,
 * and the search box shows how far it has got. What the app sees (filteredData …) changes only once it finishes.
 */
import React from 'react';
import { act, configure, fireEvent, getConfig, waitFor } from '@testing-library/react';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import useStore from '@/AppBuilder/_stores/store';
import { tableConfig } from '@tooljet/widget-definitions';
import { AppBuilderTestSession, defineAppBuilderScenario, seedApp, componentDefinition } from '@/test/app-builder';
import { binding, drain, widgetProps, MODULE_ID } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { SLICED_ROWS } from '../../_utils/tableView';

const state = () => useStore.getState();

const SCENARIO = defineAppBuilderScenario({
  id: 'table-search-progress',
  name: 'Table search over many rows fills in its matches as it goes',
  primarySeam: 'rtl',
  surface: 'app-editor',
  edition: 'ce',
  environment: 'development',
  layout: 'desktop',
  version: 'draft',
  transferPath: 'not-applicable',
  access: 'authenticated',
  capabilities: { observers: true, media: { matches: false }, dnd: true },
});

const ROW_COUNT = 3 * SLICED_ROWS;
const COLUMNS = [
  { id: 'c-id', key: 'id', name: 'id', columnType: 'number' },
  { id: 'c-name', key: 'name', name: 'name', columnType: 'string' },
];

let session;

function renderTable(properties = {}) {
  const { definition } = tableConfig;
  const table = componentDefinition('t1', 'table1', 'Table', {
    ...definition.properties,
    data: binding('{{variables.rows}}'),
    columns: { value: COLUMNS },
    autogenerateColumns: { value: false },
    enablePagination: binding('{{false}}'),
    displaySearchBox: binding('{{true}}'),
    ...properties,
  });
  table.component.definition.styles = definition.styles;
  table.component.definition.others = definition.others;
  const rows = Array.from({ length: ROW_COUNT }, (_, i) => ({ id: i + 1, name: `row ${i + 1}` }));
  state().setVariable('rows', rows, MODULE_ID);
  seedApp({ t1: table }, { moduleId: MODULE_ID });
  state().setEditorLoading(false, MODULE_ID);
  state().setCurrentMode('edit', MODULE_ID);
  return session.render(<RenderWidget {...widgetProps('t1', 'Table', { currentMode: 'edit' })} />);
}

const searchInput = () => document.querySelector('[data-cy="table1-search-input-field"]');
const spinner = () => document.querySelector('[data-cy="table1-search-progress"]');
const percentText = () => document.querySelector('[data-cy="table1-search-progress-text"]');
const searchingState = () => document.querySelector('[data-cy="table1-searching-state"]');
const shownRows = () =>
  [...document.querySelectorAll('.jet-data-table tbody tr[data-index]')].map((tr) => tr.textContent);
const exposed = () => state().getExposedValueOfComponent('t1', MODULE_ID);
const exposedFiltered = () => exposed()?.filteredData;

/** Types `term` and records what the Table shows on every change until `done()`. */
async function search(term, done) {
  const seen = [];
  const observer = new MutationObserver(() => {
    if (!spinner()) return;
    seen.push({
      percent: percentText()?.textContent ?? null,
      searching: searchingState()?.textContent ?? null,
      rows: shownRows(),
      exposedLength: exposedFiltered()?.length,
      footerPage: document.querySelector('[data-cy="pagination-button-go-to-page"].selected')?.textContent ?? null,
    });
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  fireEvent.change(searchInput(), { target: { value: term } });
  // Typing shows at once; the search starts once typing pauses.
  expect(searchInput().value).toBe(term);
  await waitFor(() => expect(done()).toBe(true), { timeout: 30000 });
  observer.disconnect();
  return seen;
}

jest.setTimeout(60000);

// Waits for a 300k-row Table: a CI runner takes several times as long as a laptop. Restored after this file, so other
// files keep testing-library's default.
let asyncUtilTimeout;
beforeAll(() => {
  ({ asyncUtilTimeout } = getConfig());
  configure({ asyncUtilTimeout: 30000 });
});
afterAll(() => configure({ asyncUtilTimeout }));

describe('Table search over many rows', () => {
  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario: SCENARIO });
  });

  test('"Searching…" in place of the rows until a match is found, never the rows from before', async () => {
    renderTable();
    await drain();
    await waitFor(() => expect(shownRows()[0]).toContain('row 1'));
    expect(spinner()).toBeNull();

    // Its one match is 41% of the way in.
    const seen = await search('row 123456', () => !spinner() && shownRows()[0]?.includes('row 123456'));

    expect(seen.some(({ searching }) => searching === 'Searching…')).toBe(true);
    expect(seen.every(({ rows }) => rows.every((text) => text.includes('123456')))).toBe(true);
    seen.forEach(({ percent }) => percent !== null && expect(percent).toMatch(/^\d{1,2}%$/));
    // Done: the match, the search icon back, no "Searching…".
    expect(searchingState()).toBeNull();
    expect(percentText()).toBeNull();
    expect(document.querySelector('[data-cy="table1-search-input-icon"]')).not.toBeNull();
    expect(exposedFiltered()).toHaveLength(1);
  });

  test('matches show as they are found, while what the app sees keeps the previous result until the end', async () => {
    renderTable();
    await drain();
    await waitFor(() => expect(shownRows()[0]).toContain('row 1'));
    expect(exposedFiltered()).toHaveLength(ROW_COUNT);

    // Matches all along the rows: 9999, 19999 … 299999.
    const finalCount = Array.from({ length: ROW_COUNT }, (_, i) => `row ${i + 1}`).filter((name) =>
      name.includes('9999')
    ).length;
    const seen = await search('9999', () => !spinner() && exposedFiltered()?.length === finalCount);

    // While it ran: matches on screen (only matches), and the app still saw every row.
    const withMatches = seen.filter(({ rows }) => rows.length > 0);
    expect(withMatches.length).toBeGreaterThan(0);
    withMatches.forEach(({ rows }) => rows.forEach((text) => expect(text).toContain('9999')));
    seen.forEach(({ exposedLength }) => expect(exposedLength).toBe(ROW_COUNT));
    // Done: every match.
    expect(shownRows()[0]).toContain('row 9999');
  });

  test('a column filter fills in the same way, saying "Filtering"', async () => {
    renderTable();
    await drain();
    await waitFor(() => expect(shownRows()[0]).toContain('row 1'));

    const seen = [];
    const observer = new MutationObserver(() => {
      if (!spinner()) return;
      seen.push({
        searching: searchingState()?.textContent ?? null,
        rows: shownRows(),
        exposedLength: exposedFiltered()?.length,
      });
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    await act(async () =>
      state()
        .getExposedValueOfComponent('t1', MODULE_ID)
        .setFilters([{ column: 'name', condition: 'contains', value: 'row 123456' }])
    );
    await waitFor(() => expect(exposedFiltered()).toHaveLength(1), { timeout: 30000 });
    observer.disconnect();

    expect(seen.length).toBeGreaterThan(0);
    seen.forEach(({ rows, exposedLength }) => {
      rows.forEach((text) => expect(text).toContain('123456'));
      expect(exposedLength).toBe(ROW_COUNT);
    });
    expect(seen.some(({ searching }) => searching === 'Filtering…')).toBe(true);
    expect(shownRows()).toHaveLength(1);
    expect(shownRows()[0]).toContain('row 123456');
  });

  test('a sorted Table keeps its rows with the spinner, then shows the sorted matches', async () => {
    renderTable();
    await drain();
    await waitFor(() => expect(shownRows()[0]).toContain('row 1'));
    await act(async () => exposed().setSort('id', 'desc'));
    await waitFor(() => expect(shownRows()[0]).toContain('row 300000'), { timeout: 30000 });

    const seen = await search('9999', () => !spinner() && exposedFiltered()?.length < ROW_COUNT);

    // Not filled in: the rows from before (still sorted), never "Searching…".
    expect(seen.length).toBeGreaterThan(0);
    seen.forEach(({ searching, rows }) => {
      expect(searching).toBeNull();
      expect(rows[0]).toContain('row 300000');
    });
    // Done: the matches, in the sort's order (highest id first).
    await waitFor(() => expect(shownRows()[0]).toContain('row 299999'));
  });

  test('with pagination, the matches fill in the first page (where they land), one page at most', async () => {
    renderTable({ enablePagination: binding('{{true}}'), rowsPerPage: binding('{{10}}') });
    await drain();
    await waitFor(() => expect(shownRows()[0]).toContain('row 1'));
    // Once the Table has settled after its first load (it goes back to the first page when its rows change).
    await waitFor(async () => {
      await act(async () => exposed().setPage(4));
      await drain();
      expect(shownRows()[0]).toContain('row 31');
    });

    const seen = await search('9999', () => !spinner() && exposedFiltered()?.length < ROW_COUNT);

    const withMatches = seen.filter(({ rows }) => rows.length > 0);
    expect(withMatches.length).toBeGreaterThan(0);
    withMatches.forEach(({ rows, footerPage }) => {
      expect(rows.length).toBeLessThanOrEqual(10);
      // The first page of the matches, not the 4th (the page resets to the first on new rows), and the footer says so.
      expect(rows[0]).toContain('row 9999');
      expect(footerPage).toBe('1');
    });
    await waitFor(() => expect(shownRows()[0]).toContain('row 9999'));
    expect(shownRows().length).toBeLessThanOrEqual(10);
  });
});
