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
});
