/**
 * Listview: the approved contract in
 * frontend/ee/test/app-builder/widgets/Listview/TESTING.md, exercised through
 * the real store and the real RenderWidget. Shared setup lives in
 * Widgets/widgetHarness.js.
 *
 * Real store, real RenderWidget, real Listview + ListviewSubcontainer +
 * AppCanvas/Container + real child widgets rendered inside every row. Nothing
 * about the widget is mocked.
 *
 * Why the RTL layer, and why real children: this widget's whole product is
 * "render N copies of a row template, each scoped to its own record". A row is
 * only meaningful with a real child bound to `{{listItem.x}}` — and the
 * per-row resolution that binding depends on is the highest-recurrence bug
 * family in the App Builder (seven fix commits; see the store-level suite at
 * _stores/slices/__tests__/integration/listViewRowScope.spec.js, which covers
 * the scope machinery itself). These specs cover the widget's own contract
 * through the real DOM instead.
 *
 * `capabilities.dnd` is mandatory here: Container requires the real react-dnd
 * provider, and a Listview is nothing but containers.
 *
 * Deliberately NOT covered here: row separators, dynamic height and the
 * blocking half of `disabledState` — all real-geometry / real-`inert`
 * behaviour that jsdom cannot answer (Listview-BRW-001..003, QA-owned).
 *
 * Test titles carry their approved scenario ID as a `[Listview-FAMILY-NNN]`
 * prefix, per the widget-testing-contract validator.
 */
import { waitFor } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition } from '@/test/app-builder';

const ID = 'lv1';
const NAME = 'listview1';
const THREE_RECORDS = `{{[{ text: 'Alpha' }, { text: 'Beta' }, { text: 'Gamma' }]}}`;

/**
 * A row-template child. `others.showOnDesktop` is load-bearing, not decoration:
 * WidgetWrapper hides a component whose device flags are absent, so a child
 * seeded without it renders nothing and every row assertion below would pass
 * against an empty row.
 */
function rowChild(id, name, type, properties) {
  const definition = componentDefinition(id, name, type, properties);
  definition.component.parent = ID;
  definition.component.definition.styles = {};
  definition.component.definition.others = {
    showOnDesktop: binding('{{true}}'),
    showOnMobile: binding('{{false}}'),
  };
  return definition;
}

const TEXT_CHILD = () => rowChild('txt1', 'text1', 'Text', { text: binding('{{listItem.text}}') });

const widget = createWidgetHarness({
  componentType: 'Listview',
  handle: NAME,
  id: ID,
  // Baseline is `listview.js`'s own `definition.properties`, copied rather than
  // invented.
  defaultProperties: {
    dataSourceSelector: binding('rawJson'),
    data: binding(THREE_RECORDS),
    mode: binding('list'),
    columns: binding('{{3}}'),
    rowHeight: binding('100'),
    loadingState: binding('{{false}}'),
    dynamicHeight: binding('{{false}}'),
    visibility: binding('{{true}}'),
    collapseWhenHidden: binding('{{false}}'),
    disabledState: binding('{{false}}'),
    showBorder: binding('{{true}}'),
    rowsPerPage: binding('{{10}}'),
    enablePagination: binding('{{false}}'),
    tooltip: binding(''),
    tooltipFormat: binding('plainText'),
  },
  defaultStyles: {
    backgroundColor: binding('var(--cc-surface1-surface)'),
    borderColor: binding('var(--cc-weak-border)'),
    borderRadius: binding('{{6}}'),
    boxShadow: binding('0px 0px 0px 0px #00000040'),
  },
  defaultExtraComponents: { txt1: TEXT_CHILD() },
  capabilities: { dnd: true },
  widgetHeight: 450,
  widgetWidth: 600,
});

const user = () => widget.session.user;
const container = () => document.getElementById(ID);
const rows = () => [...document.querySelectorAll('.list-item')];
const rowTexts = () => rows().map((node) => node.textContent);
const pager = () => document.querySelector('[data-cy="next-page-link"]')?.closest('ul');
const spinner = () => document.querySelector('[class*="spinner"]');
const exposed = (key) => widget.exposed()?.[key];

/** Every scenario renders in the viewer: that is where a List View is used. */
async function mount(options = {}) {
  widget.render({ currentMode: 'view', ...options });
  await waitFor(() => expect(container()).toBeInTheDocument());
}

const counting = (eventId, key) => ({
  id: `evt-${eventId}`,
  index: 0,
  sourceId: ID,
  name: `evt-${eventId}`,
  target: 'component',
  event: { eventId, actionId: 'set-custom-variable', key, value: `{{(variables.${key} ?? 0) + 1}}` },
});
const BOTH_EVENTS = [counting('onRecordClicked', 'rec'), counting('onRowClicked', 'row')];
const fired = (key) => store().getVariable(key, MODULE_ID) ?? 0;

/**
 * A nested List View: the outer rows each hold their own inner List View, whose data is
 * `{{listItem.items}}` — a different answer per outer row. The inner Text then reads the INNER
 * record, so a row's text depends on two row numbers, not one.
 */
const NESTED_RECORDS = `{{[{ name: 'o1', items: [{ name: 'a' }, { name: 'b' }] }, { name: 'o2', items: [{ name: 'c' }, { name: 'd' }] }]}}`;

function innerListview() {
  const definition = componentDefinition('lv2', 'listview2', 'Listview', {
    dataSourceSelector: binding('rawJson'),
    data: binding('{{listItem.items}}'),
    mode: binding('list'),
    columns: binding('{{1}}'),
    rowHeight: binding('100'),
    loadingState: binding('{{false}}'),
    dynamicHeight: binding('{{false}}'),
    visibility: binding('{{true}}'),
    collapseWhenHidden: binding('{{false}}'),
    disabledState: binding('{{false}}'),
    showBorder: binding('{{true}}'),
    rowsPerPage: binding('{{10}}'),
    enablePagination: binding('{{false}}'),
  });
  definition.component.parent = ID;
  definition.component.definition.styles = {};
  definition.component.definition.others = {
    showOnDesktop: binding('{{true}}'),
    showOnMobile: binding('{{false}}'),
  };
  return definition;
}

function innerText() {
  const definition = componentDefinition('txt2', 'text2', 'Text', {
    text: binding(`{{listItem.name + (variables.sfx ?? '')}}`),
  });
  definition.component.parent = 'lv2';
  definition.component.definition.styles = {};
  definition.component.definition.others = {
    showOnDesktop: binding('{{true}}'),
    showOnMobile: binding('{{false}}'),
  };
  return definition;
}

const nestedWidget = createWidgetHarness({
  componentType: 'Listview',
  handle: NAME,
  id: ID,
  defaultProperties: {
    dataSourceSelector: binding('rawJson'),
    data: binding(NESTED_RECORDS),
    mode: binding('list'),
    columns: binding('{{1}}'),
    rowHeight: binding('250'),
    loadingState: binding('{{false}}'),
    dynamicHeight: binding('{{false}}'),
    visibility: binding('{{true}}'),
    collapseWhenHidden: binding('{{false}}'),
    disabledState: binding('{{false}}'),
    showBorder: binding('{{true}}'),
    rowsPerPage: binding('{{10}}'),
    enablePagination: binding('{{false}}'),
  },
  defaultStyles: {
    backgroundColor: binding('var(--cc-surface1-surface)'),
    borderColor: binding('var(--cc-weak-border)'),
  },
  defaultExtraComponents: { lv2: innerListview(), txt2: innerText() },
  capabilities: { dnd: true },
  widgetHeight: 600,
  widgetWidth: 600,
});

function innerContainer() {
  const definition = componentDefinition('cont1', 'container1', 'Container', {});
  definition.component.parent = 'lv2';
  definition.component.definition.styles = {};
  definition.component.definition.others = {
    showOnDesktop: binding('{{true}}'),
    showOnMobile: binding('{{false}}'),
  };
  return definition;
}

function containedText() {
  const definition = componentDefinition('txt3', 'text3', 'Text', { text: binding('{{listItem.name}}') });
  definition.component.parent = 'cont1';
  definition.component.definition.styles = {};
  definition.component.definition.others = {
    showOnDesktop: binding('{{true}}'),
    showOnMobile: binding('{{false}}'),
  };
  return definition;
}

const containerWidget = createWidgetHarness({
  componentType: 'Listview',
  handle: NAME,
  id: ID,
  defaultProperties: {
    dataSourceSelector: binding('rawJson'),
    data: binding(NESTED_RECORDS),
    mode: binding('list'),
    columns: binding('{{1}}'),
    rowHeight: binding('250'),
    loadingState: binding('{{false}}'),
    dynamicHeight: binding('{{false}}'),
    visibility: binding('{{true}}'),
    collapseWhenHidden: binding('{{false}}'),
    disabledState: binding('{{false}}'),
    showBorder: binding('{{true}}'),
    rowsPerPage: binding('{{10}}'),
    enablePagination: binding('{{false}}'),
  },
  defaultStyles: {
    backgroundColor: binding('var(--cc-surface1-surface)'),
    borderColor: binding('var(--cc-weak-border)'),
  },
  defaultExtraComponents: { lv2: innerListview(), cont1: innerContainer(), txt3: containedText() },
  capabilities: { dnd: true },
  widgetHeight: 600,
  widgetWidth: 600,
});

const TEN_RECORDS = `{{[{ name: 'r0' }, { name: 'r1' }, { name: 'r2' }, { name: 'r3' }, { name: 'r4' }, { name: 'r5' }, { name: 'r6' }, { name: 'r7' }, { name: 'r8' }, { name: 'r9' }]}}`;

function checkboxChild() {
  const definition = componentDefinition('chk1', 'checkbox1', 'Checkbox', {
    label: binding('{{listItem.name}}'),
    defaultValue: binding('{{false}}'),
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
    loadingState: binding('{{false}}'),
  });
  definition.component.parent = ID;
  definition.component.definition.styles = {};
  definition.component.definition.others = {
    showOnDesktop: binding('{{true}}'),
    showOnMobile: binding('{{false}}'),
  };
  return definition;
}

const paginatedWidget = createWidgetHarness({
  componentType: 'Listview',
  handle: NAME,
  id: ID,
  defaultProperties: {
    dataSourceSelector: binding('rawJson'),
    data: binding(TEN_RECORDS),
    mode: binding('list'),
    columns: binding('{{1}}'),
    rowHeight: binding('100'),
    loadingState: binding('{{false}}'),
    dynamicHeight: binding('{{false}}'),
    visibility: binding('{{true}}'),
    collapseWhenHidden: binding('{{false}}'),
    disabledState: binding('{{false}}'),
    showBorder: binding('{{true}}'),
    rowsPerPage: binding('{{5}}'),
    enablePagination: binding('{{true}}'),
  },
  defaultStyles: {
    backgroundColor: binding('var(--cc-surface1-surface)'),
    borderColor: binding('var(--cc-weak-border)'),
  },
  defaultExtraComponents: { chk1: checkboxChild() },
  capabilities: { dnd: true },
  widgetHeight: 600,
  widgetWidth: 600,
});

describe('Listview: a page change does not carry child state across records', () => {
  beforeEach(paginatedWidget.setup);
  afterEach(paginatedWidget.teardown);

  const boxes = () => [...document.querySelectorAll('input[type="checkbox"]')];

  test('[Listview-BUG-004] a checkbox ticked on page one leaves page two untouched', async () => {
    // Break this catches: rows keyed by position in the page, so page two reuses page one's
    // component instances and inherits whatever state they were left holding.
    paginatedWidget.render({ currentMode: 'view' });
    await waitFor(() => expect(boxes()).toHaveLength(5));

    await paginatedWidget.session.user.click(boxes()[0].parentElement);
    await waitFor(() => expect(boxes()[0]).toBeChecked());

    await paginatedWidget.session.user.click(document.querySelector('[data-cy="next-page-link"]'));

    await waitFor(() => expect(rowTexts()[0]).toContain('r5'));
    expect(boxes()[0]).not.toBeChecked();
  });
});

