/**
 * Rows on demand (../../rows.js): a long ListView draws a window of its rows, yet every row reads and acts as if drawn.
 * A row that was never drawn reads what it would expose; a state action on it is kept and shown once it is drawn; a
 * live action draws it first; and the functions in children/data of a row that scrolled away still work.
 */
import React from 'react';
import { act, fireEvent, waitFor } from '@testing-library/react';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import useStore from '@/AppBuilder/_stores/store';
import { getComponentToRender } from '@/AppBuilder/_helpers/editorHelpers';
import { textExposure } from '@/AppBuilder/_engines/materialize/widgets/Text';
import { forgetListviewRows, handleOf } from '@/AppBuilder/_engines/materialize/rows';
import { AppBuilderTestSession, defineAppBuilderScenario, seedApp, componentDefinition } from '@/test/app-builder';
import {
  binding,
  drain,
  widgetProps,
  preloadLazyComponent,
  setVariableOn,
  MODULE_ID,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

// Integration specs that draw real rows: a CI runner takes several times as long as a laptop.
jest.setTimeout(60000);

const state = () => useStore.getState();

const SCENARIO = defineAppBuilderScenario({
  id: 'listview-rows-on-demand',
  name: 'Listview rows read and run without being drawn',
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
const ROWS = Array.from({ length: 3000 }, (_, i) => ({
  name: `row ${i}`,
  url: `https://example.com/${i}.png`,
  odd: i % 2 === 1,
}));
const CHILDREN = ['text1', 'textinput1', 'button1', 'image1'];

let session;

const nest = (def, parent = 'lv1') => {
  def.component.parent = parent;
  def.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
  return def;
};

/**
 * `reads`: children that read a component of their row — textinput1's validation reads its own value, image1's
 * alternative text reads text1's text. `icon`: also an Icon (a widget with no exposure module). `inner`: also a
 * ListView in every row. The ListView shows its loading state while `variables.loading` is true. `hidableImage`: image1
 * is hidden on desktop while `variables.hideImg` is true.
 */
function renderListview(rows, { reads = false, icon = false, inner = false, hidableImage = false } = {}) {
  state().setVariable('rows', rows, MODULE_ID);
  const listview = componentDefinition('lv1', 'listview1', 'Listview', {
    dataSourceSelector: binding('rawJson'),
    data: binding('{{variables.rows}}'),
    mode: binding('list'),
    rowHeight: binding(String(ROW_HEIGHT)),
    visibility: binding('{{true}}'),
    loadingState: binding('{{variables.loading === true}}'),
    disabledState: binding('{{false}}'),
    enablePagination: binding('{{false}}'),
  });
  const text = nest(
    componentDefinition('txt1', 'text1', 'Text', {
      text: binding('{{listItem.name}}'),
      textFormat: binding('plainText'),
      visibility: binding('{{true}}'),
      loadingState: binding('{{false}}'),
      disabledState: binding('{{listItem.odd}}'),
    })
  );
  const input = nest(
    componentDefinition('inp1', 'textinput1', 'TextInput', {
      label: binding('{{listItem.name}}'),
      value: binding('{{listItem.name}}'),
      visibility: binding('{{true}}'),
      disabledState: binding('{{listItem.odd}}'),
      loadingState: binding('{{false}}'),
    })
  );
  if (reads) {
    input.component.definition.validation = {
      regex: binding('^row'),
      customRule: binding("{{components.textinput1.value === listItem.name ? '' : 'bad'}}"),
    };
  }
  const button = nest(
    componentDefinition('btn1', 'button1', 'Button', {
      text: binding('{{listItem.name}}'),
      visibility: binding('{{!listItem.odd}}'),
      loadingState: binding('{{false}}'),
      disabledState: binding('{{false}}'),
    })
  );
  button.component.definition.styles = { type: binding('primary') };
  const image = nest(
    componentDefinition('img1', 'image1', 'Image', {
      imageFormat: binding('imageUrl'),
      source: binding('{{listItem.url}}'),
      alternativeText: binding(reads ? '{{components.text1.text}}' : '{{listItem.name}}'),
      visibility: binding('{{true}}'),
      loadingState: binding('{{false}}'),
      disabledState: binding('{{false}}'),
    })
  );
  image.component.definition.styles = { padding: binding('default') };
  if (hidableImage) image.component.definition.others.showOnDesktop = binding('{{variables.hideImg !== true}}');
  // Outside the list, bound to a row of its data: it sees what an action did to that row.
  const watcher = componentDefinition('out1', 'outside1', 'Text', {
    text: binding('{{components.listview1.data[2005]?.text1?.text}}'),
  });
  const extra = {};
  if (icon) {
    extra.ico1 = nest(
      componentDefinition('ico1', 'icon1', 'Icon', {
        icon: binding('IconHome2'),
        visibility: binding('{{true}}'),
        loadingState: binding('{{false}}'),
        disabledState: binding('{{false}}'),
      })
    );
  }
  if (inner) {
    extra.lv2 = nest(
      componentDefinition('lv2', 'listview2', 'Listview', {
        dataSourceSelector: binding('rawJson'),
        data: binding('{{[1, 2]}}'),
        mode: binding('list'),
        rowHeight: binding('20'),
        visibility: binding('{{true}}'),
        loadingState: binding('{{false}}'),
        disabledState: binding('{{false}}'),
        enablePagination: binding('{{false}}'),
      })
    );
  }
  seedApp(
    { lv1: listview, txt1: text, inp1: input, btn1: button, img1: image, out1: watcher, ...extra },
    { moduleId: MODULE_ID }
  );
  // The row's own listItem: a click run on any other row's widget would set another name.
  state().eventsSlice.setEvents(
    setVariableOn('btn1', 'onClick', { key: 'clicked', value: '{{listItem.name}}' }),
    MODULE_ID
  );
  state().setEditorLoading(false, MODULE_ID);
  state().setCurrentMode('view', MODULE_ID);
  return session.render(<RenderWidget {...widgetProps('lv1', 'Listview', { currentMode: 'view' })} />);
}

const listview = () => state().getExposedValueOfComponent('lv1', MODULE_ID);
const slots = () => state().resolvedStore.modules[MODULE_ID].listviewSlots?.lv1;
const rowChanges = () => state().resolvedStore.modules[MODULE_ID].listviewRowChanges?.lv1;
const variables = () => state().resolvedStore.modules[MODULE_ID].exposedValues.variables;
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
/** Exposed values without functions. */
const values = (exposed) =>
  Object.fromEntries(Object.entries(exposed ?? {}).filter(([, value]) => typeof value !== 'function'));
const functionsOf = (exposed) => Object.keys(exposed ?? {}).filter((key) => typeof exposed[key] === 'function');
/** Waits until every child of `row` has mounted and exposed its actions. */
const drawn = (row) =>
  waitFor(() => {
    const children = listview().children?.[row];
    expect(children?.text1?.setText).toBeInstanceOf(Function);
    expect(children?.textinput1?.setFocus).toBeInstanceOf(Function);
    expect(children?.button1?.click).toBeInstanceOf(Function);
    expect(children?.image1?.setImageURL).toBeInstanceOf(Function);
  });
const mounted = async () => {
  await drain();
  await drain();
  await waitFor(() => expect(renderedRows()).toContain(0));
  await drawn(3);
};

beforeAll(() =>
  Promise.all(
    ['Listview', 'Text', 'TextInput', 'Button', 'Image', 'Icon'].map((type) =>
      preloadLazyComponent(getComponentToRender(type))
    )
  )
);

/** Settles to 'resolved', or the name of the error it rejected with. */
const outcome = (promise) =>
  promise.then(
    () => 'resolved',
    (error) => error.name
  );

describe('Listview rows on demand — a long list', () => {
  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario: SCENARIO });
  });
  afterEach(() => jest.restoreAllMocks());

  test('a row never drawn reads what it exposes once drawn', async () => {
    renderListview(ROWS);
    await mounted();

    const rows = [2005, 2006];
    const read = rows.map((row) => state().readListviewRow('lv1', row, MODULE_ID));
    rows.forEach((row) => expect(listview().children[row]).toBeUndefined());
    expect(Object.keys(read[0])).toEqual(CHILDREN);
    expect(read[0].text1.text).toBe('row 2005');
    expect(read[0].button1.isVisible).toBe(false);
    expect(read[1].button1.isVisible).toBe(true);
    // Reading a row keeps nothing for it: each read has wrappers of its own.
    expect(state().readListviewRow('lv1', 2005, MODULE_ID).text1.setText).not.toBe(read[0].text1.setText);

    await scrollTo(2000 * ROW_HEIGHT);
    await waitFor(() => expect(renderedRows()).toEqual(expect.arrayContaining(rows)));
    await Promise.all(rows.map(drawn));
    await drain();

    rows.forEach((row, i) => {
      CHILDREN.forEach((name) => {
        const shown = listview().children[row][name];
        expect(values(read[i][name])).toEqual(values(shown));
        // Every action it reads is one the drawn widget has.
        expect(functionsOf(shown)).toEqual(expect.arrayContaining(functionsOf(read[i][name])));
      });
      // A row in children reads with the wrappers children has.
      expect(state().readListviewRow('lv1', row, MODULE_ID).text1.setText).toBe(listview().children[row].text1.setText);
    });
  });

  test('a child reading itself or a sibling reads what the drawn row settles to', async () => {
    renderListview(ROWS, { reads: true });
    await mounted();

    const read = state().readListviewRow('lv1', 2006, MODULE_ID);
    expect(read.textinput1.isValid).toBe(true);
    expect(read.image1.alternativeText).toBe('row 2006');
    // validate() runs the widget's rules in the row's scope.
    const { validate } = state().resolveRowChildInput('lv1', 2006, 'inp1', MODULE_ID);
    expect(validate('row x').isValid).toBe(true);
    expect(validate('xyz')).toEqual({ isValid: false, validationError: 'The input should match pattern' });
    expect(listview().children[2006]).toBeUndefined();

    await scrollTo(2000 * ROW_HEIGHT);
    await waitFor(() => expect(renderedRows()).toContain(2006));
    await drawn(2006);
    await waitFor(() => expect(listview().children[2006].image1.alternativeText).toBe('row 2006'));
    await waitFor(() => expect(listview().children[2006].textinput1.isValid).toBe(true));
    CHILDREN.forEach((name) => expect(values(read[name])).toEqual(values(listview().children[2006][name])));
  });

  test('a state action on a row not drawn changes its children/data, and the row shows it once drawn', async () => {
    renderListview(ROWS);
    await mounted();

    await act(async () => {
      await state().runRowAction('lv1', 2005, 'txt1', 'setText', ['changed'], MODULE_ID);
      await state().readListviewRow('lv1', 2004, MODULE_ID).button1.setVisibility(false);
    });
    await drain();

    expect(listview().children[2005].text1.text).toBe('changed');
    expect(listview().data[2005].text1.text).toBe('changed');
    expect(listview().children[2005].text1.setText).toBeInstanceOf(Function);
    expect(functionsOf(listview().data[2005].text1)).toEqual([]);
    expect(listview().children[2004].button1.isVisible).toBe(false);
    expect(listview().data[2004].button1.isVisible).toBe(false);
    // Its other children are what the row exposes.
    expect(listview().data[2005].textinput1.value).toBe('row 2005');
    // Dependents of data saw it.
    expect(state().getResolvedComponent('out1', null, MODULE_ID).properties.text).toBe('changed');

    // Every call the widgets' setText makes from here is a replay.
    const setText = jest.spyOn(textExposure.actions, 'setText');
    await scrollTo(2000 * ROW_HEIGHT);
    await waitFor(() => expect(renderedRows()).toEqual(expect.arrayContaining([2004, 2005, 2006])));
    await Promise.all([2004, 2005].map(drawn));
    await waitFor(() => expect(rowElement(2005).textContent).toContain('changed'));
    await waitFor(() => expect(rowElement(2004).querySelector('button').style.display).toBe('none'));
    expect(rowElement(2006).querySelector('button').style.display).toBe('');
    await drain();
    expect(listview().children[2005].text1.text).toBe('changed');
    expect(listview().data[2005].text1.text).toBe('changed');
    expect(listview().children[2004].button1.isVisible).toBe(false);
    expect(state().readListviewRow('lv1', 2004, MODULE_ID).button1.isVisible).toBe(false);

    // Another derive of the row (a sibling's action) doesn't replay it again.
    await act(async () => {
      await listview().children[2005].image1.setVisibility(false);
    });
    await drain();
    expect(setText).toHaveBeenCalledTimes(1);
    expect(rowChanges()[2005].txt1.replay).toEqual([{ action: 'setText', args: ['changed'] }]);
  });

  test('a replay that fails is not run again', async () => {
    renderListview(ROWS);
    await mounted();
    await act(async () => {
      await state().runRowAction('lv1', 2005, 'txt1', 'setText', ['changed'], MODULE_ID);
    });

    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    const setText = jest.spyOn(textExposure.actions, 'setText').mockImplementation(() => {
      throw new Error('broken');
    });
    await scrollTo(2000 * ROW_HEIGHT);
    await waitFor(() => expect(renderedRows()).toContain(2005));
    await drawn(2005);
    await act(async () => {
      await state().ensureRowMounted('lv1', 2005, MODULE_ID);
    });
    await act(async () => {
      await listview().children[2005].image1.setVisibility(false);
    });
    await drain();
    expect(setText).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith('Restoring setText on row 2005 failed', expect.any(Error));
  });

  test('a live action on a row not drawn draws it, runs on its widget, then lets it go', async () => {
    renderListview(ROWS);
    await mounted();
    expect(renderedRows()).not.toContain(2500);
    expect(variables().clicked).toBeUndefined();

    // Not awaited inside act(): act holds back the render that draws the row until its callback is done.
    const done = state().runRowAction('lv1', 2500, 'btn1', 'click', [], MODULE_ID);
    await waitFor(() => expect(renderedRows()).toContain(2500));
    await act(() => done);
    await drain();

    // Its onClick ran in row 2500.
    await waitFor(() => expect(variables().clicked).toBe('row 2500'));
    // A drawn row's click too: in its own row.
    await act(async () => {
      await listview().children[4].button1.click();
    });
    await waitFor(() => expect(variables().clicked).toBe('row 4'));
    await waitFor(() => expect(renderedRows()).not.toContain(2500));
    expect(renderedRows()).toContain(0);
  });

  test('live actions on many rows not drawn all run, drawing a few rows at a time', async () => {
    renderListview(ROWS);
    await mounted();
    const base = slots().length;
    let most = base;
    const unsubscribe = useStore.subscribe(() => {
      most = Math.max(most, slots()?.length ?? 0);
    });

    const rows = Array.from({ length: 60 }, (_, i) => 1000 + i * 10);
    let settled = 0;
    const outcomes = rows.map((row) =>
      outcome(state().runRowAction('lv1', row, 'btn1', 'click', [], MODULE_ID)).finally(() => settled++)
    );
    await waitFor(() => expect(settled).toBe(rows.length), { timeout: 10000 });
    unsubscribe();
    expect(await Promise.all(outcomes)).toEqual(rows.map(() => 'resolved'));
    // In turn: the last one ran last, in its own row.
    expect(variables().clicked).toBe('row 1590');
    // At most MAX_HELD_ROWS (10) rows beyond the window, and the children's per-row arrays with them.
    expect(most).toBeLessThanOrEqual(base + 10);
    expect(state().resolvedStore.modules[MODULE_ID].exposedValues.components.txt1.length).toBeLessThanOrEqual(
      base + 10
    );
    await waitFor(() => expect(renderedRows()).not.toContain(1590));
  });

  test('actions that keep their rows drawn keep the latest ones, up to a limit', async () => {
    renderListview(ROWS);
    await mounted();
    const base = slots().length;

    const rows = Array.from({ length: 60 }, (_, i) => 1000 + i * 10);
    let settled = 0;
    const outcomes = rows.map((row) =>
      outcome(state().runRowAction('lv1', row, 'inp1', 'setText', [`typed ${row}`], MODULE_ID)).finally(() => settled++)
    );
    await waitFor(() => expect(settled).toBe(rows.length), { timeout: 10000 });
    expect(await Promise.all(outcomes)).toEqual(rows.map(() => 'resolved'));
    await scrollTo(2900 * ROW_HEIGHT);
    await waitFor(() => expect(renderedRows()).not.toContain(rows[0]));

    // MAX_KEPT_ROWS (50): the 10 set first let go, and show their props again. The others are the window's.
    expect(
      renderedRows()
        .filter((row) => rows.includes(row))
        .sort((a, b) => a - b)
    ).toEqual(rows.slice(10));
    expect(renderedRows().filter((row) => row >= 2800).length).toBeLessThanOrEqual(base + 5);
    expect(listview().children[rows[59]].textinput1.value).toBe(`typed ${rows[59]}`);
    expect(rowElement(rows[59]).querySelector('input').value).toBe(`typed ${rows[59]}`);
    expect(state().readListviewRow('lv1', rows[0], MODULE_ID).textinput1.value).toBe(`row ${rows[0]}`);
  });

  test('a live action waiting on a row the list no longer has, or on a ListView that unmounts, rejects', async () => {
    const { unmount } = renderListview(ROWS);
    await mounted();

    const gone = outcome(state().ensureRowMounted('lv1', 2900, MODULE_ID));
    await act(async () => {
      state().setVariable('rows', ROWS.slice(0, 2500), MODULE_ID);
    });
    await drain();
    expect(await gone).toBe('RangeError');

    const click = outcome(state().runRowAction('lv1', 2400, 'btn1', 'click', [], MODULE_ID));
    act(() => unmount());
    expect(await click).toBe('Error');
    expect(variables().clicked).toBeUndefined();
    await expect(state().runRowAction('lv1', 2400, 'btn1', 'click', [], MODULE_ID)).rejects.toThrow('not mounted');
  });

  test('a TextInput setText keeps its row drawn, whether or not it was', async () => {
    renderListview(ROWS);
    await mounted();

    const typed = state().runRowAction('lv1', 2700, 'inp1', 'setText', ['far'], MODULE_ID);
    await waitFor(() => expect(renderedRows()).toContain(2700));
    await act(() => typed);
    await act(async () => {
      await listview().children[3].textinput1.setText('near');
    });
    await scrollTo(1000 * ROW_HEIGHT);
    await waitFor(() => expect(renderedRows()).not.toContain(10));
    expect(renderedRows()).toEqual(expect.arrayContaining([3, 2700]));
    await waitFor(() => expect(listview().children[3].textinput1.value).toBe('near'));
    expect(listview().children[2700].textinput1.value).toBe('far');
    expect(rowElement(3).querySelector('input').value).toBe('near');
  });

  test('the functions of a row that scrolled away still run on that row', async () => {
    renderListview(ROWS);
    await mounted();

    // Drawn: its wrapper runs the widget's own action (and keeps the change).
    const before = listview().children[3].text1.setText;
    await act(async () => {
      await listview().children[3].text1.setText('while drawn');
    });
    await waitFor(() => expect(rowElement(3).textContent).toContain('while drawn'));
    // The same wrapper after the row was derived again.
    expect(listview().children[3].text1.setText).toBe(before);

    const setText = listview().children[4].text1.setText;
    const setVisibility = listview().children[3].button1.setVisibility;
    const click = listview().children[4].button1.click;
    await scrollTo(2000 * ROW_HEIGHT);
    await waitFor(() => expect(renderedRows()).not.toContain(4));

    // A live action draws the row again and runs on its widget, in its row.
    const clicked = click();
    await waitFor(() => expect(renderedRows()).toContain(4));
    await act(() => clicked);
    await waitFor(() => expect(variables().clicked).toBe('row 4'));
    await waitFor(() => expect(renderedRows()).not.toContain(4));

    await act(async () => {
      await setText('after it left');
      await setVisibility(false);
    });
    await drain();
    expect(listview().children[4].text1.text).toBe('after it left');
    expect(listview().data[4].text1.text).toBe('after it left');
    expect(listview().data[3].button1.isVisible).toBe(false);
    expect(listview().data[3].text1.text).toBe('while drawn');

    await scrollTo(0);
    await waitFor(() => expect(renderedRows()).toContain(4));
    await waitFor(() => expect(rowElement(4).textContent).toContain('after it left'));
    await waitFor(() => expect(rowElement(3).textContent).toContain('while drawn'));
    await waitFor(() => expect(listview().children[3].button1.isVisible).toBe(false));
    expect(listview().children[3].text1.text).toBe('while drawn');
  });

  test('a change no longer counts once the prop it overrode changes, drawn or not', async () => {
    renderListview(ROWS);
    await mounted();
    await act(async () => {
      await listview().children[3].text1.setText('drawn change');
      await state().runRowAction('lv1', 2005, 'txt1', 'setText', ['changed'], MODULE_ID);
      await state().runRowAction('lv1', 2005, 'btn1', 'setVisibility', [true], MODULE_ID);
    });

    const renamed = ROWS.map((row, i) => ({ ...row, name: `new row ${i}` }));
    await act(async () => {
      state().setVariable('rows', renamed, MODULE_ID);
    });
    await drain();
    // The drawn widget reset its text to the new prop.
    await waitFor(() => expect(rowElement(3).textContent).toContain('new row 3'));
    expect(rowElement(3).textContent).not.toContain('drawn change');
    const read = state().readListviewRow('lv1', 2005, MODULE_ID);
    expect(read.text1.text).toBe('new row 2005');
    // A change to a prop that didn't change still counts.
    expect(read.button1.isVisible).toBe(true);

    await scrollTo(2000 * ROW_HEIGHT);
    await waitFor(() => expect(renderedRows()).not.toContain(3));
    expect(state().readListviewRow('lv1', 3, MODULE_ID).text1.text).toBe('new row 3');
    await waitFor(() => expect(renderedRows()).toContain(2005));
    await drawn(2005);
    await drain();
    expect(rowElement(2005).textContent).toContain('new row 2005');
    expect(rowElement(2005).textContent).not.toContain('changed');
    expect(listview().children[2005].button1.isVisible).toBe(true);
    // What no longer counts is gone from the store too, once the row is drawn.
    await waitFor(() => expect(rowChanges()[2005].txt1).toBeUndefined());
    expect(rowChanges()[2005].btn1.replay).toEqual([{ action: 'setVisibility', args: [true] }]);

    await scrollTo(0);
    await waitFor(() => expect(renderedRows()).toContain(3));
    await drawn(3);
    await drain();
    expect(rowElement(3).textContent).not.toContain('drawn change');
    expect(rowChanges()[3]).toBeUndefined();
  });

  test('state actions on many undrawn rows are written together, with plain args', async () => {
    renderListview(ROWS);
    await mounted();

    const rows = Array.from({ length: 200 }, (_, i) => 1000 + i);
    let writes = 0;
    const unsubscribe = useStore.subscribe(() => writes++);
    // The rows' scope (the ListView's descendants) is built once for the batch, not once per row.
    const { prepareRowScope } = state();
    let scopes = 0;
    useStore.setState({ prepareRowScope: (...args) => (scopes++, prepareRowScope(...args)) });
    try {
      await act(async () => {
        await Promise.all(
          rows.map((row) => state().runRowAction('lv1', row, 'btn1', 'setVisibility', [false], MODULE_ID))
        );
      });
    } finally {
      useStore.setState({ prepareRowScope });
    }
    unsubscribe();
    expect(writes).toBeLessThan(20);
    expect(scopes).toBeLessThan(5);
    rows.forEach((row) => expect(listview().data[row].button1.isVisible).toBe(false));

    class Point {}
    await act(async () => {
      await state().runRowAction('lv1', 2005, 'txt1', 'setText', [{ a: 1, f: () => {}, p: new Point() }], MODULE_ID);
      await state().runRowAction('lv1', 2006, 'txt1', 'setText', [new Date(0)], MODULE_ID);
    });
    expect(rowChanges()[2005].txt1.replay).toEqual([{ action: 'setText', args: [{ a: 1 }] }]);
    // What the row reads is what replaying its args shows.
    expect(listview().children[2005].text1.text).toEqual({ a: 1 });
    expect(rowChanges()[2006].txt1.replay).toEqual([{ action: 'setText', args: [new Date(0)] }]);
    expect(state().readListviewRow('lv1', 2006, MODULE_ID).text1.text).toEqual(new Date(0));

    await scrollTo(2000 * ROW_HEIGHT);
    await waitFor(() => expect(renderedRows()).toEqual(expect.arrayContaining([2005, 2006])));
    await waitFor(() => expect(listview().children[2006].text1.text).toEqual(new Date(0)));
    expect(listview().children[2005].text1.text).toEqual({ a: 1 });
  });

  test('a list that starts windowing runs the functions of rows it no longer draws on those rows', async () => {
    renderListview(ROWS.slice(0, 40));
    await drain();
    await drawn(30);
    const own = listview().children[30].text1.setText;

    await act(async () => {
      state().setVariable('rows', ROWS, MODULE_ID);
    });
    await drain();
    await drawn(3);
    expect(renderedRows()).not.toContain(30);
    const { setText } = listview().children[30].text1;
    expect(setText).not.toBe(own);
    await act(async () => {
      await setText('probe');
    });
    await drain();
    expect(listview().children[30].text1.text).toBe('probe');
    expect(listview().data[30].text1.text).toBe('probe');

    await scrollTo(30 * ROW_HEIGHT);
    await waitFor(() => expect(renderedRows()).toContain(30));
    await waitFor(() => expect(rowElement(30).textContent).toContain('probe'));
  });

  test("a drawn row's state action keeps its change whoever runs it (an event's control-component action)", async () => {
    renderListview(ROWS);
    await mounted();
    state().eventsSlice.setEvents(
      [
        {
          id: 'evt-control',
          index: 0,
          sourceId: 'btn1',
          name: 'evt-control',
          target: 'component',
          event: {
            eventId: 'onClick',
            actionId: 'control-component',
            componentId: 'txt1',
            componentSpecificActionHandle: 'setText',
            componentSpecificActionParams: [{ handle: 'text', value: 'B' }],
          },
        },
      ],
      MODULE_ID
    );

    await act(async () => {
      await listview().children[3].text1.setText('A');
    });
    await act(async () => {
      fireEvent.click(rowElement(3).querySelector('button'));
    });
    await drain();
    await waitFor(() => expect(rowElement(3).textContent).toContain('B'));
    expect(rowChanges()[3].txt1.replay).toEqual([{ action: 'setText', args: ['B'] }]);

    await scrollTo(2000 * ROW_HEIGHT);
    await waitFor(() => expect(renderedRows()).not.toContain(3));
    expect(listview().children[3].text1.text).toBe('B');
    expect(state().readListviewRow('lv1', 3, MODULE_ID).text1.text).toBe('B');

    await scrollTo(0);
    await waitFor(() => expect(renderedRows()).toContain(3));
    await drawn(3);
    await drain();
    expect(rowElement(3).textContent).toContain('B');
    expect(listview().children[3].text1.text).toBe('B');
  });

  test('a child with no exposure module reads what it last exposed, and its actions draw and pin its row', async () => {
    renderListview(ROWS, { icon: true });
    await mounted();

    // Never drawn: nothing to read for it. (Not row 2005: outside1's binding reads it, which draws it.)
    expect(state().readListviewRow('lv1', 2007, MODULE_ID).icon1).toBeUndefined();
    expect(state().uncomputedRowChildren('lv1', 2007, MODULE_ID)).toEqual(['ico1']);
    expect(state().uncomputedRowChildren('lv1', 3, MODULE_ID)).toEqual([]);

    const slot = state().resolvedStore.modules[MODULE_ID].listviewSlots.lv1.indexOf(3);
    const own = state().resolvedStore.modules[MODULE_ID].exposedValues.components.ico1[slot].setVisibility;
    await scrollTo(2000 * ROW_HEIGHT);
    await waitFor(() => expect(renderedRows()).not.toContain(3));
    expect(state().uncomputedRowChildren('lv1', 3, MODULE_ID)).toEqual(['ico1']);
    const read = state().readListviewRow('lv1', 3, MODULE_ID);
    expect(read.icon1.isVisible).toBe(true);
    expect(read.icon1.setVisibility).not.toBe(own);

    const hidden = read.icon1.setVisibility(false);
    await waitFor(() => expect(renderedRows()).toContain(3));
    await act(() => hidden);
    await drain();
    expect(listview().children[3].icon1.isVisible).toBe(false);
    // Pinned (nothing would restore it): it stays drawn while the user scrolls.
    await scrollTo(1000 * ROW_HEIGHT);
    expect(renderedRows()).toContain(3);

    // As rows the user clicked, at most MAX_PINNED_ROWS of them: the first ones let go.
    const rows = Array.from({ length: 60 }, (_, i) => 1500 + i * 10);
    const all = Promise.all(
      rows.map((row) => outcome(state().runRowAction('lv1', row, 'ico1', 'setVisibility', [false], MODULE_ID)))
    );
    await waitFor(() => expect(renderedRows()).toContain(rows[rows.length - 1]), { timeout: 5000 });
    await act(() => all);
    expect(await all).toEqual(rows.map(() => 'resolved'));
    await waitFor(() => expect(renderedRows()).not.toContain(rows[0]));
    expect(renderedRows()).not.toContain(3);
    expect(renderedRows()).toContain(rows[rows.length - 1]);
  });

  test('state actions whose write fails reject', async () => {
    renderListview(ROWS);
    await mounted();
    const { updateDependencyValues } = state();
    useStore.setState({
      updateDependencyValues: () => {
        throw new Error('broken');
      },
    });
    try {
      const run = state().runRowAction('lv1', 2005, 'txt1', 'setText', ['x'], MODULE_ID);
      await expect(run).rejects.toThrow('broken');
    } finally {
      useStore.setState({ updateDependencyValues });
    }
  });

  test('a row that leaves its slot while its changes are replayed is restored when drawn again', async () => {
    renderListview(ROWS);
    await mounted();
    await act(async () => {
      await state().runRowAction('lv1', 2005, 'txt1', 'setText', ['changed'], MODULE_ID);
    });

    const slotsNow = () => state().resolvedStore.modules[MODULE_ID].listviewSlots.lv1;
    let shown = null;
    // The replay's call: the row leaves its slot while it runs.
    const setText = jest.spyOn(textExposure.actions, 'setText').mockImplementationOnce((current, [text]) => {
      shown = slotsNow();
      state().setListviewSlots(
        'lv1',
        shown.map((row) => (row === 2005 ? -1 : row)),
        [],
        MODULE_ID
      );
      return { text };
    });
    const drawnAgain = state().ensureRowMounted('lv1', 2005, MODULE_ID);
    await waitFor(() => expect(setText).toHaveBeenCalledTimes(1));
    await drain();

    // Back in its slot: replayed again before it counts as drawn.
    act(() => state().setListviewSlots('lv1', shown, [], MODULE_ID));
    await act(() => drawnAgain);
    expect(setText).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(rowElement(2005).textContent).toContain('changed'));
    expect(listview().children[2005].text1.text).toBe('changed');
  });

  test("a changed row drawn again shows its change at once: its children/data don't go back to its props", async () => {
    renderListview(ROWS);
    await mounted();
    await act(async () => {
      await state().runRowAction('lv1', 2005, 'txt1', 'setText', ['changed'], MODULE_ID);
    });
    await drain();

    const seen = [];
    const unsubscribe = useStore.subscribe(() => {
      const text = listview().data?.[2005]?.text1?.text;
      if (text !== seen[seen.length - 1]) seen.push(text);
    });
    await scrollTo(2000 * ROW_HEIGHT);
    await waitFor(() => expect(renderedRows()).toContain(2005));
    await drawn(2005);
    await waitFor(() => expect(rowElement(2005).textContent).toContain('changed'));
    await drain();
    unsubscribe();
    expect(seen).not.toContain('row 2005');
    expect(seen[seen.length - 1]).toBe('changed');
    expect(state().getResolvedComponent('out1', null, MODULE_ID).properties.text).toBe('changed');
  });

  test('a row whose widgets mount again in the same slot (the loading state shown) gets its changes back', async () => {
    renderListview(ROWS);
    await mounted();
    await act(async () => {
      await listview().children[3].text1.setText('A');
    });
    await waitFor(() => expect(rowElement(3).textContent).toContain('A'));

    await act(async () => {
      state().setVariable('loading', true, MODULE_ID);
    });
    await drain();
    expect(renderedRows()).toEqual([]);
    // While its widgets are gone, its functions still run on the row.
    await act(async () => {
      await listview().children[4].text1.setText('B');
    });
    await drain();
    expect(listview().children[4].text1.text).toBe('B');

    await act(async () => {
      state().setVariable('loading', false, MODULE_ID);
    });
    await drain();
    await drawn(4);
    await waitFor(() => expect(rowElement(3).textContent).toContain('A'));
    await waitFor(() => expect(rowElement(4).textContent).toContain('B'));
    await drain();
    expect(listview().children[3].text1.text).toBe('A');
    expect(listview().children[4].text1.text).toBe('B');

    await scrollTo(2000 * ROW_HEIGHT);
    await waitFor(() => expect(renderedRows()).not.toContain(3));
    expect(state().readListviewRow('lv1', 3, MODULE_ID).text1.text).toBe('A');
    expect(listview().children[3].text1.text).toBe('A');
    await scrollTo(0);
    await waitFor(() => expect(renderedRows()).toContain(3));
    await drawn(3);
    await waitFor(() => expect(rowElement(3).textContent).toContain('A'));
  });

  test('a row whose widgets mount again with a child now hidden still settles, and gets its changes back', async () => {
    renderListview(ROWS, { hidableImage: true });
    await mounted();
    await act(async () => {
      await listview().children[3].text1.setText('A');
    });
    await act(async () => {
      state().setVariable('loading', true, MODULE_ID);
    });
    await drain();
    await act(async () => {
      state().setVariable('hideImg', true, MODULE_ID);
      state().setVariable('loading', false, MODULE_ID);
    });
    await drain();
    // image1 mounts no widget again: its old function must not hold the row back.
    expect(await outcome(state().ensureRowMounted('lv1', 3, MODULE_ID))).toBe('resolved');
    await waitFor(() => expect(rowElement(3).textContent).toContain('A'));
    expect(listview().children[3].text1.text).toBe('A');
  });

  test('a row past the end, or not a row index, reads as undefined', async () => {
    renderListview(ROWS);
    await mounted();
    expect(state().readListviewRow('lv1', ROWS.length, MODULE_ID)).toBeUndefined();
    expect(state().readListviewRow('lv1', 99999, MODULE_ID)).toBeUndefined();
    expect(state().readListviewRow('lv1', -1, MODULE_ID)).toBeUndefined();
    expect(state().readListviewRow('lv1', 1.5, MODULE_ID)).toBeUndefined();
    expect(state().readListviewRow('lv1', ROWS.length - 1, MODULE_ID).text1.text).toBe(ROWS[ROWS.length - 1].name);
  });

  test('rows the data no longer has lose their changes', async () => {
    renderListview(ROWS);
    await mounted();

    await act(async () => {
      await state().runRowAction('lv1', 2900, 'txt1', 'setText', ['gone'], MODULE_ID);
      await state().runRowAction('lv1', 2005, 'txt1', 'setText', ['kept'], MODULE_ID);
    });
    expect(Object.keys(rowChanges())).toEqual(['2005', '2900']);

    await act(async () => {
      state().setVariable('rows', ROWS.slice(0, 2500), MODULE_ID);
    });
    await drain();
    await drain();

    await waitFor(() => expect(listview().children[2900]).toBeUndefined());
    expect(Object.keys(rowChanges())).toEqual(['2005']);
    // Slot writes walk the rows only when they were cut shorter since the last one.
    expect(forgetListviewRows('lv1', MODULE_ID, 2500)).toBe(false);
    expect(forgetListviewRows('lv1', MODULE_ID, 2400)).toBe(true);
    expect(listview().children[2005].text1.text).toBe('kept');
    await expect(state().runRowAction('lv1', 2900, 'txt1', 'setText', ['x'], MODULE_ID)).rejects.toThrow(RangeError);
  });

  test('a list that stops windowing, or unmounts, drops its changes', async () => {
    const { unmount } = renderListview(ROWS);
    await mounted();
    await act(async () => {
      await state().runRowAction('lv1', 2005, 'txt1', 'setText', ['changed'], MODULE_ID);
      await state().runRowAction('lv1', 4, 'txt1', 'setText', ['short'], MODULE_ID);
    });
    expect(Object.keys(rowChanges())).toEqual(['4', '2005']);

    await act(async () => {
      state().setVariable('rows', ROWS.slice(0, 5), MODULE_ID);
    });
    await drain();
    await waitFor(() => expect(renderedRows()).toEqual([0, 1, 2, 3, 4]));
    // Every row mounts afresh, and exposes its values again (the slots' were reset).
    await drawn(4);
    expect(listview().children[4].text1.text).toBe('row 4');
    expect(rowChanges()).toBeUndefined();
    // Drawn as every short list is: the widgets' own functions.
    const slotExposure = state().resolvedStore.modules[MODULE_ID].exposedValues.components.txt1[1];
    await waitFor(() => expect(listview().children[1].text1.setText).toBe(slotExposure.setText));

    await act(async () => {
      state().setVariable('rows', ROWS, MODULE_ID);
    });
    await drain();
    await drawn(3);
    expect(listview().children[3].text1.text).toBe('row 3');
    await act(async () => {
      await state().runRowAction('lv1', 2005, 'txt1', 'setText', ['again'], MODULE_ID);
    });
    expect(Object.keys(rowChanges())).toEqual(['2005']);
    act(() => unmount());
    expect(rowChanges()).toBeUndefined();
  });
});

