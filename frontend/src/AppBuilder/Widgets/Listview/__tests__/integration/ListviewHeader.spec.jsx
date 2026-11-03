/**
 * Listview header: a slot canvas `<listviewId>-header` above the records, shared by them rather than
 * repeated per record. Scenarios Listview-HDR-001..007 in frontend/ee/test/app-builder/widgets/Listview/TESTING.md.
 *
 * Real store, real RenderWidget, real Listview and real children. The ListView id is a uuid on purpose:
 * slot canvases are filed under `<uuid>-<slot>` and only a uuid is stripped back to its base, so a short
 * id would hide every row-scope mistake these tests exist to catch.
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition, seedApp } from '@/test/app-builder';
import { Inspector } from '@/AppBuilder/RightSideBar/Inspector/Inspector';
import { DefaultComponent } from '@/AppBuilder/RightSideBar/Inspector/Components/DefaultComponent';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager/componentTypes';
import { resolveListviewHeightFromRows } from '@/AppBuilder/_stores/utils/dynamicHeightReflow';
import { addChildrenWidgetsToParent, addNewWidgetToTheEditor } from '@/AppBuilder/AppCanvas/appCanvasUtils';
import { useGridStore } from '@/_stores/gridStore';

const LV = 'b1b1b1b1-0000-4000-8000-0000000000aa';
const HEADER = `${LV}-header`;
const NAME = 'listview1';
const THREE_RECORDS = `{{[{ text: 'Alpha' }, { text: 'Beta' }, { text: 'Gamma' }]}}`;

// WidgetWrapper hides a child without device flags, so a child seeded without them renders nothing.
function child(id, name, type, properties, parent = LV) {
  const definition = componentDefinition(id, name, type, properties);
  definition.component.parent = parent;
  definition.component.definition.styles = {};
  definition.component.definition.others = {
    showOnDesktop: binding('{{true}}'),
    showOnMobile: binding('{{false}}'),
  };
  return definition;
}

const recordText = () => child('txt1', 'text1', 'Text', { text: binding('{{listItem.text}}') });
const headerTitle = () => child('hdr1', 'title1', 'Text', { text: binding('Title') }, HEADER);
const headerSearch = () => child('srch1', 'search', 'TextInput', { label: binding(''), value: binding('') }, HEADER);
const recordMirror = () => child('mir1', 'mirror1', 'Text', { text: binding('S={{components.search.value}}') });

const widget = createWidgetHarness({
  componentType: 'Listview',
  handle: NAME,
  id: LV,
  defaultProperties: {
    dataSourceSelector: binding('rawJson'),
    data: binding(THREE_RECORDS),
    mode: binding('list'),
    rowHeight: binding('80'),
    showHeader: binding('{{true}}'),
    headerHeight: binding('{{60}}'),
    enablePagination: binding('{{false}}'),
  },
  defaultStyles: {
    listStyle: binding('bordered'),
    gap: binding('{{12}}'),
  },
  defaultExtraComponents: { txt1: recordText() },
  capabilities: { dnd: true },
  widgetHeight: 624,
  widgetWidth: 600,
});

const container = () => document.getElementById(LV);
const list = () => container().querySelector('[role="list"]');
const rows = () => [...document.querySelectorAll('.list-item')];
const headerCanvases = () => [...document.querySelectorAll(`[id="canvas-${HEADER}"]`)];
const headerSection = () => container().querySelector('.wj-listview-header');
const texts = (id) => [...document.querySelectorAll(`.ele-${id}`)].map((node) => node.textContent.trim());
const exposedRow = (key) => widget.exposed()?.[key];

async function mount(options = {}, recordCount = 3) {
  widget.render({ currentMode: 'view', ...options });
  await waitFor(() => expect(container()).toBeInTheDocument());
  await waitFor(() => expect(rows()).toHaveLength(recordCount));
}

describe('Listview: header off', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-HDR-001] with Show header off no header renders and the records start at the top', async () => {
    // Break this catches: the header canvas rendered regardless of the toggle, so every saved ListView
    // (showHeader false) gains an empty band above its records.
    await mount({ properties: { showHeader: binding('{{false}}') }, extraComponents: { hdr1: headerTitle() } });

    expect(headerCanvases()).toHaveLength(0);
    expect(headerSection()).toBeNull();
    expect(texts('hdr1')).toEqual([]);
    expect(container().firstElementChild).toBe(list());
    expect(container().style.padding).toBe('12px');
  });
});

describe('Listview: header on', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-HDR-002] the header renders once, above every record, with its height and colours', async () => {
    // Break this catches: the header rendered inside each record (repeated), below the records, or
    // ignoring headerHeight / headerBackgroundColor / headerDividerColor.
    await mount({
      properties: { headerHeight: binding('{{70}}') },
      styles: { headerBackgroundColor: binding('rgb(1, 2, 3)'), headerDividerColor: binding('rgb(4, 5, 6)') },
      extraComponents: { hdr1: headerTitle() },
    });

    expect(headerCanvases()).toHaveLength(1);
    expect(texts('hdr1')).toEqual(['Title']);
    const header = headerSection();
    expect(header.closest('.list-item')).toBeNull();
    expect(header.compareDocumentPosition(list()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(header.style.backgroundColor).toBe('rgb(1, 2, 3)');
    expect(header.style.borderBottom).toBe('1px solid rgb(4, 5, 6)');
    expect(header.querySelector('.resizable-slot').style.height).toBe('70px');
  });

  test('[Listview-HDR-002] the header spans the full width above the padded records', async () => {
    // Break this catches: the header sitting inside the 12px padding, so it does not reach the widget
    // edges as in Figma, or the records losing their top padding below it.
    await mount();

    const header = headerSection().parentElement;
    expect(container().style.paddingTop).toBe('0px');
    expect(header.style.marginLeft).toBe('-12px');
    expect(header.style.marginRight).toBe('-12px');
    expect(header.style.marginBottom).toBe('12px');
  });
});

describe('Listview: a header component is shared by every record', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-HDR-003] typing in a header input shows the same value in every record', async () => {
    // Break this catches: the header treated as a record slot, so its input is repeated or read per
    // record and the records show an empty or different value.
    await mount({ extraComponents: { srch1: headerSearch(), mir1: recordMirror() } });
    await waitFor(() => expect(texts('mir1')).toEqual(['S=', 'S=', 'S=']));

    expect(document.querySelectorAll('.ele-srch1')).toHaveLength(1);
    await widget.session.user.type(document.querySelector('.ele-srch1 input'), 'abc');

    await waitFor(() => expect(texts('mir1')).toEqual(['S=abc', 'S=abc', 'S=abc']));
  });

  test('[Listview-HDR-004] a header component is not in the list s data or children', async () => {
    // Break this catches: the published rows walking the header slot like a Container slot, so every
    // record carries a copy of the header input.
    await mount({ extraComponents: { srch1: headerSearch(), mir1: recordMirror() } });
    await widget.session.user.type(document.querySelector('.ele-srch1 input'), 'abc');
    await waitFor(() => expect(texts('mir1')).toEqual(['S=abc', 'S=abc', 'S=abc']));

    const data = exposedRow('data');
    const children = exposedRow('children');
    [0, 1, 2].forEach((row) => {
      expect(Object.keys(data[row])).toEqual(expect.arrayContaining(['text1', 'mirror1']));
      expect(data[row]).not.toHaveProperty('search');
      expect(children[row]).not.toHaveProperty('search');
    });
    // The header input keeps one flat value, not one per record.
    const searchExposed = store().resolvedStore.modules[MODULE_ID].exposedValues.components.srch1;
    expect(Array.isArray(searchExposed)).toBe(false);
    expect(searchExposed.value).toBe('abc');
  });
});

describe('Listview: the header is editable on every page', () => {
  beforeEach(widget.setup);
  afterEach(() => {
    useGridStore.getState().actions.setGhostDragPosition(null);
    widget.teardown();
  });

  test('[Listview-HDR-005] on page 2 in the builder a component dropped on the header is accepted', async () => {
    // Break this catches: the header canvas gated like a later record (index not 0 on a row-scoped
    // type), so on any page it is read-only: no drop, and nothing in it can be selected or moved.
    widget.render({
      currentMode: 'edit',
      properties: { enablePagination: binding('{{true}}'), rowsPerPage: binding('{{2}}') },
      extraComponents: { hdr1: headerTitle() },
    });
    await waitFor(() => expect(rows()).toHaveLength(2));
    await widget.session.user.click(document.querySelector('[data-cy="next-page-link"]'));
    await waitFor(() => expect(rows()).toHaveLength(1));

    const headerCanvas = headerCanvases()[0];
    useGridStore.getState().actions.setGhostDragPosition({ e: { target: headerCanvas } });
    const dropped = addNewWidgetToTheEditor('Text', 'desktop', headerCanvas, HEADER);
    store().addComponentToCurrentPage([dropped], MODULE_ID, { saveAfterAction: false });

    await waitFor(() => expect(headerCanvas.querySelectorAll(`.ele-${dropped.id}`)).toHaveLength(1));
    expect(store().getComponentDefinition(dropped.id, MODULE_ID).component.parent).toBe(HEADER);
    const editable = (id) => headerCanvas.querySelector(`.ele-${id}`).classList.contains('moveable-box');
    expect(editable('hdr1')).toBe(true);
    expect(editable(dropped.id)).toBe(true);
  });
});

describe('Listview: a new ListView s header', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-HDR-006] the header of a newly dropped ListView shows Text "List view"', async () => {
    // Break this catches: the drop seeding only the record template, or the header Text bound to
    // `listItem` like the record children, so it renders empty instead of "List view".
    seedApp({}, { moduleId: MODULE_ID });
    const seeded = addChildrenWidgetsToParent('Listview', LV, 'desktop');
    const extraComponents = Object.fromEntries(seeded.map((entry) => [entry.id, entry]));
    const headerChild = seeded.find((entry) => entry.component.parent === HEADER);

    await mount({ extraComponents });

    expect(headerCanvases()[0].querySelector(`.ele-${headerChild.id}`).textContent.trim()).toBe('List view');
  });
});

/**
 * The components an export of a header ListView imports as: new ids, the header child's parent
 * remapped to `<new listview id>-header`, and the header keys kept. The server import itself is
 * proven by `server/test/modules/apps/e2e/listview-header-import-export.spec.ts`.
 */