function formChild() {
  const definition = componentDefinition('form1', 'form1', 'Form', {
    visibility: binding('{{true}}'),
    loadingState: binding('{{false}}'),
    disabledState: binding('{{false}}'),
    advanced: binding('{{false}}'),
    showHeader: binding('{{true}}'),
    showFooter: binding('{{true}}'),
  });
  definition.component.parent = ID;
  definition.component.definition.styles = {};
  definition.component.definition.others = {
    showOnDesktop: binding('{{true}}'),
    showOnMobile: binding('{{false}}'),
  };
  return definition;
}

function formHeaderText() {
  const definition = componentDefinition('ftxt', 'formtitle', 'Text', { text: binding('Form title') });
  definition.component.parent = 'form1-header';
  definition.component.definition.styles = {};
  definition.component.definition.others = {
    showOnDesktop: binding('{{true}}'),
    showOnMobile: binding('{{false}}'),
  };
  return definition;
}

const formWidget = createWidgetHarness({
  componentType: 'Listview',
  handle: NAME,
  id: ID,
  defaultProperties: {
    dataSourceSelector: binding('rawJson'),
    data: binding(`{{[{ id: 1, name: 'r1' }, { id: 2, name: 'r2' }]}}`),
    mode: binding('list'),
    columns: binding('{{1}}'),
    rowHeight: binding('300'),
    loadingState: binding('{{false}}'),
    dynamicHeight: binding('{{false}}'),
    visibility: binding('{{true}}'),
    collapseWhenHidden: binding('{{false}}'),
    disabledState: binding('{{false}}'),
    showBorder: binding('{{true}}'),
    rowsPerPage: binding('{{10}}'),
    enablePagination: binding('{{false}}'),
  },
  defaultStyles: {
    backgroundColor: binding('var(--cc-surface1-surface)'),
    borderColor: binding('var(--cc-weak-border)'),
  },
  defaultExtraComponents: { form1: formChild(), ftxt: formHeaderText() },
  capabilities: { dnd: true },
  widgetHeight: 700,
  widgetWidth: 600,
});

function submitButtonChild() {
  const definition = componentDefinition('btn1', 'button1', 'Button', { text: binding('Submit') });
  definition.component.parent = 'form1-footer';
  definition.component.definition.styles = {};
  definition.component.definition.others = {
    showOnDesktop: binding('{{true}}'),
    showOnMobile: binding('{{false}}'),
  };
  return definition;
}

const submitWidget = createWidgetHarness({
  componentType: 'Listview',
  handle: NAME,
  id: ID,
  defaultProperties: {
    dataSourceSelector: binding('rawJson'),
    data: binding(`{{[{ id: 1 }, { id: 2 }, { id: 3 }]}}`),
    mode: binding('list'),
    columns: binding('{{1}}'),
    rowHeight: binding('300'),
    loadingState: binding('{{false}}'),
    dynamicHeight: binding('{{false}}'),
    visibility: binding('{{true}}'),
    collapseWhenHidden: binding('{{false}}'),
    disabledState: binding('{{false}}'),
    showBorder: binding('{{true}}'),
    rowsPerPage: binding('{{10}}'),
    enablePagination: binding('{{false}}'),
  },
  defaultStyles: {
    backgroundColor: binding('var(--cc-surface1-surface)'),
    borderColor: binding('var(--cc-weak-border)'),
  },
  defaultExtraComponents: {
    form1: (() => {
      const d = formChild();
      d.component.definition.properties.buttonToSubmit = binding('btn1');
      return d;
    })(),
    btn1: submitButtonChild(),
  },
  capabilities: { dnd: true },
  widgetHeight: 900,
  widgetWidth: 600,
});

function textInputChild() {
  const definition = componentDefinition('tin1', 'textinput1', 'TextInput', {
    label: binding('Label'),
    placeholder: binding('Enter your input'),
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
    loadingState: binding('{{false}}'),
  });
  definition.component.parent = ID;
  definition.component.definition.styles = {};
  definition.component.definition.others = {
    showOnDesktop: binding('{{true}}'),
    showOnMobile: binding('{{false}}'),
  };
  return definition;
}

const inputWidget = createWidgetHarness({
  componentType: 'Listview',
  handle: NAME,
  id: ID,
  defaultProperties: {
    dataSourceSelector: binding('rawJson'),
    data: binding(`{{[{ id: 1 }, { id: 2 }]}}`),
    mode: binding('list'),
    columns: binding('{{1}}'),
    rowHeight: binding('150'),
    loadingState: binding('{{false}}'),
    dynamicHeight: binding('{{false}}'),
    visibility: binding('{{true}}'),
    collapseWhenHidden: binding('{{false}}'),
    disabledState: binding('{{false}}'),
    showBorder: binding('{{true}}'),
    rowsPerPage: binding('{{10}}'),
    enablePagination: binding('{{false}}'),
  },
  defaultStyles: {
    backgroundColor: binding('var(--cc-surface1-surface)'),
    borderColor: binding('var(--cc-weak-border)'),
  },
  defaultExtraComponents: { tin1: textInputChild() },
  capabilities: { dnd: true },
  widgetHeight: 500,
  widgetWidth: 600,
});

describe('Listview: a row event sees the child value as it is after the click', () => {
  beforeEach(paginatedWidget.setup);
  afterEach(paginatedWidget.teardown);

  test('[Listview-BUG-010] clicking a checkbox label fires Record clicked once', async () => {
    // Break this catches: the browser forwarding a label click to the hidden input, so the row
    // receives two DOM clicks and the handler runs twice — once before the toggle, once after.
    paginatedWidget.render({
      currentMode: 'view',
      events: [
        {
          id: 'evt-count',
          index: 0,
          sourceId: ID,
          name: 'evt-count',
          target: 'component',
          event: {
            eventId: 'onRecordClicked',
            actionId: 'set-custom-variable',
            key: 'clicks',
            value: `{{(variables.clicks ?? 0) + 1}}`,
          },
        },
      ],
    });
    await waitFor(() => expect(document.querySelectorAll('input[type="checkbox"]')).toHaveLength(5));

    await paginatedWidget.session.user.click(document.querySelectorAll('label')[0]);

    await waitFor(() => expect(store().getVariable('clicks', MODULE_ID)).toBe(1));
  });

  test('[Listview-BUG-009] Record clicked reads the checkbox value the click produced', async () => {
    // Break this catches: reading selectedRecord out of the store before the clicked child's own
    // write has landed, so the handler sees the value from before the click — or nothing at all.
    paginatedWidget.render({
      currentMode: 'view',
      events: [
        {
          id: 'evt-rec',
          index: 0,
          sourceId: ID,
          name: 'evt-rec',
          target: 'component',
          event: {
            eventId: 'onRecordClicked',
            actionId: 'set-custom-variable',
            key: 'ticked',
            value: `{{components.${NAME}.selectedRecord.checkbox1.value}}`,
          },
        },
      ],
    });
    await waitFor(() => expect(document.querySelectorAll('input[type="checkbox"]')).toHaveLength(5));

    const box = document.querySelectorAll('input[type="checkbox"]')[0];
    await paginatedWidget.session.user.click(box.parentElement);

    await waitFor(() => expect(store().getVariable('ticked', MODULE_ID)).toBe(true));
  });
});

describe('Listview: the published data follows the row children', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  const dataRows = () => exposed('data') ?? {};

  test('[Listview-BUG-011] removing a row child drops it from the published data', async () => {
    // Break this catches: the list's data being patched by children as they write, with nothing
    // rebuilding it when a child leaves — so a removed child is reported forever.
    await mount();
    await waitFor(() => expect(dataRows()[0]?.text1?.text).toBe('Alpha'));
    expect(Object.keys(dataRows())).toHaveLength(3);

    await widget.session.store.act(() => {
      store().deleteComponents(['txt1'], MODULE_ID, { saveAfterAction: false });
    });

    await waitFor(() => expect(dataRows()[0]?.text1).toBeUndefined());
    expect(dataRows()[1]?.text1).toBeUndefined();
    expect(dataRows()[2]?.text1).toBeUndefined();
  });

  test('[Listview-BUG-011] dragging a child out of the row drops it from the published data', async () => {
    // Break this catches: covering deletion only. A drag re-parents the component, which keeps it
    // alive — a different path from deleting it, and the one a builder actually takes.
    await mount();
    await waitFor(() => expect(dataRows()[0]?.text1?.text).toBe('Alpha'));

    await widget.session.store.act(() => {
      store().setComponentLayout({ txt1: { width: 10, height: 30, top: 0, left: 0 } }, null, MODULE_ID, {
        updateParent: true,
        saveAfterAction: false,
      });
    });

    await waitFor(() => expect(dataRows()[0]?.text1).toBeUndefined());
    expect(JSON.stringify(exposed('data'))).not.toContain('Alpha');
  });

  test('[Listview-BUG-012] re-parenting through setParentComponent drops the child from the data', async () => {
    // Break this catches: setParentComponent reading a page index the store keeps per module, so
    // the action throws before it moves anything — undoing a drag, or receiving one over
    // multiplayer, takes the whole canvas down.
    await mount();
    await waitFor(() => expect(dataRows()[0]?.text1?.text).toBe('Alpha'));

    await widget.session.store.act(() => {
      store().setParentComponent('txt1', null, MODULE_ID, { saveAfterAction: false });
    });

    await waitFor(() => expect(dataRows()[0]?.text1).toBeUndefined());
    expect(store().getComponentDefinition('txt1', MODULE_ID).component.parent).toBeNull();
  });

  test('[Listview-BUG-011] a child added back is published again, with current values', async () => {
    // Break this catches: a fix that only handles removal. Reappearing in the data is not enough —
    // the values must be derived now, not restored from whatever was left behind.
    await mount();
    await waitFor(() => expect(dataRows()[0]?.text1?.text).toBe('Alpha'));

    await widget.session.store.act(() => {
      store().deleteComponents(['txt1'], MODULE_ID, { saveAfterAction: false });
    });
    await waitFor(() => expect(dataRows()[0]?.text1).toBeUndefined());

    await widget.session.store.act(() => {
      store().addComponentToCurrentPage([TEXT_CHILD()], MODULE_ID, { saveAfterAction: false });
    });

    await waitFor(() => expect(dataRows()[0]?.text1?.text).toBe('Alpha'));
    expect(dataRows()[1]?.text1?.text).toBe('Beta');
    expect(dataRows()[2]?.text1?.text).toBe('Gamma');
  });

  test('[Listview-BUG-011] the published data is rebuilt, not patched, so it cannot go stale', async () => {
    // Break this catches: a fix that only deletes the removed key. The row must be derived from the
    // children that exist now, so values can never survive their component.
    await mount();
    await waitFor(() => expect(dataRows()[0]?.text1?.text).toBe('Alpha'));

    await widget.session.store.act(() => {
      store().deleteComponents(['txt1'], MODULE_ID, { saveAfterAction: false });
    });
    await waitFor(() => expect(dataRows()[0]?.text1).toBeUndefined());

    expect(JSON.stringify(exposed('data'))).not.toContain('Alpha');
    expect(JSON.stringify(exposed('children'))).not.toContain('Alpha');
    expect(JSON.stringify(exposed('selectedRecord') ?? {})).not.toContain('Alpha');
  });
});

describe('Listview: a row event knows which record fired it', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  const recordEvent = (eventId) => ({
    id: `evt-${eventId}`,
    index: 0,
    sourceId: ID,
    name: `evt-${eventId}`,
    target: 'component',
    event: { eventId, actionId: 'set-custom-variable', key: 'picked', value: '{{listItem.text}}' },
  });

  test.each([['onRecordClicked'], ['onRowClicked']])(
    '[Listview-EVT-004] %s resolves listItem to the clicked record',
    async (eventId) => {
      // Break this catches: firing a row event without the record, so a handler on the list itself
      // has no way to read the row that triggered it and `{{listItem}}` resolves to nothing.
      await mount({ events: [recordEvent(eventId)] });
      await waitFor(() => expect(rows()).toHaveLength(3));

      await user().click(rows()[1]);

      await waitFor(() => expect(store().getVariable('picked', MODULE_ID)).toBe('Beta'));
    }
  );
});

