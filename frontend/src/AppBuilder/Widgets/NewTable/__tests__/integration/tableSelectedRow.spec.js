/**
 * Table row-click -> selectedRow -> onRowClicked handler reads the value.
 *
 * The reported symptom: you click a row, onRowClicked fires, and a Text widget
 * bound to `{{table1.selectedRow.name}}` — or the event's own action — shows the
 * PREVIOUSLY selected row. One interaction behind, every time.
 *
 * The code under test is TableData.jsx handleRowClick (:132-141):
 *
 *     setExposedVariables({ selectedRow: ..., selectedRowId: ... });
 *     fireEvent('onRowClicked');
 *
 * Two lines, and whether they are correct depends entirely on store timing that
 * is invisible at the call site. There are TWO different reads an onRowClicked
 * action can do, and only one of them is protected:
 *
 *   1. Reading the RAW exposed value — `{{components.table1.selectedRow.name}}`
 *      in an action option. `getResolvedValue` reads exposedValues directly, and
 *      `setExposedVariables` commits those synchronously, so this is safe with no
 *      flush involved. (Mutation-checked: removing fireEvent's
 *      flushImplicitBatchEntries call does NOT break it.)
 *   2. A component BOUND to selectedRow updating on canvas. That goes through the
 *      dependency cascade, which IS deferred to a microtask.
 *
 * Worth knowing, because it is counter-intuitive: fireEvent's
 * flushImplicitBatchEntries call (eventsSlice.js:100) is NOT what protects (1).
 * Action options always resolve against raw exposedValues, which are written
 * synchronously. Mutation-checked — deleting that flush breaks nothing in this
 * file. The flush protects readers of the RESOLVED store; that guarantee is
 * covered in _stores/__tests__/integration/eventActions.spec.js, not here.
 *
 * What breaks BOTH is an open explicit bracket: `setExposedValues` then buffers
 * the WRITE ITSELF, and fireEvent's flush does not touch the bracket — so the
 * handler reads the previous row.
 *
 * SCOPE, stated plainly: these tests exercise the STORE path with the Table's
 * real payload shape. They do NOT render the real Table — its render path pulls
 * in the whole editor canvas via ExpandedRowContainer -> AppCanvas/Container,
 * and the RTL seam is still blocked on jest config work. The blind spot that
 * leaves is called out in the last test in this file. Read it before trusting
 * this suite to protect handleRowClick.
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition, binding, drainExposedValueBatch } from '@/test/app-builder';
import { createTableRowEventOptions } from '@/AppBuilder/Widgets/NewTable/_utils/tableEventUtils';

const state = () => useStore.getState();

const ROWS = [
  { id: 1, name: 'Ada' },
  { id: 2, name: 'Grace' },
];

/** A Table plus a Text widget bound to the Table's selectedRow, as a user would wire it. */
function seedTableAndLabel() {
  seedApp({
    t1: componentDefinition('t1', 'table1', 'Table'),
    txt: componentDefinition('txt', 'text1', 'Text', {
      text: binding('{{components.table1.selectedRow.name}}'),
    }),
  });
  state().setEditorLoading(false, 'canvas');
  state().setCurrentMode('edit', 'canvas');
}

/**
 * Attaches an onRowClicked handler that records what the ACTION saw, into a
 * variable. This is the probe: a variable holding a stale row is direct
 * evidence that the event observed pre-write state.
 */
function attachOnRowClickedCapture() {
  state().eventsSlice.setEvents(
    [
      {
        id: 'evt-row-click',
        name: 'onRowClicked',
        index: 0,
        sourceId: 't1',
        target: 'component',
        event: {
          eventId: 'onRowClicked',
          actionId: 'set-custom-variable',
          key: 'seenByHandler',
          value: '{{components.table1.selectedRow.name}}',
        },
      },
    ],
    'canvas'
  );
}

/** Exactly what TableData.jsx handleRowClick does, in the same order. */
function clickRow(index) {
  state().setExposedValues('t1', 'components', {
    selectedRow: ROWS[index],
    selectedRowId: index,
  });
  state().eventsSlice.fireEvent('onRowClicked', 't1', 'canvas', {}, {});
}