const IMPORTED_LV = 'c2c2c2c2-0000-4000-8000-0000000000bb';
const importedWidget = createWidgetHarness({
  componentType: 'Listview',
  handle: NAME,
  id: IMPORTED_LV,
  defaultProperties: {
    dataSourceSelector: binding('rawJson'),
    data: binding(THREE_RECORDS),
    rowHeight: binding('80'),
    showHeader: binding('{{true}}'),
    headerHeight: binding('{{90}}'),
  },
  defaultStyles: {
    listStyle: binding('bordered'),
    headerBackgroundColor: binding('rgb(9, 8, 7)'),
    headerDividerColor: binding('rgb(6, 5, 4)'),
  },
  capabilities: { dnd: true },
  widgetHeight: 624,
  widgetWidth: 600,
});

describe('Listview: an imported header ListView', () => {
  beforeEach(importedWidget.setup);
  afterEach(importedWidget.teardown);

  test('[Listview-HDR-007] an imported header ListView keeps its header component and header keys', async () => {
    // Break this catches: the imported header child no longer found under `<id>-header`, or a header key
    // lost on the way, so the imported ListView shows an empty or default-styled header.
    const imported = child('d3d3d3d3-0000-4000-8000-0000000000cc', 'title1', 'Text', { text: binding('Orders') });
    imported.component.parent = `${IMPORTED_LV}-header`;
    importedWidget.render({ currentMode: 'view', extraComponents: { [imported.id]: imported } });
    await waitFor(() => expect(document.querySelectorAll('.list-item')).toHaveLength(3));

    const header = document.getElementById(IMPORTED_LV).querySelector('.wj-listview-header');
    expect(header.querySelector(`.ele-${imported.id}`).textContent.trim()).toBe('Orders');
    expect(header.style.backgroundColor).toBe('rgb(9, 8, 7)');
    expect(header.style.borderBottom).toBe('1px solid rgb(6, 5, 4)');
    expect(header.querySelector('.resizable-slot').style.height).toBe('90px');
  });
});