describe('Listview: an On change handler reads the value that just changed', () => {
  beforeEach(inputWidget.setup);
  afterEach(inputWidget.teardown);

  test('[Listview-BUG-008] a handler reading listview data sees the keystroke that fired it', async () => {
    // Break this catches: the list's `data` aggregate lagging the child write by one keystroke, so a
    // handler reading it acts on the value from before the change that triggered it.
    inputWidget.render({
      currentMode: 'view',
      events: [
        {
          id: 'evt-change',
          index: 0,
          sourceId: 'tin1',
          name: 'evt-change',
          target: 'component',
          event: {
            eventId: 'onChange',
            actionId: 'set-custom-variable',
            key: 'seen',
            value: `{{components.${NAME}.data[0].textinput1.value}}`,
          },
        },
      ],
    });
    await waitFor(() => expect(rows()).toHaveLength(2));

    const input = document.querySelectorAll('input[type="text"]')[0];
    await inputWidget.session.user.type(input, 'ab');

    await waitFor(() => expect(store().getVariable('seen', MODULE_ID)).toBe('ab'));
  });
});

describe('Listview: a Form submits only in its own row', () => {
  beforeEach(submitWidget.setup);
  afterEach(submitWidget.teardown);

  test('[Listview-BUG-006] clicking Submit in one row does not submit the other rows', async () => {
    // Break this catches: announcing the submit on `document`, where every row's Form hears it and
    // matches on a component id all three rows share.
    submitWidget.render({
      currentMode: 'view',
      events: [
        {
          id: 'evt-submit',
          index: 0,
          sourceId: 'form1',
          name: 'evt-submit',
          target: 'component',
          event: {
            eventId: 'onSubmit',
            actionId: 'set-custom-variable',
            key: 'submits',
            value: `{{(variables.submits ?? 0) + 1}}`,
          },
        },
      ],
    });
    await waitFor(() => expect(rows()).toHaveLength(3));

    const submitButtons = [...document.querySelectorAll('.widget-button button')];
    await submitWidget.session.user.click(submitButtons[1]);

    await waitFor(() => expect(store().getVariable('submits', MODULE_ID)).toBe(1));
  });
});

describe('Listview: a Form inside a row keeps its header and footer', () => {
  beforeEach(formWidget.setup);
  afterEach(formWidget.teardown);

  test('[Listview-BUG-005] a Form slot child inside a row still renders', async () => {
    // Break this catches: expanding a Form's header/footer slot children per row, which leaves the
    // title and the submit button blank in every row.
    formWidget.render({ currentMode: 'view' });
    await waitFor(() => expect(rows()).toHaveLength(2));

    expect(document.body.textContent).toContain('Form title');
  });
});

describe('Listview: the scroll container keeps its styling hook', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-STYLE-003] the scrolling element carries the class the stylesheet targets', async () => {
    // Break this catches: renaming or dropping `listview-scroll-container`, which silently detaches
    // the hover-reveal scroll bar rules. It cannot prove the scroll bar hides — jest stubs out SCSS
    // entirely — so the hiding itself is Listview-BRW-005, measured in a browser.
    await mount();

    expect(container()).toHaveClass('listview-scroll-container');
  });
});

describe('Listview: a bad record does not destroy the good ones', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-BUG-003] a null among the records still renders the records around it', async () => {
    // Break this catches: rejecting the whole array because one entry is not an object, so a query
    // returning a single null row empties a list that had valid rows either side of it.
    await mount({ properties: { data: binding(`{{[{ text: 'Alpha' }, null, { text: 'Gamma' }]}}`) } });

    await waitFor(() => expect(rows()).toHaveLength(3));
    expect(rowTexts()).toEqual(['Alpha', '', 'Gamma']);
  });
});

describe('Listview: a Container inside a nested row', () => {
  beforeEach(containerWidget.setup);
  afterEach(containerWidget.teardown);

  test('[Listview-BUG-002] a Container between the inner list and its Text does not break the row scope', async () => {
    // Break this catches: a child nested behind a plain Container resolving against the OUTER list,
    // so every inner row shows the outer record instead of its own.
    containerWidget.render({ currentMode: 'view' });

    await waitFor(() =>
      expect([...document.querySelectorAll('.list-item .list-item')].map((n) => n.textContent)).toHaveLength(4)
    );
    expect(
      [...document.querySelectorAll('.list-item .list-item [component-type="Text"]')].map((n) => n.textContent)
    ).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('Listview: a nested list keeps its rows when something outside changes', () => {
  beforeEach(nestedWidget.setup);
  afterEach(nestedWidget.teardown);

  const innerTexts = () => [...document.querySelectorAll('.list-item .list-item')].map((node) => node.textContent);

  test('[Listview-BUG-001] setting a variable does not blank the inner rows', async () => {
    // Break this catches: re-resolving a nested row with the caller's row position instead of the
    // row's own. The caller is a button on the canvas with no position, so the lookup reads the
    // group of records where a single record was wanted and every inner row renders empty.
    nestedWidget.render({ currentMode: 'view' });
    await waitFor(() => expect(innerTexts()).toEqual(['a', 'b', 'c', 'd']));

    await nestedWidget.session.store.act(() => {
      store().setVariable('sfx', '!', MODULE_ID);
    });

    await waitFor(() => expect(innerTexts()).toEqual(['a!', 'b!', 'c!', 'd!']));
  });
});

/**
 * Inside a nested list a sibling is stored per outer row and then per inner row, so reading it
 * takes both row numbers. Reading it with the inner number alone lands on a whole outer row.
 */
describe('Listview: a nested row reads its own siblings', () => {
  beforeEach(nestedWidget.setup);
  afterEach(nestedWidget.teardown);

  const innerChild = (id, name, type, properties) => {
    const definition = componentDefinition(id, name, type, properties);
    definition.component.parent = 'lv2';
    definition.component.definition.styles = {};
    definition.component.definition.others = {
      showOnDesktop: binding('{{true}}'),
      showOnMobile: binding('{{false}}'),
    };
    return definition;
  };
  const INNER_INPUT = () =>
    innerChild('inp4', 'textinput4', 'TextInput', { label: binding(''), value: binding('{{listItem.name}}') });
  const INNER_MIRROR = () =>
    innerChild('txt2', 'text2', 'Text', { text: binding('T={{components.textinput4.value}}') });
  const INNER_BUTTON = () => innerChild('btn4', 'button4', 'Button', { text: binding('Go') });

  const innerTexts = () => [...document.querySelectorAll('.list-item .list-item')].map((node) => node.textContent);

  test('[Listview-BUG-044] a Text in an inner row mirrors the input in the same inner row', async () => {
    // Break this catches: the row overlay indexing a nested sibling by the inner row alone, which
    // returns the whole outer row's array and leaves every mirror blank.
    nestedWidget.render({ currentMode: 'view', extraComponents: { inp4: INNER_INPUT(), txt2: INNER_MIRROR() } });

    await waitFor(() => expect(innerTexts()).toEqual(['T=a', 'T=b', 'T=c', 'T=d']));
  });

  test('[Listview-BUG-044] the mirror keeps its own inner row after something outside changes', async () => {
    // Break this catches: the re-resolution that runs on a variable change indexing by the inner row
    // alone, so the first render is right and the next outside change blanks every mirror.
    const mirrorWithSuffix = () =>
      innerChild('txt2', 'text2', 'Text', {
        text: binding("T={{components.textinput4.value + (variables.sfx ?? '')}}"),
      });
    nestedWidget.render({ currentMode: 'view', extraComponents: { inp4: INNER_INPUT(), txt2: mirrorWithSuffix() } });
    await waitFor(() => expect(innerTexts()).toEqual(['T=a', 'T=b', 'T=c', 'T=d']));

    await nestedWidget.session.store.act(() => {
      store().setVariable('sfx', '!', MODULE_ID);
    });

    await waitFor(() => expect(innerTexts()).toEqual(['T=a!', 'T=b!', 'T=c!', 'T=d!']));
  });

  test('[Listview-BUG-044] an event in an inner row reads the input in the same inner row', async () => {
    // Break this catches: the action runner getting the full row path but the overlay using it as
    // one index, so a button in outer row 2 reads nothing.
    nestedWidget.render({
      currentMode: 'view',
      extraComponents: { inp4: INNER_INPUT(), btn4: INNER_BUTTON() },
      events: [
        {
          id: 'evt-inner',
          index: 0,
          sourceId: 'btn4',
          name: 'evt-inner',
          target: 'component',
          event: {
            eventId: 'onClick',
            actionId: 'set-custom-variable',
            key: 'innerRead',
            value: '{{components.textinput4.value}}',
          },
        },
      ],
    });
    const goButtons = () => [...document.querySelectorAll('button')].filter((node) => node.textContent === 'Go');
    await waitFor(() => expect(goButtons()).toHaveLength(4));

    await nestedWidget.session.user.click(goButtons()[2]);

    await waitFor(() => expect(store().getVariable('innerRead', MODULE_ID)).toBe('c'));
  });

  test('[Listview-BUG-045] Set visibility from an inner row hides the target in that inner row only', async () => {
    // Break this catches: the wrapper reading a nested child's state from outer row 0, where the
    // lookup walks into nothing and the action has no visible effect.
    nestedWidget.render({
      currentMode: 'view',
      extraComponents: {
        btn4: INNER_BUTTON(),
        btn5: innerChild('btn5', 'button5', 'Button', { text: binding('Target') }),
      },
      events: [hideTargetOnClick('btn4', 'btn5')],
    });
    await waitFor(() => expect(buttonsNamed('Target')).toHaveLength(4));

    await nestedWidget.session.user.click(buttonsNamed('Go')[2]);

    await waitFor(() => expect(wrapperShown('btn5')).toEqual([true, true, false, true]));
  });
});

describe('Listview: an inner row reads its outer row', () => {
  beforeEach(nestedWidget.setup);
  afterEach(nestedWidget.teardown);

  const outerText = () => {
    const definition = componentDefinition('txt0', 'text0', 'Text', { text: binding('{{listItem.name}}') });
    definition.component.parent = ID;
    definition.component.definition.styles = {};
    definition.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
    return definition;
  };
  const innerChild = (id, name, type, properties) => {
    const definition = componentDefinition(id, name, type, properties);
    definition.component.parent = 'lv2';
    definition.component.definition.styles = {};
    definition.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
    return definition;
  };
  const innerTexts = () => [...document.querySelectorAll('.ele-txt2')].map((node) => node.textContent.trim());

  test('[Listview-BUG-048] a Text in an inner row reads the outer row s Text', async () => {
    // Break this catches: the row overlay covering only the inner list, so an outer-row sibling
    // stays one value per outer row and every inner read is undefined (D-15).
    nestedWidget.render({
      currentMode: 'view',
      extraComponents: {
        txt0: outerText(),
        txt2: innerChild('txt2', 'text2', 'Text', { text: binding('B={{components.text0.text}}') }),
      },
    });

    await waitFor(() => expect(innerTexts()).toEqual(['B=o1', 'B=o1', 'B=o2', 'B=o2']));
  });

  test('[Listview-BUG-048] an event in an inner row reads the outer row s Text', async () => {
    // Break this catches: the action resolver sharing the same inner-only overlay.
    nestedWidget.render({
      currentMode: 'view',
      extraComponents: { txt0: outerText(), btn4: innerChild('btn4', 'button4', 'Button', { text: binding('Go') }) },
      events: [
        {
          id: 'evt-outer',
          index: 0,
          sourceId: 'btn4',
          name: 'evt-outer',
          target: 'component',
          event: {
            eventId: 'onClick',
            actionId: 'set-custom-variable',
            key: 'outerRead',
            value: '{{components.text0.text}}',
          },
        },
      ],
    });
    await waitFor(() => expect(buttonsNamed('Go')).toHaveLength(4));

    await nestedWidget.session.user.click(buttonsNamed('Go')[3]);

    await waitFor(() => expect(store().getVariable('outerRead', MODULE_ID)).toBe('o2'));
  });
});

describe('Listview: rows added after mount', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-BUG-049] a sibling of a toggle shows the toggle s value in a row added later', async () => {
    // Break this catches: a child's first write into a freshly created row slot being treated as
    // new and skipping its dependents, so a sibling read earlier stays undefined in that row.
    const toggle = rowChild('tgl1', 'toggle1', 'ToggleSwitch', { label: binding('t') });
    const mirror = rowChild('txt5', 'text5', 'Text', { text: binding('{{String(components.toggle1.value)}}') });
    await mount({
      properties: { data: binding('{{variables.rows ?? []}}') },
      extraComponents: { tgl1: toggle, txt5: mirror },
      defaultExtraComponents: false,
    });

    await widget.session.store.act(() => {
      store().setVariable('rows', [{ text: 'a' }, { text: 'b' }], MODULE_ID);
    });

    const mirrors = () => [...document.querySelectorAll('.ele-txt5')].map((node) => node.textContent.trim());
    await waitFor(() => expect(mirrors()).toEqual(['false', 'false']));
  });
});