describe('row click -> onRowClicked handler', () => {
  // MUST be afterEach, not a line at the end of a test: a failed assertion — and
  // a `test.failing` body throws by design — skips any inline cleanup, leaking an
  // open bracket into the next test. That leak cost me a confusing debug session.
  afterEach(() => {
    drainExposedValueBatch();
    jest.useRealTimers();
  });

  test('the handler sees the row that was JUST clicked, not the previous one', () => {
    seedTableAndLabel();
    attachOnRowClickedCapture();

    clickRow(0);
    expect(state().getVariable('seenByHandler', 'canvas')).toBe('Ada');

    // The second click is where a one-interaction lag would show up: a stale
    // read returns 'Ada' again instead of 'Grace'.
    clickRow(1);
    expect(state().getVariable('seenByHandler', 'canvas')).toBe('Grace');
  });

  test('a Text widget bound to selectedRow catches up within one microtask', async () => {
    seedTableAndLabel();

    clickRow(0);
    await Promise.resolve();

    expect(state().getResolvedComponent('txt').properties.text).toBe('Ada');
  });

  test('the row payload is readable synchronously by the writer itself', () => {
    seedTableAndLabel();

    state().setExposedValues('t1', 'components', { selectedRow: ROWS[1], selectedRowId: 1 });

    // handleRowClick writes both keys in ONE setExposedVariables call. If that
    // were ever split into two calls, the event could fire between them and see
    // a half-updated selection — hence asserting both keys together.
    expect(state().getExposedValueOfComponent('t1').selectedRow).toEqual(ROWS[1]);
    expect(state().getExposedValueOfComponent('t1').selectedRowId).toBe(1);
  });

  test('debounces repeated actions per row without dropping actions from another row', () => {
    jest.useFakeTimers();
    const observedRows = [];

    seedApp({
      t1: componentDefinition('t1', 'table1', 'Table'),
      probe: componentDefinition('probe', 'probe1', 'Button'),
    });
    state().setEditorLoading(false, 'canvas');
    state().setCurrentMode('edit', 'canvas');
    state().setExposedValue('probe', 'recordRow', (rowIndex) => observedRows.push(rowIndex));
    state().eventsSlice.setEvents(
      [
        {
          id: 'evt-row-click',
          name: 'onRowClicked',
          index: 0,
          sourceId: 't1',
          target: 'component',
          event: {
            eventId: 'onRowClicked',
            actionId: 'control-component',
            componentId: 'probe',
            componentSpecificActionHandle: 'recordRow',
            componentSpecificActionParams: [{ handle: 'rowIndex', value: '{{rowIndex}}' }],
            debounce: 100,
          },
        },
      ],
      'canvas'
    );

    const fireRow = (rowIndex) =>
      state().eventsSlice.fireEvent('onRowClicked', 't1', 'canvas', { rowIndex }, createTableRowEventOptions(rowIndex));

    fireRow(0);
    fireRow(0);
    fireRow(1);
    jest.advanceTimersByTime(100);

    expect(observedRows).toEqual([0, 1]);
  });

  test.failing('BUG: inside an open exposed-value bracket the handler reads the PREVIOUS row', () => {
    seedTableAndLabel();
    attachOnRowClickedCapture();

    clickRow(0);
    expect(state().getVariable('seenByHandler', 'canvas')).toBe('Ada');

    // A bracket is open whenever a ListView or Form grows its child count
    // (useExposedValueBatch.js:27), during a page switch (appSlice.js:353), and
    // during app load (useAppData.js:639). A Table inside a ListView row, or a
    // Table on a page that is still settling, is therefore an ordinary
    // configuration — not an exotic one.
    state().startExposedValueBatch();
    clickRow(1);

    // setExposedValues buffered the write instead of committing it
    // (resolvedSlice.js:501-517), and fireEvent's flushImplicitBatchEntries only
    // drains the IMPLICIT microtask queue — never the explicit bracket. So the
    // action resolves {{components.table1.selectedRow.name}} against the row
    // from the previous click.
    //
    // This is the user-reported bug: click Grace, the handler acts on Ada.
    expect(state().getVariable('seenByHandler', 'canvas')).toBe('Grace');
  });

  test('after the bracket flushes, the value is correct — the loss is only in the handler', () => {
    seedTableAndLabel();

    state().startExposedValueBatch();
    clickRow(1);
    state().flushExposedValueBatch();

    // Worth pinning alongside the bug above: the STORE ends up right, so the
    // damage is confined to whatever the event handler did with the stale value
    // — a query run with the wrong row id, a modal opened for the wrong record.
    // Nothing looks broken afterwards, which is why this is hard to report.
    expect(state().getExposedValueOfComponent('t1').selectedRow).toEqual(ROWS[1]);
  });

  test('KNOWN BLIND SPOT: this suite cannot catch a reorder inside TableData.jsx', () => {
    seedTableAndLabel();
    attachOnRowClickedCapture();

    // `clickRow` above MIRRORS handleRowClick (TableData.jsx:132-141) rather than
    // calling it, because rendering the real Table pulls in the editor canvas.
    // So if someone swaps those two lines to fire-then-set, every test in this
    // file still passes while the product breaks for every user.
    //
    // Two ways to close it, in preference order:
    //   1. Export handleRowClick as a pure function taking (row, deps) and call
    //      the real thing here. Small product change, permanent fix.
    //   2. Unblock the RTL seam (esmPackages + a Worker stub in setupFiles) and
    //      render the real Table.
    //
    // Until then this assertion exists to make the gap impossible to miss when
    // reading the file — it documents intent, it does not verify the widget.
    const fireBeforeSet = () => {
      state().eventsSlice.fireEvent('onRowClicked', 't1', 'canvas', {}, {});
      state().setExposedValues('t1', 'components', { selectedRow: ROWS[1], selectedRowId: 1 });
    };
    fireBeforeSet();

    // Demonstrating the failure mode the mirror cannot detect: with the order
    // reversed the handler sees the default, not the clicked row.
    expect(state().getVariable('seenByHandler', 'canvas')).not.toBe('Grace');
  });
});