/** No row children, so dynamic height falls back to the configured record height. */
const bareWidget = createWidgetHarness({
  componentType: 'Listview',
  handle: NAME,
  id: LV,
  defaultProperties: {
    dataSourceSelector: binding('rawJson'),
    data: binding(THREE_RECORDS),
    rowHeight: binding('80'),
    dynamicHeight: binding('{{true}}'),
  },
  defaultStyles: { listStyle: binding('bordered'), gap: binding('{{12}}') },
  capabilities: { dnd: true },
  widgetHeight: 400,
  widgetWidth: 600,
});

async function dynamicHeightFor(properties) {
  bareWidget.render({ currentMode: 'view', properties });
  await waitFor(() => expect(container()).toBeInTheDocument());
  const state = store();
  return resolveListviewHeightFromRows({
    componentId: LV,
    contextIndices: null,
    component: state.getResolvedComponent(LV),
    currentLayout: 'desktop',
    currentPageComponents: state.getCurrentPageComponents(MODULE_ID),
    temporaryLayouts: {},
    moduleId: MODULE_ID,
  });
}

describe('Listview: dynamic height counts the header', () => {
  beforeEach(bareWidget.setup);
  afterEach(bareWidget.teardown);

  test('[Listview-HDR-002] a shown header adds its height to the dynamic height', async () => {
    // Break this catches: a dynamic list sized without its header, which cuts off the last record.
    const without = await dynamicHeightFor({ showHeader: binding('{{false}}') });
    bareWidget.teardown();
    bareWidget.setup();
    const withHeader = await dynamicHeightFor({ showHeader: binding('{{true}}'), headerHeight: binding('{{70}}') });

    // 3 x 80 + 2 x 12 gaps + 28 chrome without; the header replaces the top padding with itself + its 12px gap.
    expect(without).toBe(292);
    expect(withHeader).toBe(362);
  });
});