describe('Listview rows on demand — a short list (every row drawn)', () => {
  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario: SCENARIO });
  });

  test("children keep the widgets' own functions, and actions run on them", async () => {
    renderListview(ROWS.slice(0, 5));
    await drain();
    await waitFor(() => expect(renderedRows()).toEqual([0, 1, 2, 3, 4]));
    await drawn(4);
    await drain();

    const slotExposure = state().resolvedStore.modules[MODULE_ID].exposedValues.components.txt1[1];
    expect(listview().children[1].text1.setText).toBe(slotExposure.setText);
    expect(state().readListviewRow('lv1', 1, MODULE_ID).text1.setText).toBe(slotExposure.setText);

    await act(async () => {
      await state().runRowAction('lv1', 1, 'txt1', 'setText', ['direct'], MODULE_ID);
      await state().ensureRowMounted('lv1', 1, MODULE_ID);
    });
    await waitFor(() => expect(listview().children[1].text1.text).toBe('direct'));
    expect(rowElement(1).textContent).toContain('direct');
    expect(rowChanges()).toBeUndefined();

    // A list that draws every row keeps nothing of rows on demand.
    expect(forgetListviewRows('lv1', MODULE_ID, 5)).toBe(true);
    forgetListviewRows('lv1', MODULE_ID);

    // As before rows on demand: a widget's exposed click fires with the listItem its fireEvent had when it exposed it.
    await act(async () => {
      state().setVariable(
        'rows',
        ROWS.slice(0, 5).map((row, i) => ({ ...row, name: `new row ${i}` })),
        MODULE_ID
      );
    });
    await drain();
    await waitFor(() => expect(rowElement(1).textContent).toContain('new row 1'));
    await act(async () => {
      await listview().children[1].button1.click();
    });
    await waitFor(() => expect(variables().clicked).toBe('row 1'));
  });

  test('a ListView in the rows of another is not addressed by rows on demand', async () => {
    renderListview(ROWS.slice(0, 3), { inner: true });
    await drain();
    await drawn(2);
    expect(document.querySelectorAll('.dynamic-lv2')).toHaveLength(3);
    expect(handleOf(MODULE_ID, 'lv1')).toBeDefined();
    expect(handleOf(MODULE_ID, 'lv2')).toBeUndefined();
    await expect(state().ensureRowMounted('lv2', 0, MODULE_ID)).rejects.toThrow('not mounted');
  });
});