describe('Listview: renaming a row child', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-BUG-050] data and children follow a renamed row child', async () => {
    // Break this catches: a rename that changes the definition but never re-derives the published
    // rows, so `data` keeps the old name and a binding to the new one reads nothing.
    await mount();
    await waitFor(() => expect(exposed('data')?.[0]?.text1).toBeDefined());

    await widget.session.store.act(() => {
      store().setComponentName('txt1', 'caption', MODULE_ID);
    });

    await waitFor(() => expect(Object.keys(exposed('data')[0])).toContain('caption'));
    expect(Object.keys(exposed('data')[0])).not.toContain('text1');
    expect(Object.keys(exposed('children')[2])).toContain('caption');
  });
});

describe('Listview: one drop is one undo', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-BUG-051] one Undo removes, and one Redo restores, every component a single drop added', async () => {
    // Break this catches: an undo entry per added component, so one Undo after dropping a widget
    // with children removes only the last child and leaves the rest on the canvas.
    await mount();
    await waitFor(() => expect(rows()).toHaveLength(3));
    const box = rowChild('cont6', 'container6', 'Container', {});
    const inside = rowChild('txt6', 'text6', 'Text', { text: binding('in') });
    inside.component.parent = 'cont6';

    await widget.session.store.act(() => {
      store().addComponentToCurrentPage([box, inside], MODULE_ID, { saveAfterAction: false });
    });
    await waitFor(() => expect(store().getCurrentPageComponents(MODULE_ID).txt6).toBeDefined());

    await widget.session.store.act(() => {
      store().handleUndo();
    });

    const remaining = Object.keys(store().getCurrentPageComponents(MODULE_ID));
    expect(remaining).not.toContain('cont6');
    expect(remaining).not.toContain('txt6');
    expect(remaining).toContain('txt1');

    await widget.session.store.act(() => {
      store().handleRedo();
    });

    const restored = Object.keys(store().getCurrentPageComponents(MODULE_ID));
    expect(restored).toEqual(expect.arrayContaining(['cont6', 'txt6']));
  });
});

describe('Listview: a list of plain values', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test.each([
    ['{{"v=" + listItem}}', ['v=x', 'v=y']],
    ['{{String(listItem)}}', ['x', 'y']],
  ])('[Listview-BUG-053] %s shows each row s value', async (expression, expected) => {
    // Break this catches: the listItem dependency check missing a reference followed by `}` or `)`,
    // so the row never resolves against its record and renders blank.
    await mount({
      properties: { data: binding('{{["x", "y"]}}') },
      extraComponents: { txt1: rowChild('txt1', 'text1', 'Text', { text: binding(expression) }) },
    });

    await waitFor(() => expect(rowTexts()).toEqual(expected));
  });
});

describe('Listview: only the first row of every list is editable', () => {
  beforeEach(nestedWidget.setup);
  afterEach(nestedWidget.teardown);

  test('[Listview-BUG-046] an inner list in outer row 2 is not editable in the builder', async () => {
    // Break this catches: the lock checking the inner row number alone, so the inner list's first
    // row in every outer row is editable and a child can be dragged out of a copy.
    nestedWidget.render({ currentMode: 'edit' });
    await waitFor(() => expect(document.querySelectorAll('.ele-txt2')).toHaveLength(4));

    const editable = [...document.querySelectorAll('.ele-txt2')].map((node) => node.classList.contains('moveable-box'));

    expect(editable).toEqual([true, false, false, false]);
  });
});

describe('Listview: a Container in a later row is not editable', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-BUG-046] a child of a Container in row 2 or 3 is not editable in the builder', async () => {
    // Break this catches: the lock applying only to the row canvas, so a Container's canvas inside a
    // copied row still lets its child be selected and dragged.
    const contained = rowChild('txt8', 'text8', 'Text', { text: binding('In box') });
    contained.component.parent = 'cont8';
    widget.render({
      currentMode: 'edit',
      extraComponents: { cont8: rowChild('cont8', 'container8', 'Container', {}), txt8: contained },
    });
    await waitFor(() => expect(document.querySelectorAll('.ele-txt8')).toHaveLength(3));

    const editable = [...document.querySelectorAll('.ele-txt8')].map((node) => node.classList.contains('moveable-box'));

    expect(editable).toEqual([true, false, false]);
  });
});

describe('Listview: a Container header inside a row', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  // A real id: slot children are filed under `<uuid>-header`, and only a uuid is stripped back to its base.
  const BOX = '9c9c9c9c-0000-4000-8000-000000000009';

  test('[Listview-BUG-047] the Container body reads the header input of its own row', async () => {
    // Break this catches: the row overlay collecting a Container's body children OR its header
    // children, never both, so a header child stays a per-row array and every body read is empty.
    const box = rowChild(BOX, 'container9', 'Container', { showHeader: binding('{{true}}') });
    const headerInput = rowChild('inp9', 'textinput9', 'TextInput', {
      label: binding(''),
      value: binding('{{listItem.text}}'),
    });
    headerInput.component.parent = `${BOX}-header`;
    const bodyMirror = rowChild('txt9', 'text9', 'Text', { text: binding('H={{components.textinput9.value}}') });
    bodyMirror.component.parent = BOX;
    await mount({ extraComponents: { [BOX]: box, inp9: headerInput, txt9: bodyMirror } });

    const mirrors = () => [...document.querySelectorAll('.ele-txt9')].map((node) => node.textContent.trim());
    await waitFor(() => expect(mirrors()).toEqual(['H=Alpha', 'H=Beta', 'H=Gamma']));
  });

  test('[Listview-BUG-047] a header input is published in the list s data and children', async () => {
    // Break this catches: the published rows walking only a Container's body, so a header child is
    // missing from `data` and `children` and every documented row action on it throws.
    const box = rowChild(BOX, 'container9', 'Container', { showHeader: binding('{{true}}') });
    const headerInput = rowChild('inp9', 'textinput9', 'TextInput', {
      label: binding(''),
      value: binding('{{listItem.text}}'),
    });
    headerInput.component.parent = `${BOX}-header`;
    await mount({ extraComponents: { [BOX]: box, inp9: headerInput } });
    await waitFor(() => expect(rows()).toHaveLength(3));

    await waitFor(() => expect(exposed('data')?.[1]?.textinput9?.value).toBe('Beta'));
    expect(typeof exposed('children')[1].textinput9.setText).toBe('function');
  });
});

const buttonsNamed = (label) => [...document.querySelectorAll('button')].filter((node) => node.textContent === label);
// The wrapper, not the widget, is what collapses a hidden child out of the row in the viewer.
const wrapperShown = (targetId) =>
  [...document.querySelectorAll(`.ele-${targetId}`)].map((node) => node.style.display !== 'none');

const hideTargetOnClick = (sourceId, targetId) => ({
  id: 'evt-disable',
  index: 0,
  sourceId,
  name: 'evt-disable',
  target: 'component',
  event: {
    eventId: 'onClick',
    actionId: 'control-component',
    componentId: targetId,
    componentSpecificActionHandle: 'setVisibility',
    componentSpecificActionParams: [{ handle: 'disable', value: '{{false}}' }],
  },
});

/**
 * A row child behind a Form or a Container is still stored per row. The wrapper that applies
 * Set visibility, Set disable and Set loading has to read the copy in the child's own row.
 */
describe('Listview: Set visibility on a row child behind a wrapper', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  const wrapper = (id, name, type, properties) => rowChild(id, name, type, properties);
  const targetIn = (parentId) => {
    const definition = rowChild('btn7', 'button7', 'Button', { text: binding('Target') });
    definition.component.parent = parentId;
    return definition;
  };
  const GO = () => rowChild('btn6', 'button6', 'Button', { text: binding('Go') });

  test('[Listview-BUG-045] a target inside the row s Container is hidden in the clicked row only', async () => {
    // Break this catches: the wrapper reading the Container child's state from row 0.
    await mount({
      extraComponents: { cont7: wrapper('cont7', 'container7', 'Container', {}), btn7: targetIn('cont7'), btn6: GO() },
      events: [hideTargetOnClick('btn6', 'btn7')],
    });
    await waitFor(() => expect(buttonsNamed('Target')).toHaveLength(3));

    await user().click(buttonsNamed('Go')[1]);

    await waitFor(() => expect(wrapperShown('btn7')).toEqual([true, false, true]));
  });

  test('[Listview-BUG-045] a target inside the row s Form is hidden in the clicked row only', async () => {
    // Break this catches: the wrapper reading the row 0 Form's copy of its child.
    await mount({
      extraComponents: {
        frm7: wrapper('frm7', 'form7', 'Form', { advanced: binding('{{false}}') }),
        btn7: targetIn('frm7'),
        btn6: GO(),
      },
      events: [hideTargetOnClick('btn6', 'btn7')],
    });
    await waitFor(() => expect(buttonsNamed('Target')).toHaveLength(3));

    await user().click(buttonsNamed('Go')[1]);

    await waitFor(() => expect(wrapperShown('btn7')).toEqual([true, false, true]));
  });
});

describe('Listview: rendering records', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-DATA-001] renders one row per record, in order', async () => {
    // Break this catches: rendering the template once instead of per record, or
    // reordering the rows away from the data's own order.
    await mount();

    await waitFor(() => expect(rows()).toHaveLength(3));
    expect(rowTexts()).toEqual(['Alpha', 'Beta', 'Gamma']);
  });

  test('[Listview-DATA-002] a `{{listItem.x}}` binding resolves to its own row s record', async () => {
    // Break this catches: the row-scope regression family — every row showing
    // the FIRST record's value, or `undefined`, because the per-row resolvable
    // was not scoped to the row being rendered.
    await mount({
      properties: { data: binding(`{{[{ text: 'first' }, { text: 'second' }]}}`) },
    });

    await waitFor(() => expect(rows()).toHaveLength(2));
    expect(rows()[0].textContent).toBe('first');
    expect(rows()[1].textContent).toBe('second');
  });

  test('[Listview-DATA-003] publishes each row s child values as `data`, keyed by row index and component name', async () => {
    // Break this catches: publishing a flat (non-per-row) shape, which is what
    // `{{components.listview1.data["0"].text1.text}}` in the docs reads.
    await mount();
    await waitFor(() => expect(rows()).toHaveLength(3));

    await waitFor(() => expect(exposed('data')?.[0]?.text1?.text).toBe('Alpha'));
    expect(exposed('data')[1].text1.text).toBe('Beta');
    expect(exposed('data')[2].text1.text).toBe('Gamma');
  });

  test('[Listview-DATA-004] publishes each row s child components, with their actions, as `children`', async () => {
    // Break this catches: dropping the per-row `children` publication, which is
    // the ONLY way an app can control a component inside a row — the widget
    // registers no CSAs of its own.
    await mount();
    await waitFor(() => expect(rows()).toHaveLength(3));

    await waitFor(() => expect(exposed('children')?.[0]?.text1).toBeDefined());
    expect(exposed('children')[0].text1.text).toBe('Alpha');
    expect(typeof exposed('children')[0].text1.setText).toBe('function');
    expect(typeof exposed('children')[2].text1.setVisibility).toBe('function');
  });

  test('[Listview-DATA-005] an empty data array renders no rows and no error', async () => {
    // Break this catches: rendering a phantom row for an empty result set, or
    // throwing while a query has returned nothing.
    await mount({ properties: { data: binding('{{[]}}') } });

    expect(rows()).toHaveLength(0);
    expect(container()).toBeInTheDocument();
  });

  test('[Listview-DATA-006] data that is not an array renders no rows and no error', async () => {
    // Break this catches: removing the isArray guard, so a still-loading query
    // binding (null/undefined/an object) crashes the canvas.
    await mount({ properties: { data: binding('{{null}}') } });

    expect(rows()).toHaveLength(0);
    expect(container()).toBeInTheDocument();
  });

  test('[Listview-DATA-007] rebinding the data re-renders the rows and re-resolves every row binding', async () => {
    // Break this catches: a stale diff guard around updateCustomResolvables, so
    // refreshed query results leave rows bound to the previous records.
    await mount();
    await waitFor(() => expect(rows()).toHaveLength(3));

    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'data', `{{[{ text: 'Delta' }, { text: 'Epsilon' }]}}`, 'properties');
    });

    await waitFor(() => expect(rows()).toHaveLength(2));
    expect(rowTexts()).toEqual(['Delta', 'Epsilon']);
  });

  test('[Listview-DATA-008] a non-rawJson data source uses the selector s own value as the list data', async () => {
    // Break this catches: always reading `properties.data`, which would render
    // the Raw JSON sample instead of the selected query's rows.
    await mount({
      properties: { dataSourceSelector: binding(`{{[{ text: 'FromQuery' }, { text: 'AlsoQuery' }]}}`) },
    });

    await waitFor(() => expect(rows()).toHaveLength(2));
    expect(rowTexts()).toEqual(['FromQuery', 'AlsoQuery']);
  });
});