/** The real inspector tabs for the seeded ListView, as the Inspector builds them. */
function seededMeta() {
  seedApp({ [LV]: componentDefinition(LV, NAME, 'Listview', {}, { styles: { listStyle: binding('bordered') } }) });
  const stored = store().getCurrentPageComponents(MODULE_ID)[LV];
  const componentMeta = {
    ...componentTypeDefinitionMap.Listview,
    ...stored.component,
    definition: stored.component.definition,
  };
  return { componentMeta, component: { id: LV, component: JSON.parse(JSON.stringify(componentMeta)) } };
}

const groups = () =>
  [...document.querySelectorAll('.accordion-item')].map((group) => ({
    title: group.querySelector('.accordion-title-text')?.textContent,
    fields: [...group.querySelectorAll('label[data-cy^="label-"]')].map((label) => label.textContent),
  }));

describe('Listview: header settings in the inspector', () => {
  // The session installs the browser observers the Properties tab's event panel needs.
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Listview-HDR-002] the Styles tab opens with a Header group holding Background and Divider', () => {
    // Break this catches: the header colours missing from the Styles tab, or mixed into the Records group.
    const { componentMeta, component } = seededMeta();
    render(
      <Inspector.RenderStyleOptions
        componentMeta={componentMeta}
        component={component}
        paramUpdated={() => {}}
        dataQueries={[]}
        currentState={{}}
        allComponents={{}}
        hasCustomStyling={false}
      />
    );

    expect(groups()[0]).toEqual({ title: 'Header', fields: ['Background', 'Divider'] });
  });

  test('[Listview-HDR-001] the Properties tab opens with a Header section holding Show header', () => {
    // Break this catches: no way to turn the header on or off from the inspector.
    const { componentMeta, component } = seededMeta();
    render(
      <MemoryRouter>
        <DefaultComponent
          componentMeta={componentMeta}
          component={component}
          paramUpdated={() => {}}
          layoutPropertyChanged={() => {}}
          eventsChanged={() => {}}
          dataQueries={[]}
          currentState={{}}
          components={{}}
          apps={[]}
          pages={[]}
          darkMode={false}
        />
      </MemoryRouter>
    );

    expect(groups()[0].title).toBe('Header');
    expect(groups()[0].fields).toEqual(['Show header']);
  });
});
