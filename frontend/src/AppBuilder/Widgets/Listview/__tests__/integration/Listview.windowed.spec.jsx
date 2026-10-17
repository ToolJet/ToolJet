/**
 * Listview — a long list renders only the rows in view (in slots; see rowSlots.js), and keeps what the user changed.
 *
 * Above a few thousand widgets a ListView renders a window of its rows: every row mounted (millions, for a large query)
 * crashed the tab. Rows the user touched stay mounted, and its children/data stay keyed by data row.
 */
import React from 'react';
import { act, fireEvent, waitFor } from '@testing-library/react';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import useStore from '@/AppBuilder/_stores/store';
import { AppBuilderTestSession, defineAppBuilderScenario, seedApp, componentDefinition } from '@/test/app-builder';
import { binding, drain, widgetProps, MODULE_ID } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const state = () => useStore.getState();

const SCENARIO = defineAppBuilderScenario({
  id: 'listview-windowed-rows',
  name: 'Listview with thousands of rows',
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

const ROW_HEIGHT = 100;
const ROWS = Array.from({ length: 3000 }, (_, i) => ({ name: `row ${i}` }));

let session;

const nest = (def, parent) => {
  def.component.parent = parent;
  def.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
  return def;
};

function renderLongListview(rows, mode = 'view') {
  state().setVariable('rows', rows, MODULE_ID);
  const listview = componentDefinition('lv1', 'listview1', 'Listview', {
    dataSourceSelector: binding('rawJson'),
    data: binding('{{variables.rows}}'),
    mode: binding('list'),
    rowHeight: binding(String(ROW_HEIGHT)),
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
  const rowInput = nest(
    componentDefinition('inp1', 'textinput1', 'TextInput', {
      value: binding('{{listItem.name}}'),
      visibility: binding('{{true}}'),
      disabledState: binding('{{false}}'),
      loadingState: binding('{{false}}'),
    }),
    'lv1'
  );
  seedApp({ lv1: listview, txt1: rowText, inp1: rowInput }, { moduleId: MODULE_ID });
  state().setEditorLoading(false, MODULE_ID);
  state().setCurrentMode(mode, MODULE_ID);
  return session.render(<RenderWidget {...widgetProps('lv1', 'Listview', { currentMode: mode })} />);
}

const listview = () => state().getExposedValueOfComponent('lv1', MODULE_ID);
const rowElements = () =>
  [...document.querySelectorAll('[data-cy*="-row-"]')].filter((e) => e.closest('.listview-scroll-container'));
const renderedRows = () => rowElements().map((e) => Number(e.getAttribute('data-cy').split('-row-').pop()));
const rowElement = (row) => rowElements().find((e) => e.getAttribute('data-cy').endsWith(`-row-${row}`));
const scrollTo = async (top) => {
  const el = document.querySelector('.listview-scroll-container');
  await act(async () => {
    el.scrollTop = top;
    fireEvent.scroll(el);
  });
  await drain();
  await drain();
};

describe('Listview — a long list renders a window of its rows', () => {
  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario: SCENARIO });
  });

  test('renders the rows in view, keeps edited rows, and exposes rows by their index in the data', async () => {
    renderLongListview(ROWS);
    await drain();
    await drain();

    // A window of rows, not 3000.
    await waitFor(() => expect(renderedRows()).toContain(0));
    expect(renderedRows().length).toBeLessThan(40);
    await waitFor(() => expect(listview().children?.[3]?.text1?.text).toBe('row 3'));
    expect(listview().children[3].textinput1.value).toBe('row 3');

    // Edit row 5's input.
    const input = rowElement(5).querySelector('input');
    await act(async () => {
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'edited' } });
    });
    await drain();
    await waitFor(() => expect(listview().children[5].textinput1.value).toBe('edited'));
    expect(listview().data[5].textinput1.value).toBe('edited');

    // Far down: rows there render and are exposed under their own index; the edited row stays mounted.
    await scrollTo(2000 * ROW_HEIGHT);
    await waitFor(() => expect(renderedRows()).toContain(2005));
    expect(renderedRows()).toContain(5);
    expect(renderedRows()).not.toContain(3);
    await waitFor(() => expect(listview().children?.[2005]?.text1?.text).toBe('row 2005'));
    expect(listview().children[2005].textinput1.value).toBe('row 2005');
    // Rows that left keep what they exposed.
    expect(listview().children[3].text1.text).toBe('row 3');
    expect(listview().children[5].textinput1.value).toBe('edited');

    // Back up: the edit is still there, in the input and in children/data.
    await scrollTo(0);
    await waitFor(() => expect(renderedRows()).toContain(3));
    expect(rowElement(5).querySelector('input').value).toBe('edited');
    expect(listview().children[5].textinput1.value).toBe('edited');
    expect(listview().data[5].textinput1.value).toBe('edited');
    expect(listview().children[3].textinput1.value).toBe('row 3');
    expect(rowElement(3).textContent).toContain('row 3');
  });

  // Widgets the canvas engine can select and move carry `.moveable-box`: in the editor, only the first row's.
  const editableRows = () =>
    rowElements()
      .filter((row) => row.querySelector('.moveable-box'))
      .map((row) => Number(row.getAttribute('data-cy').split('-row-').pop()));

  test('in the editor, a short list (every row rendered) has its first row to edit', async () => {
    renderLongListview(ROWS.slice(0, 5), 'edit');
    await drain();
    await waitFor(() => expect(renderedRows()).toEqual([0, 1, 2, 3, 4]));
    await waitFor(() => expect(editableRows()).toEqual([0]));
  });

  test('in the editor, the first row is the one to edit, whichever slot it is in', async () => {
    renderLongListview(ROWS, 'edit');
    await drain();
    await drain();
    await waitFor(() => expect(renderedRows()).toContain(0));
    await waitFor(() => expect(editableRows()).toEqual([0]));

    // Its slot changes hands while scrolling; the first row stays the editable one.
    await scrollTo(2000 * ROW_HEIGHT);
    await waitFor(() => expect(renderedRows()).toContain(2005));
    expect(editableRows()).toEqual([]);
    await scrollTo(0);
    await waitFor(() => expect(renderedRows()).toContain(0));
    await waitFor(() => expect(editableRows()).toEqual([0]));
  });
});