describe('Listview: row layout', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-ROW-001] Row height applies the configured height to every row', async () => {
    // Break this catches: reading the height from the wrong property, which
    // silently collapses or stretches every row of every list.
    await mount({ properties: { rowHeight: binding('{{60}}') } });

    await waitFor(() => expect(rows()).toHaveLength(3));
    expect(rows()[0].style.height).toBe('60px');
    expect(rows()[2].style.height).toBe('60px');
  });

  test('[Listview-ROW-002] Grid mode divides the row width by the configured column count', async () => {
    // Break this catches: the grid-mode arithmetic — a wrong divisor puts the
    // wrong number of cards per line for every grid list.
    await mount({ properties: { mode: binding('grid'), columns: binding('{{2}}') } });

    await waitFor(() => expect(rows()).toHaveLength(3));
    expect(rows()[0].style.width).toBe('50%');
  });

  test('[Listview-ROW-003] a column count below 1 is clamped to a single column', async () => {
    // Break this catches: removing the clamp, so a binding that resolves to 0
    // divides by zero and renders zero-width (invisible) rows.
    await mount({ properties: { mode: binding('grid'), columns: binding('{{0}}') } });

    await waitFor(() => expect(rows()).toHaveLength(3));
    expect(rows()[0].style.width).toBe('100%');
  });
});

describe('Listview: record clicks', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-EVT-001] clicking a row fires Record clicked once', async () => {
    // Break this catches: a second path into fireEvent('onRecordClicked') — the
    // row wrapper and the canvas below it both see the click — which would
    // double-run a builder's query.
    await mount({ events: BOTH_EVENTS });
    await waitFor(() => expect(rows()).toHaveLength(3));

    await user().click(rows()[1]);

    await waitFor(() => expect(fired('rec')).toBe(1));
  });

  test('[Listview-EVT-002] clicking a row also fires the deprecated Row clicked once', async () => {
    // Break this catches: dropping the deprecated event, which silently stops
    // every app still wired to Row clicked.
    await mount({ events: BOTH_EVENTS });
    await waitFor(() => expect(rows()).toHaveLength(3));

    await user().click(rows()[1]);

    await waitFor(() => expect(fired('row')).toBe(1));
    expect(fired('rec')).toBe(1);
  });

  test('[Listview-EVT-003] clicking a component inside a row registers the record click for that row', async () => {
    // Break this catches: the row-click routing regression — an interaction
    // with a child reporting the wrong record, or no record at all.
    await mount({ events: BOTH_EVENTS });
    await waitFor(() => expect(rows()).toHaveLength(3));

    const childInSecondRow = rows()[1].querySelector('[data-cy*="text1"]') ?? rows()[1].firstElementChild;
    await user().click(childInSecondRow);

    await waitFor(() => expect(fired('rec')).toBe(1));
    expect(exposed('selectedRecordId')).toBe(1);
  });

  test('[Listview-SEL-001] a record click publishes `selectedRecordId` and `selectedRecord`', async () => {
    // Break this catches: publishing the row's raw record instead of its child
    // values, or an index that is off by one.
    await mount();
    await waitFor(() => expect(rows()).toHaveLength(3));

    await user().click(rows()[2]);

    await waitFor(() => expect(exposed('selectedRecordId')).toBe(2));
    expect(exposed('selectedRecord')?.text1?.text).toBe('Gamma');
  });

  test('[Listview-SEL-002] the deprecated `selectedRowId`/`selectedRow` mirror the new variables', async () => {
    // Break this catches: updating only the new pair, which silently breaks
    // apps reading the deprecated ones.
    await mount();
    await waitFor(() => expect(rows()).toHaveLength(3));

    await user().click(rows()[1]);

    await waitFor(() => expect(exposed('selectedRowId')).toBe(1));
    expect(exposed('selectedRowId')).toBe(exposed('selectedRecordId'));
    expect(exposed('selectedRow')).toEqual(exposed('selectedRecord'));
  });
});

describe('Listview: pagination', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-PAGE-001] pagination renders only the configured number of rows per page', async () => {
    // Break this catches: an off-by-one in the slice window, or rendering the
    // whole data set while showing a pager.
    await mount({ properties: { enablePagination: binding('{{true}}'), rowsPerPage: binding('{{2}}') } });

    await waitFor(() => expect(rows()).toHaveLength(2));
    expect(rowTexts()).toEqual(['Alpha', 'Beta']);
    expect(pager()).toBeTruthy();
  });

  test('[Listview-PAGE-002] moving to the next page shows the next slice and reports the index within that page', async () => {
    // Break this catches: a slice window that does not advance with the page,
    // and pins that `selectedRecordId` is the index WITHIN the rendered page.
    await mount({
      properties: { enablePagination: binding('{{true}}'), rowsPerPage: binding('{{2}}') },
      events: BOTH_EVENTS,
    });
    await waitFor(() => expect(rows()).toHaveLength(2));

    await user().click(document.querySelector('[data-cy="next-page-link"]'));

    await waitFor(() => expect(rowTexts()).toEqual(['Gamma']));

    await user().click(rows()[0]);

    await waitFor(() => expect(exposed('selectedRecordId')).toBe(0));
    expect(exposed('selectedRecord')?.text1?.text).toBe('Gamma');
  });

  test('[Listview-PAGE-003] an invalid rows-per-page falls back to ten', async () => {
    // Break this catches: dropping the fallback, so a binding that resolves to
    // 0 renders an empty list with a pager that can never reach the records.
    await mount({ properties: { enablePagination: binding('{{true}}'), rowsPerPage: binding('{{0}}') } });

    await waitFor(() => expect(rows()).toHaveLength(3));
  });

  test('[Listview-PAGE-004] with pagination off every record renders and no pager is shown', async () => {
    // Break this catches: rendering the pager (and its slice) regardless of the
    // property, which would silently truncate long lists.
    await mount({ properties: { enablePagination: binding('{{false}}'), rowsPerPage: binding('{{2}}') } });

    await waitFor(() => expect(rows()).toHaveLength(3));
    expect(pager()).toBeFalsy();
  });

  test('[Listview-PAGE-005] shrinking the data below the current page still renders the records that remain', async () => {
    // Break this catches: leaving the view on a page index the data no longer
    // reaches, which strands the user on a blank page after a query refresh.
    await mount({ properties: { enablePagination: binding('{{true}}'), rowsPerPage: binding('{{2}}') } });
    await waitFor(() => expect(rows()).toHaveLength(2));
    await user().click(document.querySelector('[data-cy="next-page-link"]'));
    await waitFor(() => expect(rowTexts()).toEqual(['Gamma']));

    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'data', `{{[{ text: 'OnlyOne' }]}}`, 'properties');
    });

    await waitFor(() => expect(rowTexts()).toEqual(['OnlyOne']));
  });
});

describe('Listview: loading, visibility and disabled', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-STATE-001] Loading state replaces the rows with a spinner', async () => {
    // Break this catches: rendering the spinner BESIDE the rows, which would
    // mount every child component against stale data while a query is running.
    await mount({ properties: { loadingState: binding('{{true}}') } });

    expect(rows()).toHaveLength(0);
    expect(spinner()).toBeTruthy();
  });

  test('[Listview-STATE-002] Visibility off hides the list', async () => {
    // Break this catches: leaving a "hidden" list on screen and clickable.
    await mount({ properties: { visibility: binding('{{false}}') } });

    expect(container()).toHaveStyle({ display: 'none' });
  });

  test('[Listview-STATE-003] Disable marks the list disabled and inert', async () => {
    // Break this catches: dropping the `inert` property (the mechanism that
    // takes every row out of the tab order and blocks pointer input in a
    // browser) or the `data-disabled` marker styling depends on. Whether the
    // browser then actually blocks the interaction is Listview-BRW-003.
    await mount({ properties: { disabledState: binding('{{true}}') } });

    expect(container()).toHaveAttribute('data-disabled', 'true');
    expect(container().inert).toBe(true);
  });
});

describe('Listview: styles', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-STYLE-001] background, border colour and border radius apply to the list container', async () => {
    // Break this catches: reading any of the three from the wrong style key, so
    // a themed list renders with defaults.
    await mount({
      styles: {
        backgroundColor: binding('rgb(1, 2, 3)'),
        borderColor: binding('rgb(4, 5, 6)'),
        borderRadius: binding('{{12}}'),
      },
    });

    expect(container().style.backgroundColor).toBe('rgb(1, 2, 3)');
    expect(container().style.borderColor).toBe('rgb(4, 5, 6)');
    expect(container().style.borderRadius).toBe('12px');
  });

  test('[Listview-STYLE-002] a legacy white background becomes the dark surface in dark mode', async () => {
    // Break this catches: dropping the shim, which puts a white block in the
    // middle of every dark-mode app saved before custom themes.
    await mount({ styles: { backgroundColor: binding('#fff') }, darkMode: true });

    expect(container().style.backgroundColor).toBe('rgb(35, 46, 60)');
  });
});

describe('Listview: compatibility', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-COMPAT-001] a definition predating pagination, dynamic height and mode still renders its rows', async () => {
    // Break this catches: treating any of the newer keys as required, which
    // would break every list saved before they existed.
    legacyWidget.setup();
    legacyWidget.render({ currentMode: 'view' });
    await waitFor(() => expect(container()).toBeInTheDocument());

    await waitFor(() => expect(rows()).toHaveLength(3));
    expect(rowTexts()).toEqual(['Alpha', 'Beta', 'Gamma']);

    await legacyWidget.session.user.click(rows()[1]);

    await waitFor(() => expect(legacyWidget.exposed()?.selectedRecordId).toBe(1));
    legacyWidget.teardown();
  });
});

/**
 * A definition saved before `enablePagination`/`rowsPerPage`/`dynamicHeight`/
 * `mode`/`columns`/`showBorder` existed: those keys are ABSENT, not falsy.
 */
const legacyWidget = createWidgetHarness({
  componentType: 'Listview',
  handle: NAME,
  id: ID,
  defaultProperties: {
    dataSourceSelector: binding('rawJson'),
    data: binding(THREE_RECORDS),
    rowHeight: binding('100'),
    loadingState: binding('{{false}}'),
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
  },
  defaultStyles: {
    backgroundColor: binding('var(--cc-surface1-surface)'),
    borderColor: binding('var(--cc-weak-border)'),
  },
  defaultExtraComponents: { txt1: TEXT_CHILD() },
  capabilities: { dnd: true },
  widgetHeight: 450,
  widgetWidth: 600,
});

/**
 * A wrapper built on the canvas and then dragged into a row. The wrapper moves in the tree, but
 * only the dragged component itself is re-resolved — its children keep whatever scope they had.
 */
