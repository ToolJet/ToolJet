/**
 * Listview — stale row exposed values after `data` shrinks.
 *
 * Production report: a Listview inside a Form whose rows are added/removed
 * through a variable. When the row count went straight to 0, the Form's
 * `children.listview1.children` kept the deleted rows, and a query that rebuilt
 * the list from it resurrected them.
 *
 * Listview and Form have no widget contract yet (both `not-started` in
 * widget-testing-manifest.json), so these are plain regression tests.
 */
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import useStore from '@/AppBuilder/_stores/store';
import { AppBuilderTestSession, defineAppBuilderScenario, seedApp, componentDefinition } from '@/test/app-builder';
import { binding, drain, widgetProps, MODULE_ID } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const state = () => useStore.getState();

const SCENARIO = defineAppBuilderScenario({
  id: 'listview-in-form-empty-data',
  name: 'Listview inside a Form whose data shrinks',
  primarySeam: 'rtl',
  surface: 'app-editor',
  edition: 'ce',
  environment: 'development',
  layout: 'desktop',
  version: 'draft',
  transferPath: 'not-applicable',
  access: 'authenticated',
  // dnd: Form and Listview rows render through AppCanvas/Container.
  capabilities: { observers: true, media: { matches: false }, dnd: true },
});

let session;

/** Container only mounts children shown on the current layout. */
const nest = (def, parent) => {
  def.component.parent = parent;
  def.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
  return def;
};

function renderFormWithListview(rows) {
  state().setVariable('rows', rows, MODULE_ID);

  const form = componentDefinition('form1', 'form1', 'Form', {
    advanced: binding('{{false}}'),
    visibility: binding('{{true}}'),
    loadingState: binding('{{false}}'),
    disabledState: binding('{{false}}'),
  });
  const listview = componentDefinition('lv1', 'listview1', 'Listview', {
    dataSourceSelector: binding('rawJson'),
    data: binding('{{variables.rows}}'),
    mode: binding('list'),
    rowHeight: binding('100'),
    visibility: binding('{{true}}'),
    loadingState: binding('{{false}}'),
    disabledState: binding('{{false}}'),
    enablePagination: binding('{{false}}'),
  });
  nest(listview, 'form1');
  const rowText = componentDefinition('txt1', 'text1', 'Text', {
    text: binding('{{listItem.name}}'),
    visibility: binding('{{true}}'),
  });
  nest(rowText, 'lv1');

  seedApp({ form1: form, lv1: listview, txt1: rowText }, { moduleId: MODULE_ID });
  state().setEditorLoading(false, MODULE_ID);
  state().setCurrentMode('view', MODULE_ID);
  return session.render(<RenderWidget {...widgetProps('form1', 'Form', { currentMode: 'view' })} />);
}

async function setRows(rows) {
  await session.store.act(async () => {
    state().setVariable('rows', rows, MODULE_ID);
  });
  await drain();
  await drain();
}

/** What a query reads as `components.form1.children.listview1`. */
const listviewSeenByForm = () => state().getExposedValueOfComponent('lv1', MODULE_ID);
const rowKeys = (exposed) => Object.keys(exposed?.children ?? {});

describe('Listview inside a Form — rows removed from data', () => {
  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario: SCENARIO });
  });

  test('emptying data clears the rows the Form exposes for the Listview', async () => {
    // Break this catches: Listview.jsx only resizes its per-row exposed values
    // when the new row count is > 0, so an empty list kept the old rows.
    renderFormWithListview([{ name: 'first' }]);
    await drain();
    await drain();
    expect(rowKeys(listviewSeenByForm())).toEqual(['0']);
    expect(listviewSeenByForm().children[0].text1.text).toBe('first');

    await setRows([]);

    expect(rowKeys(listviewSeenByForm())).toEqual([]);
    expect(Object.keys(listviewSeenByForm().data ?? {})).toEqual([]);
  });

  test('shrinking data to a non-empty list prunes only the removed rows', async () => {
    renderFormWithListview([{ name: 'first' }, { name: 'second' }]);
    await drain();
    await drain();
    expect(rowKeys(listviewSeenByForm())).toEqual(['0', '1']);

    await setRows([{ name: 'first' }]);

    expect(rowKeys(listviewSeenByForm())).toEqual(['0']);
    expect(listviewSeenByForm().children[0].text1.text).toBe('first');
  });
});

