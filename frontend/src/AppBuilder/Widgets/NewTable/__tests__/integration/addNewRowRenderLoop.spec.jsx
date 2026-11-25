/**
 * Table "Add new rows" popup — adding another row must settle, not re-render forever.
 *
 * Reported against v3.21.86-beta: clicking "+" (Add another row) in the Add new rows popup froze
 * the browser tab.
 *
 * Root cause, AddNewRow.jsx: the popup's TanStack table got a brand-new `data` array on every
 * render. table-core resets the page index whenever `data` changes identity (getCoreRowModel ->
 * _autoResetPageIndex -> resetPageIndex), and that reset is a React state update on AddNewRow, so
 * each render queued the next one with no end. From a real mouse click every chained update
 * inherits the click's discrete priority and runs as a back-to-back microtask, so the tab never
 * paints again. Under jsdom the same loop runs at default priority and yields between renders,
 * which is what this spec observes: commits that keep coming after the interaction is over.
 *
 * The Profiler is the oracle on purpose: the defect IS unbounded rendering, and nothing in the DOM
 * changes between two identical renders.
 */
import React, { Profiler } from 'react';
import { screen, waitFor } from '@testing-library/react';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import {
  createWidgetHarness,
  binding,
  drain,
  widgetProps,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'tbl1';
const NAME = 'table1';
const SIZE = { widgetHeight: 456, widgetWidth: 880 };

const widget = createWidgetHarness({
  componentType: 'Table',
  handle: NAME,
  id: ID,
  ...SIZE,
  // TableData mounts ExpandedRowContainer -> AppCanvas/Container, which needs the drag-drop context.
  capabilities: { dnd: true },
  defaultProperties: {
    data: binding("{{[{ id: 1, name: 'Ada' }, { id: 2, name: 'Grace' }]}}"),
    columns: binding([
      { id: 'col-id', name: 'id', key: 'id', columnType: 'number' },
      { id: 'col-name', name: 'name', key: 'name', columnType: 'string' },
    ]),
    // Locked schema: keeps the configured columns and avoids an autogenerate save round-trip.
    autogenerateColumns: binding(false),
    showAddNewRowButton: binding('{{true}}'),
    // A new Table defaults to one row at a time; the "+" this spec clicks only exists with multiple rows on.
    allowAddingMultipleRows: binding('{{true}}'),
  },
});

beforeEach(() => widget.setup());
afterEach(() => widget.teardown());

let commits = 0;
const countCommit = () => {
  commits += 1;
};

/** Seeds and mounts the Table, then re-mounts the same widget under a Profiler to count commits. */
function renderTable() {
  commits = 0;
  widget.render();
  widget.session.render(
    <Profiler id="table" onRender={countCommit}>
      <RenderWidget {...widgetProps(ID, 'Table', SIZE)} />
    </Profiler>
  );
}

const addNewRowButton = () => document.querySelector(`[data-cy="${NAME}-add-new-row-button"]`);
/** The rows in the Add new rows form: one chip per row in its row picker. */
const popupRows = () => document.querySelectorAll('[data-cy^="add-new-row-chip-"]');

/** Gives any work still queued by the last interaction a few macrotask turns to finish. */
async function settle(turns = 10) {
  for (let i = 0; i < turns; i += 1) await drain();
}

describe('Table add new rows popup', () => {
  test('adding another row settles instead of re-rendering forever', async () => {
    renderTable();
    const { user } = widget.session;

    await waitFor(() => expect(addNewRowButton()).not.toBeNull());
    await user.click(addNewRowButton());
    await waitFor(() => expect(popupRows()).toHaveLength(1));

    await user.click(screen.getByRole('button', { name: 'Add another row' }));
    await waitFor(() => expect(popupRows()).toHaveLength(2));

    await settle();
    const settledAt = commits;
    await settle();

    expect(commits - settledAt).toBe(0);
    expect(popupRows()).toHaveLength(2);
  });
});