describe('Listview: a populated wrapper dragged into a row', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  const OUTSIDE = (type, extra = {}) => {
    const definition = componentDefinition('wrap1', 'wrapper1', type, {
      visibility: binding('{{true}}'),
      loadingState: binding('{{false}}'),
      disabledState: binding('{{false}}'),
      ...extra,
    });
    definition.component.parent = null;
    definition.component.definition.styles = {};
    definition.component.definition.others = {
      showOnDesktop: binding('{{true}}'),
      showOnMobile: binding('{{false}}'),
    };
    return definition;
  };

  const NESTED_TEXT = () => {
    const definition = componentDefinition('nested1', 'nested1', 'Text', { text: binding('IN-{{listItem.text}}') });
    definition.component.parent = 'wrap1';
    definition.component.definition.styles = {};
    definition.component.definition.others = {
      showOnDesktop: binding('{{true}}'),
      showOnMobile: binding('{{false}}'),
    };
    return definition;
  };

  const nestedLabels = () =>
    [...document.querySelectorAll('*')]
      .filter((node) => node.childElementCount === 0 && node.textContent.startsWith('IN-'))
      .map((node) => node.textContent);

  /** The drag's own action: Grid.jsx calls setComponentLayout with updateParent when the parent changes. */
  async function dragIntoList() {
    await widget.session.store.act(() => {
      store().setComponentLayout({ wrap1: { width: 20, height: 200, top: 0, left: 0 } }, ID, MODULE_ID, {
        updateParent: true,
        saveAfterAction: false,
      });
    });
  }

  test('[Listview-BUG-013] a Container dragged in keeps its child, resolved per row', async () => {
    // Break this catches: re-resolving only the dragged component, so the child it carries keeps a
    // flat entry while the row expects one per row, and renders nothing.
    await mount({ extraComponents: { wrap1: OUTSIDE('Container'), nested1: NESTED_TEXT() } });
    await waitFor(() => expect(rows()).toHaveLength(3));

    await dragIntoList();

    await waitFor(() => expect(nestedLabels()).toEqual(['IN-Alpha', 'IN-Beta', 'IN-Gamma']));
  });

  test('[Listview-BUG-013] a Form dragged in keeps its child, resolved per row', async () => {
    // Break this catches: a fix written against Container only. Form carries its children the same
    // way, and the QA report that found this used a Form.
    await mount({
      extraComponents: { wrap1: OUTSIDE('Form', { advanced: binding('{{false}}') }), nested1: NESTED_TEXT() },
    });
    await waitFor(() => expect(rows()).toHaveLength(3));

    await dragIntoList();

    await waitFor(() => expect(nestedLabels()).toEqual(['IN-Alpha', 'IN-Beta', 'IN-Gamma']));
  });
});

/**
 * `children` and `data` are the documented way to reach a row's components from a query. The row's
 * per-row slots are already prepared for everything inside it, wrappers included — publishing has
 * to agree with that, or a component you can see on the canvas has no entry to call.
 */
describe('Listview: children reaches inside a row wrapper', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  const WRAPPER = () => {
    const definition = componentDefinition('cont9', 'container9', 'Container', {});
    definition.component.parent = ID;
    definition.component.definition.styles = {};
    definition.component.definition.others = {
      showOnDesktop: binding('{{true}}'),
      showOnMobile: binding('{{false}}'),
    };
    return definition;
  };

  const WRAPPED_BUTTON = () => {
    const definition = componentDefinition('btn9', 'button9', 'Button', {
      text: binding('{{listItem.text}}'),
      visibility: binding('{{true}}'),
      loadingState: binding('{{false}}'),
      disabledState: binding('{{false}}'),
    });
    definition.component.parent = 'cont9';
    definition.component.definition.styles = {};
    definition.component.definition.others = {
      showOnDesktop: binding('{{true}}'),
      showOnMobile: binding('{{false}}'),
    };
    return definition;
  };

  test('[Listview-BUG-015] a component behind a Container is published in children and data', async () => {
    // Break this catches: publishing only the row's direct children, so a component inside a
    // Container is absent from `children` and every documented action on it throws.
    await mount({ extraComponents: { cont9: WRAPPER(), btn9: WRAPPED_BUTTON() } });
    await waitFor(() => expect(rows()).toHaveLength(3));

    await waitFor(() => expect(exposed('children')?.[0]?.button9).toBeDefined());
    expect(exposed('children')[0].container9).toBeDefined();
    expect(typeof exposed('children')[0].button9.setDisable).toBe('function');
    expect(exposed('data')[0].button9.buttonText).toBe('Alpha');
    expect(exposed('data')[2].button9.buttonText).toBe('Gamma');
  });
});

/**
 * A Modal opened from a row renders outside the row in the DOM, but React still routes its events
 * through the component tree — so the row hears every click inside the modal as its own.
 */
describe('Listview: a Modal opened from a row', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  const MODAL_CHILD = () => {
    const definition = componentDefinition('mod1', 'modal1', 'ModalV2', {});
    definition.component.parent = ID;
    definition.component.definition.others = {
      showOnDesktop: binding('{{true}}'),
      showOnMobile: binding('{{false}}'),
    };
    return definition;
  };

  const trigger = () => [...document.querySelectorAll('button')].find((node) => /launch/i.test(node.textContent));
  const modalBody = () => document.querySelector('.modal-body') ?? document.querySelector('[class*="modal"]');

  test('[Listview-BUG-016] clicking inside the Modal does not fire Record clicked again', async () => {
    // Break this catches: the row handler accepting any click React routes through it, including
    // one from portaled content that never happened inside the row's own element.
    await mount({ events: [counting('onRecordClicked', 'rec')], extraComponents: { mod1: MODAL_CHILD() } });
    await waitFor(() => expect(rows()).toHaveLength(3));

    await user().click(rows()[0]);
    await waitFor(() => expect(fired('rec')).toBe(1));

    await user().click(trigger());
    await waitFor(() => expect(document.querySelector('[role="dialog"], .modal-content')).toBeTruthy());
    const afterOpening = fired('rec');

    const inside = document.querySelector('[role="dialog"], .modal-content');
    await user().click(inside);
    await user().click(inside);

    expect(fired('rec')).toBe(afterOpening);
  });

  test('[Listview-BUG-016] clicking the row s Modal open button fires Record clicked once', async () => {
    // Break this catches: the row hearing clicks only as they bubble, so a child that stops
    // propagation (the Modal open button does) silently drops the record event (D-13).
    await mount({ events: [counting('onRecordClicked', 'rec')], extraComponents: { mod1: MODAL_CHILD() } });
    await waitFor(() => expect(rows()).toHaveLength(3));

    await user().click(trigger());

    await waitFor(() => expect(fired('rec')).toBe(1));
    expect(exposed('selectedRecordId')).toBe(0);
  });
});

/**
 * An input repeated down the rows must still be addressable one row at a time: a DOM id is unique
 * per document, and a label points at exactly one of them.
 */
describe('Listview: a labelled input repeated down the rows', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  const LABELLED_INPUT = () => {
    const definition = componentDefinition('inp1', 'textinput1', 'TextInput', { label: binding('Name') });
    definition.component.parent = ID;
    definition.component.definition.others = {
      showOnDesktop: binding('{{true}}'),
      showOnMobile: binding('{{false}}'),
    };
    return definition;
  };

  const inputs = () => [...document.querySelectorAll('input[type="text"]')];

  test('[Listview-BUG-017] each row gets its own input id so a label points at its own row', async () => {
    // Break this catches: every row's input carrying the same id, so all three labels resolve to the
    // first input and clicking row 3's label focuses row 1's.
    await mount({ extraComponents: { inp1: LABELLED_INPUT() } });
    await waitFor(() => expect(rows()).toHaveLength(3));
    await waitFor(() => expect(inputs()).toHaveLength(3));

    const ids = inputs().map((node) => node.id);
    expect(new Set(ids).size).toBe(3);

    const labels = [...document.querySelectorAll('label')].filter((node) => node.htmlFor);
    expect(labels).toHaveLength(3);
    expect(labels.map((node) => node.htmlFor)).toEqual(ids);
  });
});

/**
 * The pager is the only way to reach later records, so it has to be reachable without a mouse and
 * announce what it does.
 */
describe('Listview: the pager is operable without a mouse', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  const arrows = () => ({
    previous: document.querySelector('[data-cy="previous-page-link"]'),
    next: document.querySelector('[data-cy="next-page-link"]'),
  });

  test('[Listview-BUG-018] the page arrows are focusable and carry a name', async () => {
    // Break this catches: arrows rendered as an anchor with no href and an icon for content — the
    // browser skips them on Tab and a screen reader has nothing to announce.
    await mount({ properties: { enablePagination: binding('{{true}}'), rowsPerPage: binding('{{2}}') } });
    await waitFor(() => expect(arrows().next).toBeTruthy());

    Object.values(arrows()).forEach((arrow) => {
      expect(arrow.tabIndex).toBeGreaterThanOrEqual(0);
      expect(arrow.getAttribute('aria-label')).toBeTruthy();
    });
  });

  test('[Listview-BUG-018] Enter on the next arrow turns the page', async () => {
    // Break this catches: making the arrows focusable without making them act — a focusable element
    // that only answers to a mouse click is worse than one that is skipped.
    await mount({ properties: { enablePagination: binding('{{true}}'), rowsPerPage: binding('{{2}}') } });
    await waitFor(() => expect(rows()).toHaveLength(2));

    arrows().next.focus();
    await user().keyboard('{Enter}');

    await waitFor(() => expect(rowTexts()).toEqual(['Gamma']));
  });

  test('[Listview-BUG-037] Enter on a greyed-out arrow leaves the page where it is', async () => {
    // Break this catches: the keyboard path skipping the disabled check the mouse gets from CSS, so
    // Previous on page one or Next on the last page walks off the end of the list.
    await mount({ properties: { enablePagination: binding('{{true}}'), rowsPerPage: binding('{{2}}') } });
    await waitFor(() => expect(rowTexts()).toEqual(['Alpha', 'Beta']));
    const footer = () => document.querySelector('[data-cy="container-pagination"] p').textContent;

    arrows().previous.focus();
    await user().keyboard('{Enter}');
    expect(rowTexts()).toEqual(['Alpha', 'Beta']);
    expect(footer()).toBe('Showing 1 to 2 of 3');

    await user().click(arrows().next);
    await waitFor(() => expect(rowTexts()).toEqual(['Gamma']));
    arrows().next.focus();
    await user().keyboard('{Enter}');
    expect(rowTexts()).toEqual(['Gamma']);
    expect(footer()).toBe('Showing 3 to 3 of 3');
  });
});

/**
 * A Control component action names a component, which exists once but draws once per row. The row
 * the event came from is the only thing that says which copy it meant.
 */
describe('Listview: Control component from a row event', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  const INPUT_CHILD = () => {
    const definition = componentDefinition('inp2', 'textinput2', 'TextInput', { label: binding('') });
    definition.component.parent = ID;
    definition.component.definition.others = {
      showOnDesktop: binding('{{true}}'),
      showOnMobile: binding('{{false}}'),
    };
    return definition;
  };

  const setTextOnClick = {
    id: 'evt-control',
    index: 0,
    sourceId: ID,
    name: 'evt-control',
    target: 'component',
    event: {
      eventId: 'onRecordClicked',
      actionId: 'control-component',
      componentId: 'inp2',
      componentSpecificActionHandle: 'setText',
      componentSpecificActionParams: [{ handle: 'text', value: 'picked' }],
    },
  };

  const inputValues = () => [...document.querySelectorAll('input[type="text"]')].map((node) => node.value);

  const FORM_WRAPPER = () => {
    const definition = componentDefinition('frm2', 'form2', 'Form', { advanced: binding('{{false}}') });
    definition.component.parent = ID;
    definition.component.definition.others = {
      showOnDesktop: binding('{{true}}'),
      showOnMobile: binding('{{false}}'),
    };
    return definition;
  };

  const INPUT_IN_FORM = () => {
    const definition = INPUT_CHILD();
    definition.component.parent = 'frm2';
    return definition;
  };

  test('[Listview-BUG-019] Set text reaches an input inside the row s Form', async () => {
    // Break this catches: a fix that only handles a direct child. QA reported the Form case
    // separately, and a Form resolves its children through its own exposed values.
    await mount({ extraComponents: { frm2: FORM_WRAPPER(), inp2: INPUT_IN_FORM() }, events: [setTextOnClick] });
    await waitFor(() => expect(inputValues()).toHaveLength(3));

    await user().click(rows()[2]);

    await waitFor(() => expect(inputValues()).toEqual(['', '', 'picked']));
  });

  test('[Listview-BUG-019] Set text lands on the row that was clicked', async () => {
    // Break this catches: firing a row event without the row, so the action resolves the component
    // to its first copy and every click writes into row 1.
    await mount({ extraComponents: { inp2: INPUT_CHILD() }, events: [setTextOnClick] });
    await waitFor(() => expect(inputValues()).toHaveLength(3));

    await user().click(rows()[2]);

    await waitFor(() => expect(inputValues()).toEqual(['', '', 'picked']));
  });
});