/** A ListView on the canvas with a Text per row, plus a canvas Text bound to its children. */
function renderListviewWithBoundText(rows) {
  state().setVariable('rows', rows, MODULE_ID);

  const listview = componentDefinition('lv1', 'listview1', 'Listview', {
    dataSourceSelector: binding('rawJson'),
    data: binding('{{variables.rows}}'),
    mode: binding('list'),
    rowHeight: binding('100'),
    visibility: binding('{{true}}'),
    loadingState: binding('{{false}}'),
    disabledState: binding('{{false}}'),
    enablePagination: binding('{{false}}'),
  });
  const rowText = nest(
    componentDefinition('txt1', 'text1', 'Text', {
      text: binding('{{listItem.name}}'),
      visibility: binding('{{true}}'),
    }),
    'lv1'
  );
  // Binds only to the ListView's exposed rows, so nothing else can make it re-resolve.
  const boundText = componentDefinition('ext1', 'boundText', 'Text', {
    text: binding("{{'keys=' + Object.keys(components.listview1.children || {}).join(',')}}"),
    visibility: binding('{{true}}'),
  });

  seedApp({ lv1: listview, txt1: rowText, ext1: boundText }, { moduleId: MODULE_ID });
  state().setEditorLoading(false, MODULE_ID);
  state().setCurrentMode('view', MODULE_ID);
  return session.render(
    <>
      <RenderWidget {...widgetProps('lv1', 'Listview', { currentMode: 'view' })} />
      <RenderWidget {...widgetProps('ext1', 'Text', { currentMode: 'view' })} />
    </>
  );
}

const boundTextContent = () => screen.getByText(/^keys=/).textContent;

describe('Listview — components bound to its children', () => {
  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario: SCENARIO });
  });

  test('a component bound to children refreshes when the list is emptied', async () => {
    // Break this catches: pruning removed rows from the store without notifying
    // the dependency graph, so a binding kept showing the deleted rows.
    renderListviewWithBoundText([{ name: 'first' }, { name: 'second' }]);
    await waitFor(() => expect(boundTextContent()).toBe('keys=0,1'));

    await setRows([]);

    await waitFor(() => expect(boundTextContent()).toBe('keys='));
  });

  test('a component bound to children refreshes when the list shrinks', async () => {
    renderListviewWithBoundText([{ name: 'A' }, { name: 'B' }, { name: 'C' }]);
    await waitFor(() => expect(boundTextContent()).toBe('keys=0,1,2'));

    await setRows([{ name: 'A' }]);

    await waitFor(() => expect(boundTextContent()).toBe('keys=0'));
  });
});

/** An outer ListView whose rows each hold an inner ListView bound to `listItem.items`. */
function renderNestedListviews(rows) {
  state().setVariable('rows', rows, MODULE_ID);

  const listProps = (data) => ({
    dataSourceSelector: binding('rawJson'),
    data: binding(data),
    mode: binding('list'),
    rowHeight: binding('100'),
    visibility: binding('{{true}}'),
    loadingState: binding('{{false}}'),
    disabledState: binding('{{false}}'),
    enablePagination: binding('{{false}}'),
  });
  const outer = componentDefinition('outer1', 'outerList', 'Listview', listProps('{{variables.rows}}'));
  const inner = nest(componentDefinition('inner1', 'innerList', 'Listview', listProps('{{listItem.items}}')), 'outer1');
  const innerText = nest(
    componentDefinition('itxt1', 'innerText', 'Text', {
      text: binding('{{listItem.label}}'),
      visibility: binding('{{true}}'),
    }),
    'inner1'
  );

  seedApp({ outer1: outer, inner1: inner, itxt1: innerText }, { moduleId: MODULE_ID });
  state().setEditorLoading(false, MODULE_ID);
  state().setCurrentMode('view', MODULE_ID);
  return session.render(<RenderWidget {...widgetProps('outer1', 'Listview', { currentMode: 'view' })} />);
}

/** Inner row keys per outer row, as `components.outerList.children` exposes them. */
const innerRowKeys = () => {
  const outerRows = state().getExposedValueOfComponent('outer1', MODULE_ID)?.children ?? {};
  return Object.fromEntries(
    Object.entries(outerRows).map(([index, row]) => [index, Object.keys(row?.innerList?.children ?? {})])
  );
};

describe('Listview — nested inner list rows removed', () => {
  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario: SCENARIO });
  });

  test("emptying one outer row's inner list clears only that row's inner rows", async () => {
    // Break this catches: the stale-row cleanup only handled a top-level
    // ListView, so a nested list's removed rows were never pruned.
    renderNestedListviews([{ items: [{ label: 'A1' }, { label: 'A2' }] }, { items: [{ label: 'B1' }] }]);
    await waitFor(() => expect(innerRowKeys()).toEqual({ 0: ['0', '1'], 1: ['0'] }));

    await setRows([{ items: [] }, { items: [{ label: 'B1' }] }]);

    await waitFor(() => expect(innerRowKeys()).toEqual({ 0: [], 1: ['0'] }));
    expect(
      state().getExposedValueOfComponent('outer1', MODULE_ID).children[1].innerList.children[0].innerText.text
    ).toBe('B1');
  });
});