/**
 * An event field such as an alert message or a variable value reads a sibling by name, and that
 * name is stored once per row. The row the event fired from says which copy it means (D-12).
 */
describe('Listview: event fields read the row that fired the event', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  const INPUT_CHILD = () => rowChild('inp3', 'textinput3', 'TextInput', { label: binding('') });
  const BUTTON_CHILD = () => rowChild('btn3', 'button3', 'Button', { text: binding('Go') });

  const onButtonClick = (event) => ({
    id: `evt-${event.actionId}`,
    index: 0,
    sourceId: 'btn3',
    name: `evt-${event.actionId}`,
    target: 'component',
    event: { eventId: 'onClick', ...event },
  });

  const inputs = () => [...document.querySelectorAll('input[type="text"]')];
  const buttons = () => [...document.querySelectorAll('button')].filter((node) => node.textContent === 'Go');

  async function typeInRowTwoAndClickItsButton() {
    await waitFor(() => expect(inputs()).toHaveLength(3));
    await user().type(inputs()[1], 'abc');
    await user().click(buttons()[1]);
  }

  test('[Listview-BUG-043] a variable value reads the sibling input of the clicked row', async () => {
    // Break this catches: the action resolver reading the per-row array, so `.value` is empty.
    await mount({
      extraComponents: { inp3: INPUT_CHILD(), btn3: BUTTON_CHILD() },
      events: [
        onButtonClick({ actionId: 'set-custom-variable', key: 'typed', value: '{{components.textinput3.value}}' }),
      ],
    });

    await typeInRowTwoAndClickItsButton();

    await waitFor(() => expect(store().getVariable('typed', MODULE_ID)).toBe('abc'));
  });

  test('[Listview-BUG-043] Run only if reads the sibling input of the clicked row', async () => {
    // Break this catches: the row reaching the action fields but not the Run only if gate.
    await mount({
      extraComponents: { inp3: INPUT_CHILD(), btn3: BUTTON_CHILD() },
      events: [
        onButtonClick({
          actionId: 'set-custom-variable',
          key: 'gated',
          value: 'ran',
          runOnlyIf: "{{components.textinput3.value === 'abc'}}",
        }),
      ],
    });

    await typeInRowTwoAndClickItsButton();

    await waitFor(() => expect(store().getVariable('gated', MODULE_ID)).toBe('ran'));
  });
});

/**
 * Pagination state has to follow the data. A page number outlives the records it pointed at, and a
 * rows-per-page value the user typed can be a number the slice cannot use.
 */
describe('Listview: the pager follows the data', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  const manyRecords = (count, prefix) =>
    binding(`{{${JSON.stringify(Array.from({ length: count }, (_, index) => ({ text: `${prefix}${index}` })))}}}`);

  const paged = (records, perPage) => ({
    properties: {
      data: records,
      enablePagination: binding('{{true}}'),
      rowsPerPage: perPage,
    },
  });

  const activePage = () => document.querySelector('.page-item.active')?.textContent;

  test('[Listview-BUG-020] a new data set that still reaches the page opens on that page', async () => {
    // Break this catches: reading the page against the old records, so the new set shows stale rows
    // or a page past its own end. D-07 keeps the page number while the page exists.
    await mount(paged(manyRecords(30, 'a'), binding('{{10}}')));
    await waitFor(() => expect(rowTexts()[0]).toBe('a0'));

    await user().click(document.querySelector('[data-cy="next-page-link"]'));
    await user().click(document.querySelector('[data-cy="next-page-link"]'));
    await waitFor(() => expect(rowTexts()[0]).toBe('a20'));

    await widget.session.store.act(() => {
      widget.setComponentProperty(ID, 'data', manyRecords(25, 'b').value, 'properties');
    });

    await waitFor(() => expect(rowTexts()[0]).toBe('b20'));
    expect(activePage()).toBe('3');
  });

  test('[Listview-BUG-038] a record deleted on page three keeps the reader on page three', async () => {
    // Break this catches: resetting to page one on any change in record count, so every delete,
    // add or count-changing search throws the reader back to the start.
    await mount(paged(manyRecords(50, 'o'), binding('{{10}}')));
    await waitFor(() => expect(rowTexts()[0]).toBe('o0'));
    await user().click(document.querySelector('[data-cy="next-page-link"]'));
    await user().click(document.querySelector('[data-cy="next-page-link"]'));
    await waitFor(() => expect(rowTexts()[0]).toBe('o20'));

    await widget.session.store.act(() => {
      widget.setComponentProperty(ID, 'data', manyRecords(49, 'o').value, 'properties');
    });

    await waitFor(() => expect(document.querySelector('[data-cy="total-count"]').textContent).toBe('49'));
    expect(rowTexts()[0]).toBe('o20');
    expect(activePage()).toBe('3');
  });

  test('[Listview-BUG-038] a data set that no longer reaches the page lands on its last page', async () => {
    // Break this catches: keeping a page number past the new end, which renders an empty page.
    await mount(paged(manyRecords(50, 'p'), binding('{{10}}')));
    await waitFor(() => expect(rowTexts()[0]).toBe('p0'));
    await user().click(document.querySelector('[data-cy="last-page-link"]'));
    await waitFor(() => expect(rowTexts()[0]).toBe('p40'));

    await widget.session.store.act(() => {
      widget.setComponentProperty(ID, 'data', manyRecords(15, 'p').value, 'properties');
    });

    await waitFor(() => expect(rowTexts()).toEqual(['p10', 'p11', 'p12', 'p13', 'p14']));
    expect(activePage()).toBe('2');
  });

  test('[Listview-BUG-021] a negative rows-per-page falls back to ten', async () => {
    // Break this catches: only guarding zero and NaN. A negative passes the guard, the page count
    // goes negative, and the slice runs backwards and returns nothing.
    await mount(paged(manyRecords(12, 'c'), binding('{{-5}}')));

    await waitFor(() => expect(rows()).toHaveLength(10));
  });

  test('[Listview-BUG-021] a fractional rows-per-page gives every page the same size', async () => {
    // Break this catches: passing 2.5 to the slice, which lands on half a record and hands one page
    // two rows and the next three.
    await mount(paged(manyRecords(12, 'd'), binding('{{2.5}}')));
    await waitFor(() => expect(rows()).toHaveLength(2));

    await user().click(document.querySelector('[data-cy="next-page-link"]'));

    await waitFor(() => expect(rowTexts()).toEqual(['d2', 'd3']));
  });
});

/**
 * Two property values the inspector accepts but the widget misreads: a boolean typed without braces,
 * and a mode whose capitalisation matches neither branch that reads it.
 */
describe('Listview: property values the widget misreads', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  const resolvedProperties = () => store().getResolvedComponent(ID, null, MODULE_ID)?.properties;
  const rowShape = () => ({
    fullWidth: rows()[0].className.includes('w-100'),
    canvasGrid: rows()[0].querySelector('.real-canvas')?.style.backgroundSize,
  });

  test('[Listview-BUG-022] the word false, typed without braces, is false', async () => {
    // Break this catches: coercing a boolean property by truthiness, so the non-empty string
    // "false" becomes true and the setting does the opposite of what it says.
    // Asserted on the resolved value, not the border: jsdom drops a shorthand holding var(), so the
    // inline border style reads empty either way and cannot answer this.
    await mount({ properties: { showBorder: { value: 'false' } } });
    await waitFor(() => expect(rows()).toHaveLength(3));

    expect(resolvedProperties().showBorder).toBe(false);
  });

  test('[Listview-BUG-023] a Mode of "Grid" renders as grid, not half of each', async () => {
    // Break this catches: two places comparing mode against their own lower-case literal, so a
    // capitalised value matches neither and the row and its canvas pick different modes.
    await mount({ properties: { mode: binding('{{"grid"}}'), columns: binding('{{3}}') } });
    await waitFor(() => expect(rows()).toHaveLength(3));
    const lowercase = rowShape();

    await mount({ properties: { mode: binding('{{"Grid"}}'), columns: binding('{{3}}') } });
    await waitFor(() => expect(rows()).toHaveLength(3));

    expect(rowShape()).toEqual(lowercase);
  });
});

/**
 * A list of records should read as a list and be reachable without a mouse. Focus alone must not
 * count as a record click: an app wired to Record clicked would then run its query as someone tabs.
 */
describe('Listview: rows are reachable without a mouse', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-BUG-024] the list and its rows carry list semantics and take focus', async () => {
    // Break this catches: a row rendered as a plain div, which assistive tech reads as nothing and
    // the keyboard cannot reach at all.
    await mount();
    await waitFor(() => expect(rows()).toHaveLength(3));

    expect(container().closest('[role="list"]') ?? document.querySelector('[role="list"]')).toBeTruthy();
    rows().forEach((row) => {
      expect(row.getAttribute('role')).toBe('listitem');
      expect(row.tabIndex).toBeGreaterThanOrEqual(0);
    });

    rows()[2].focus();
    expect(document.activeElement).toBe(rows()[2]);
  });

  test('[Listview-BUG-024] Enter on a focused row selects that record', async () => {
    // Break this catches: making rows focusable without making them act, so a keyboard user can
    // land on a row and still not choose it.
    await mount({ events: [counting('onRecordClicked', 'rec')] });
    await waitFor(() => expect(rows()).toHaveLength(3));

    rows()[2].focus();
    await user().keyboard('{Enter}');

    await waitFor(() => expect(fired('rec')).toBe(1));
    expect(exposed('selectedRecordId')).toBe(2);
  });

  test('[Listview-BUG-024] focusing a row does not select it on its own', async () => {
    // Break this catches: treating focus as a click. An app wired to Record clicked would fire its
    // query as a keyboard user tabbed through the rows, writes included.
    await mount({ events: [counting('onRecordClicked', 'rec')] });
    await waitFor(() => expect(rows()).toHaveLength(3));

    rows()[2].focus();

    expect(fired('rec')).toBe(0);
  });
});

/**
 * A row's canvas has to leave the same room at its edges in both modes. Grid mode computed its own
 * width instead of asking the shared helper every other List View canvas uses.
 */
describe('Listview: a grid column fits inside the list', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  const rowCanvasWidth = () => rows()[0].querySelector('.real-canvas')?.style.backgroundSize;

  test('[Listview-BUG-028] a single grid column is exactly as wide as a list row', async () => {
    // Break this catches: grid mode subtracting a flat 2px from the raw width while every other
    // List View canvas subtracts the real padding, so each column runs ~21px past the right edge.
    await mount({ properties: { mode: binding('list') } });
    await waitFor(() => expect(rows()).toHaveLength(3));
    const listWidth = rowCanvasWidth();

    await mount({ properties: { mode: binding('grid'), columns: binding('{{1}}') } });
    await waitFor(() => expect(rows()).toHaveLength(3));

    expect(rowCanvasWidth()).toBe(listWidth);
  });
});

/**
 * A query that comes back empty must leave the list's published values empty too. Anything reading
 * `components.listview1.data` otherwise still sees the records that are no longer on screen.
 */
describe('Listview: emptying the data empties what the list publishes', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-BUG-030] rebinding the data to an empty array drops every published row', async () => {
    // Break this catches: running the row cleanup only when there are rows left, so the one case
    // that needs it most — no rows at all — is the case it is skipped for.
    await mount();
    await waitFor(() => expect(rows()).toHaveLength(3));
    expect(Object.keys(exposed('data'))).toHaveLength(3);

    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'data', `{{[]}}`, 'properties');
    });

    await waitFor(() => expect(rows()).toHaveLength(0));
    expect(Object.keys(exposed('data') ?? {})).toHaveLength(0);
    expect(Object.keys(exposed('children') ?? {})).toHaveLength(0);
  });
});

/**
 * A Custom Component talks to its own iframe over `window.postMessage`, which every row hears.
 * Every row's copy carries the same component id, so the id alone cannot say which row sent one.
 */
function customComponentChild() {
  const definition = componentDefinition('cc1', 'customcomponent1', 'CustomComponent', {
    data: binding(`{{{ picked: false }}}`),
    code: binding(''),
  });
  definition.component.parent = ID;
  definition.component.definition.styles = {};
  definition.component.definition.others = {
    showOnDesktop: binding('{{true}}'),
    showOnMobile: binding('{{false}}'),
  };
  return definition;
}

const customComponentWidget = createWidgetHarness({
  componentType: 'Listview',
  handle: NAME,
  id: ID,
  defaultProperties: {
    dataSourceSelector: binding('rawJson'),
    data: binding(THREE_RECORDS),
    mode: binding('list'),
    columns: binding('{{1}}'),
    rowHeight: binding('100'),
    loadingState: binding('{{false}}'),
    dynamicHeight: binding('{{false}}'),
    visibility: binding('{{true}}'),
    collapseWhenHidden: binding('{{false}}'),
    disabledState: binding('{{false}}'),
    showBorder: binding('{{true}}'),
    rowsPerPage: binding('{{10}}'),
    enablePagination: binding('{{false}}'),
  },
  defaultStyles: {
    backgroundColor: binding('var(--cc-surface1-surface)'),
    borderColor: binding('var(--cc-weak-border)'),
  },
  defaultExtraComponents: { cc1: customComponentChild() },
  capabilities: { dnd: true },
  widgetHeight: 450,
  widgetWidth: 600,
});

describe('Listview: a Custom Component belongs to its own row', () => {
  beforeEach(customComponentWidget.setup);
  afterEach(customComponentWidget.teardown);

  test('[Listview-BUG-032] an update from one row s iframe leaves the other rows alone', async () => {
    // Break this catches: accepting the message on component id alone. Every row's copy shares that
    // id, so one row's update is applied by all three and the rows stop being independent.
    customComponentWidget.render({ currentMode: 'view' });
    await waitFor(() => expect(document.querySelectorAll('iframe')).toHaveLength(3));

    const frames = [...document.querySelectorAll('iframe')];
    await customComponentWidget.session.store.act(async () => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { from: 'customComponent', componentId: 'cc1', message: 'UPDATE_DATA', updatedObj: { picked: true } },
          source: frames[1].contentWindow,
        })
      );
    });

    const published = () => customComponentWidget.exposed()?.data ?? {};
    await waitFor(() => expect(published()['1']?.customcomponent1?.data?.picked).toBe(true));
    expect(published()['0']?.customcomponent1?.data?.picked).toBe(false);
    expect(published()['2']?.customcomponent1?.data?.picked).toBe(false);
  });

  test('[Listview-BUG-036] every row receives the code, which is registered to skip resolution', async () => {
    // Break this catches: a skip-resolve property written once for the whole component. In a row its
    // resolved value is per row, so the code lands beside the rows and every iframe starts blank.
    const cc = customComponentChild();
    cc.component.definition.properties.code = { value: 'ROW_CODE', skipResolve: true };
    customComponentWidget.render({ currentMode: 'view', extraComponents: { cc1: cc } });
    await waitFor(() => expect(document.querySelectorAll('iframe')).toHaveLength(3));

    const replies = [...document.querySelectorAll('iframe')].map((frame) => {
      const postMessage = jest.spyOn(frame.contentWindow, 'postMessage');
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { from: 'customComponent', componentId: 'cc1', message: 'INIT' },
          source: frame.contentWindow,
        })
      );
      return postMessage.mock.calls.find(([msg]) => msg.message === 'INIT_RESPONSE')?.[0]?.code;
    });
    expect(replies).toEqual(['ROW_CODE', 'ROW_CODE', 'ROW_CODE']);
  });

  test('[Listview-BUG-036] an iframe that starts after its code resolved still receives that code', async () => {
    // Break this catches: the startup reply sending the code from the first render. In a row in the viewer
    // that is still unresolved, and the later update reaches an iframe not yet listening, so the row stays blank.
    customComponentWidget.render({ currentMode: 'view' });
    await waitFor(() => expect(document.querySelectorAll('iframe')).toHaveLength(3));

    await customComponentWidget.session.store.act(() => {
      customComponentWidget.setComponentProperty('cc1', 'code', 'RESOLVED_CODE', 'properties');
    });

    const frame = document.querySelectorAll('iframe')[1];
    const postMessage = jest.spyOn(frame.contentWindow, 'postMessage');
    await customComponentWidget.session.store.act(async () => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { from: 'customComponent', componentId: 'cc1', message: 'INIT' },
          source: frame.contentWindow,
        })
      );
    });

    const replies = postMessage.mock.calls.filter(([msg]) => msg.message === 'INIT_RESPONSE');
    expect(replies).toHaveLength(1);
    expect(replies[0][0].code).toBe('RESOLVED_CODE');
  });
});

/**
 * Three things that follow the rows: the selection, the pager's position, and where a duplicated
 * child lands.
 */
describe('Listview: state and layout that must follow the rows', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  const THREE = binding(`{{[{ text: 'Alpha' }, { text: 'Beta' }, { text: 'Gamma' }]}}`);
  const ONE = binding(`{{[{ text: 'Alpha' }]}}`);

  test('[Listview-BUG-033] a selection the data no longer holds is cleared', async () => {
    // Break this catches: the selection outliving its record, so a handler reading selectedRecord
    // acts on a row that is no longer in the data.
    await mount();
    await waitFor(() => expect(rows()).toHaveLength(3));
    await user().click(rows()[2]);
    await waitFor(() => expect(exposed('selectedRecordId')).toBe(2));

    await widget.session.store.act(() => {
      widget.setComponentProperty(ID, 'data', ONE.value, 'properties');
    });

    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(exposed('selectedRecordId')).toBeUndefined();
    expect(exposed('selectedRecord')).toBeUndefined();
  });

  test('[Listview-BUG-033] a selection the data still holds survives', async () => {
    // Guard, not a bug: shrinking the data must not throw away a selection that is still valid.
    await mount({ properties: { data: THREE } });
    await waitFor(() => expect(rows()).toHaveLength(3));
    await user().click(rows()[0]);
    await waitFor(() => expect(exposed('selectedRecordId')).toBe(0));

    await widget.session.store.act(() => {
      widget.setComponentProperty(ID, 'data', binding(`{{[{ text: 'Alpha' }, { text: 'Beta' }]}}`).value, 'properties');
    });

    await waitFor(() => expect(rows()).toHaveLength(2));
    expect(exposed('selectedRecordId')).toBe(0);
  });
});

describe('Listview: row canvases are told apart from the app canvas', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-BUG-039] a row canvas does not answer to the app canvas selector', async () => {
    // Break this catches: every row canvas reusing the app canvas's data-cy, so a browser test that
    // clicks the app canvas matches one element per row and cannot run once a List View is placed.
    await mount();
    await waitFor(() => expect(rows()).toHaveLength(3));

    expect(container().querySelectorAll('[data-cy="real-canvas"]')).toHaveLength(0);
    expect(container().querySelectorAll('[data-cy="sub-canvas"]')).toHaveLength(3);
  });
});

describe('Listview: the clicked item on a paginated list', () => {
  beforeEach(paginatedWidget.setup);
  afterEach(paginatedWidget.teardown);

  const pagedUser = () => paginatedWidget.session.user;
  const pagedExposed = (key) => paginatedWidget.exposed()?.[key];
  const nextPage = () => pagedUser().click(document.querySelector('[data-cy="next-page-link"]'));
  const previousPage = () => pagedUser().click(document.querySelector('[data-cy="previous-page-link"]'));
  const rebind = (records) =>
    paginatedWidget.session.store.act(() => {
      paginatedWidget.setComponentProperty(ID, 'data', binding(records).value, 'properties');
    });

  async function onPageTwo() {
    paginatedWidget.render({ currentMode: 'view' });
    await waitFor(() => expect(rows()).toHaveLength(5));
    await nextPage();
    await waitFor(() => expect(rowTexts()[0]).toContain('r5'));
  }

  test('[Listview-BUG-040] a click on page two publishes that item as selectedListItem', async () => {
    // Break this catches: publishing only the page index, so an app cannot reach the clicked item
    // on any page but the first.
    await onPageTwo();

    await pagedUser().click(rows()[0]);

    await waitFor(() => expect(pagedExposed('selectedListItem')).toEqual({ name: 'r5' }));
    expect(pagedExposed('selectedRecordId')).toBe(0);
  });

  test('[Listview-BUG-040] selectedListItem stays the clicked item after a page change', async () => {
    // Break this catches: deriving the item from the page index again, so turning the page swaps it.
    await onPageTwo();
    await pagedUser().click(rows()[0]);
    await waitFor(() => expect(pagedExposed('selectedListItem')).toEqual({ name: 'r5' }));

    await previousPage();

    await waitFor(() => expect(rowTexts()[0]).toContain('r0'));
    expect(pagedExposed('selectedListItem')).toEqual({ name: 'r5' });
  });

  test('[Listview-BUG-040] Enter on a row and a click on a row child publish the same item', async () => {
    // Break this catches: setting the item on one input path only.
    await onPageTwo();

    rows()[1].focus();
    await pagedUser().keyboard('{Enter}');
    await waitFor(() => expect(pagedExposed('selectedListItem')).toEqual({ name: 'r6' }));

    await pagedUser().click(document.querySelectorAll('input[type="checkbox"]')[2].parentElement);
    await waitFor(() => expect(pagedExposed('selectedListItem')).toEqual({ name: 'r7' }));
  });

  test('[Listview-BUG-041] a change to the list data clears selectedListItem', async () => {
    // Break this catches: keeping a copy of an item the data may no longer hold or no longer match.
    await onPageTwo();
    await pagedUser().click(rows()[0]);
    await waitFor(() => expect(pagedExposed('selectedListItem')).toEqual({ name: 'r5' }));

    await rebind(
      `{{[{ name: 'r0' }, { name: 'r1' }, { name: 'r2' }, { name: 'r3' }, { name: 'r4' }, { name: 'r5 edited' }, { name: 'r6' }]}}`
    );

    await waitFor(() => expect(pagedExposed('selectedListItem')).toBeUndefined());
    expect(pagedExposed('selectedRecordId')).toBe(0);
  });

  test('[Listview-BUG-041] data that resolves to the same records keeps selectedListItem', async () => {
    // Break this catches: clearing on every re-evaluation, so a query re-run with identical rows drops it.
    await onPageTwo();
    await pagedUser().click(rows()[0]);
    await waitFor(() => expect(pagedExposed('selectedListItem')).toEqual({ name: 'r5' }));

    await rebind(
      `{{[{ name: 'r0' }, { name: 'r1' }, { name: 'r2' }, { name: 'r3' }, { name: 'r4' }, { name: 'r5' }, { name: 'r6' }, { name: 'r7' }, { name: 'r8' }, { name: 'r9' }].map((record) => ({ ...record }))}}`
    );

    await waitFor(() => expect(rowTexts()[0]).toContain('r5'));
    expect(pagedExposed('selectedListItem')).toEqual({ name: 'r5' });
  });

  test('[Listview-BUG-042] a selection made on page two clears when its record leaves the data', async () => {
    // Break this catches: comparing the page index with the total count, so record 5 (index 0 on
    // page two) survives a shrink to three records.
    await onPageTwo();
    await pagedUser().click(rows()[0]);
    await waitFor(() => expect(pagedExposed('selectedRecordId')).toBe(0));

    await rebind(`{{[{ name: 'r0' }, { name: 'r1' }, { name: 'r2' }]}}`);

    await waitFor(() => expect(rows()).toHaveLength(3));
    expect(pagedExposed('selectedRecordId')).toBeUndefined();
    expect(pagedExposed('selectedRecord')).toBeUndefined();
  });
});
