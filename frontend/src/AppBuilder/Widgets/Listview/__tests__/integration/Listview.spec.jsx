import { waitFor, screen, fireEvent, render, act } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
  drain,
  widgetProps,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition, AppBuilderTestSession, defineAppBuilderScenario, seedApp } from '@/test/app-builder';
import React from 'react';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import useStore from '@/AppBuilder/_stores/store';
import { addNewWidgetToTheEditor, addChildrenWidgetsToParent } from '@/AppBuilder/AppCanvas/appCanvasUtils';
import { pasteComponents, copyComponents } from '@/AppBuilder/AppCanvas/copyPasteWidgetsUtils';
import { useGridStore } from '@/_stores/gridStore';
import i18next from 'i18next';
import { MemoryRouter } from 'react-router-dom';
import { Inspector } from '@/AppBuilder/RightSideBar/Inspector/Inspector';
import { DefaultComponent } from '@/AppBuilder/RightSideBar/Inspector/Components/DefaultComponent';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager/componentTypes';
import { resolveListviewHeightFromRows } from '@/AppBuilder/_stores/utils/dynamicHeightReflow';
import { toast } from 'react-hot-toast';
import { appVersionService } from '@/_services';
import fs from 'fs';
import path from 'path';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import { listviewConfig } from '@tooljet/widget-definitions';
import SingleLineCodeEditor from '@/AppBuilder/CodeEditor/SingleLineCodeEditor';
import { isNeverDisabled, isRecordDisabled } from '@/AppBuilder/Widgets/Listview/disabledRecords';

jest.mock('@/AppBuilder/Widgets/Listview/disabledRecords', () => {
  const actual = jest.requireActual('@/AppBuilder/Widgets/Listview/disabledRecords');
  return { ...actual, isRecordDisabled: jest.fn((...args) => actual.isRecordDisabled(...args)) };
});
jest.mock('react-hot-toast', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
// Wraps, never replaces: counts how often each record re-renders.
jest.mock('@/_hooks/useDynamicHeight', () => {
  const actual = jest.requireActual('@/_hooks/useDynamicHeight');
  return { ...actual, useDynamicHeight: jest.fn((...args) => actual.useDynamicHeight(...args)) };
});

describe('Listview', () => {
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
  const pager = () => document.querySelector('[data-cy="pagination-section"]');
  const nextButton = () => document.querySelector('[data-cy="pagination-button-to-next"]');
  const goToLastPage = async (userEvent) => {
    for (let step = 0; step < 60 && nextButton() && !nextButton().disabled; step += 1)
      await userEvent.click(nextButton());
  };
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

      await paginatedWidget.session.user.click(document.querySelector('[data-cy="pagination-button-to-next"]'));

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
      definition.component.definition.others = {
        showOnDesktop: binding('{{true}}'),
        showOnMobile: binding('{{false}}'),
      };
      return definition;
    };
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

      const editable = () =>
        [...document.querySelectorAll('.ele-txt2')].map((node) => node.classList.contains('moveable-box'));

      // Wait for the settled lock: the elements exist a render before the row context marks the copies read-only.
      await waitFor(() => expect(editable()).toEqual([true, false, false, false]));
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

      const editable = () =>
        [...document.querySelectorAll('.ele-txt8')].map((node) => node.classList.contains('moveable-box'));

      // Wait for the settled lock: the elements exist a render before the row context marks the copies read-only.
      await waitFor(() => expect(editable()).toEqual([true, false, false]));
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
        extraComponents: {
          cont7: wrapper('cont7', 'container7', 'Container', {}),
          btn7: targetIn('cont7'),
          btn6: GO(),
        },
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

    test.each([
      ['a plain number', 2],
      ['a plain string', '2'],
      ['an expression', '{{2}}'],
    ])('[Listview-COMPAT-004] a Number of columns saved as %s still divides the grid', async (_label, saved) => {
      // Break this catches: the code-field control reading only {{...}}, which would break a list saved by the old number control.
      await mount({ properties: { mode: binding('grid'), columns: { value: saved } } });

      await waitFor(() => expect(rows()).toHaveLength(3));
      expect(rows()[0].style.width).toBe('50%');
    });

    test.each([
      ['a plain number', 9],
      ['a plain string', '9'],
      ['an expression', '{{9}}'],
    ])('[Listview-COMPAT-004] a Border radius saved as %s still rounds the list', async (_label, saved) => {
      // Break this catches: the number-input control's value shape reaching the runtime, which would square saved lists.
      await mount({ styles: { borderRadius: { value: saved } } });

      await waitFor(() => expect(rows()).toHaveLength(3));
      expect(container().style.borderRadius).toBe('9px');
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

      await user().click(document.querySelector('[data-cy="pagination-button-to-next"]'));

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
      await user().click(document.querySelector('[data-cy="pagination-button-to-next"]'));
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

    test('[Listview-STYLE-001] a Number input saves the radius as a plain string and it still renders in px', async () => {
      // Break this catches: a bare "12" handed to CSS, which drops the whole radius.
      await mount({ styles: { borderRadius: binding('12') } });

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

  // The harness seeds the config `definition` under a pre-2.0 ListView, as the server does on load.
  describe('Listview: a saved ListView without any 2.0 key', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test.each(['edit', 'view'])(
      '[Listview-COMPAT-002] renders as before in %s mode: 7px padding, bottom border on, no header, current pager',
      async (currentMode) => {
        // Break this catches: a config default for a 2.0 key set to the new look (bordered style,
        // header on, 80px rows), which would change every ListView saved before 2.0 on its next load.
        await mount({
          currentMode,
          properties: { enablePagination: binding('{{true}}'), rowsPerPage: binding('{{2}}') },
        });
        await waitFor(() => expect(rows()).toHaveLength(2));

        const { properties, styles } = store().getCurrentPageComponents(MODULE_ID)[ID].component.definition;
        expect(styles.listStyle).toEqual({ value: 'legacy' });
        expect(styles.gap).toEqual({ value: '{{0}}' });
        expect(properties.showHeader).toEqual({ value: '{{false}}' });
        expect(properties.serverSidePagination).toEqual({ value: '{{false}}' });
        // jsdom drops the var() border, so the separator itself is QA's (Listview-BRW-001).
        expect(properties.showBorder).toEqual({ value: '{{true}}' });
        expect(properties.gridRecordHeight).toBeUndefined();
        expect(styles.recordBackgroundColor).toBeUndefined();
        expect(styles.recordBorderColor).toBeUndefined();

        expect(container().style.padding).toBe('7px');
        expect(rows()[0].style.height).toBe('100px');
        expect(document.getElementById(`${ID}-header`)).toBeNull();
        expect(pager()).toBeTruthy();
      },
      // The first edit-mode mount loads the editor canvas and can pass 5s on a busy machine.
      20000
    );
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

    test('[Listview-REC-017] a Modal that is open when its record becomes disabled still takes clicks and closes', async () => {
      // Break this catches: the disabled block running before the portal checks, so the open Modal looks live but is dead.
      // The Modal portals to the canvas area in a browser, outside the record; the harness has none, so add it.
      const canvasArea = document.body.appendChild(
        Object.assign(document.createElement('div'), { className: 'tj-canvas-area' })
      );
      await mount({
        properties: { disableRecords: binding('{{false}}') },
        events: [counting('onRecordClicked', 'rec')],
        extraComponents: { mod1: MODAL_CHILD() },
      });
      await waitFor(() => expect(rows()).toHaveLength(3));
      await user().click(trigger());
      await waitFor(() => expect(document.querySelector('[role="dialog"], .modal-content')).toBeTruthy());

      await widget.session.store.act(() => {
        widget.setComponentProperty(ID, 'disableRecords', binding(`{{listItem.text === 'Alpha'}}`).value, 'properties');
      });
      await waitFor(() => expect(rows()[0]).toHaveAttribute('aria-disabled', 'true'));
      const opened = fired('rec');

      expect(fireEvent.click(document.querySelector('[role="dialog"], .modal-content'))).toBe(true);
      await user().click(document.querySelector('[data-cy="modal-close-button"]'));

      await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
      expect(fired('rec')).toBe(opened);
      canvasArea.remove();
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
      previous: document.querySelector('[data-cy="pagination-button-to-previous"]'),
      next: document.querySelector('[data-cy="pagination-button-to-next"]'),
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
      const footer = () => document.querySelector('[data-cy="container-pagination"]').textContent;

      arrows().previous.focus();
      await user().keyboard('{Enter}');
      expect(rowTexts()).toEqual(['Alpha', 'Beta']);
      expect(footer()).not.toContain('Showing');
      expect(document.querySelector('.table-pagination-btn.selected').textContent).toBe('1');

      await user().click(arrows().next);
      await waitFor(() => expect(rowTexts()).toEqual(['Gamma']));
      arrows().next.focus();
      await user().keyboard('{Enter}');
      expect(rowTexts()).toEqual(['Gamma']);
      expect(footer()).not.toContain('Showing');
      expect(document.querySelector('.table-pagination-btn.selected').textContent).toBe('2');
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

    const activePage = () => document.querySelector('[data-cy="pagination-button-go-to-page"].selected')?.textContent;

    test('[Listview-BUG-020] a new data set that still reaches the page opens on that page', async () => {
      // Break this catches: reading the page against the old records, so the new set shows stale rows
      // or a page past its own end. D-07 keeps the page number while the page exists.
      await mount(paged(manyRecords(30, 'a'), binding('{{10}}')));
      await waitFor(() => expect(rowTexts()[0]).toBe('a0'));

      await user().click(document.querySelector('[data-cy="pagination-button-to-next"]'));
      await user().click(document.querySelector('[data-cy="pagination-button-to-next"]'));
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
      await user().click(document.querySelector('[data-cy="pagination-button-to-next"]'));
      await user().click(document.querySelector('[data-cy="pagination-button-to-next"]'));
      await waitFor(() => expect(rowTexts()[0]).toBe('o20'));

      await widget.session.store.act(() => {
        widget.setComponentProperty(ID, 'data', manyRecords(49, 'o').value, 'properties');
      });

      expect(rowTexts()[0]).toBe('o20');
      expect(activePage()).toBe('3');
    });

    test('[Listview-BUG-038] a data set that no longer reaches the page lands on its last page', async () => {
      // Break this catches: keeping a page number past the new end, which renders an empty page.
      await mount(paged(manyRecords(50, 'p'), binding('{{10}}')));
      await waitFor(() => expect(rowTexts()[0]).toBe('p0'));
      await goToLastPage(user());
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

      await user().click(document.querySelector('[data-cy="pagination-button-to-next"]'));

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

    test('[Listview-BUG-033] a selection is cleared when the data shrinks but still holds its record', async () => {
      // Break this catches: keeping an index that now points into a different data value, which Table clears.
      await mount({ properties: { data: THREE } });
      await waitFor(() => expect(rows()).toHaveLength(3));
      await user().click(rows()[0]);
      await waitFor(() => expect(exposed('selectedRecordId')).toBe(0));

      await widget.session.store.act(() => {
        widget.setComponentProperty(
          ID,
          'data',
          binding(`{{[{ text: 'Alpha' }, { text: 'Beta' }]}}`).value,
          'properties'
        );
      });

      await waitFor(() => expect(rows()).toHaveLength(2));
      expect(exposed('selectedRecordId')).toBeUndefined();
      expect(exposed('selectedRecord')).toBeUndefined();
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
    const nextPage = () => pagedUser().click(document.querySelector('[data-cy="pagination-button-to-next"]'));
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
});

describe('Listview.emptyData', () => {
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
    const inner = nest(
      componentDefinition('inner1', 'innerList', 'Listview', listProps('{{listItem.items}}')),
      'outer1'
    );
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
});

describe('ListviewCreation', () => {
  // Saved ListViews load with the config's old-look `definition`; only a new drop writes the new look.

  const MODULE_ID = 'canvas';
  const PAGE_ID = 'page-1';

  const components = () => useStore.getState().getCurrentPageComponents(MODULE_ID);
  const listviewsOnPage = () => Object.values(components()).filter((entry) => entry.component.component === 'Listview');

  describe('Listview: a new drop gets the new look', () => {
    let realCanvas;

    beforeEach(() => {
      seedApp({}, { moduleId: MODULE_ID, pageId: PAGE_ID });
      realCanvas = document.createElement('div');
      realCanvas.id = 'real-canvas';
      document.body.appendChild(realCanvas);
      const dropTarget = document.createElement('div');
      document.body.appendChild(dropTarget);
      useGridStore.getState().actions.setGhostDragPosition({ e: { target: dropTarget } });
    });

    afterEach(() => {
      realCanvas.remove();
      useGridStore.getState().actions.setGhostDragPosition(null);
    });

    async function dropListview() {
      const parent = addNewWidgetToTheEditor('Listview', 'desktop', realCanvas, 'canvas');
      const children = addChildrenWidgetsToParent('Listview', parent.id, 'desktop');
      // Not awaited: without a save the returned promise never settles. The page is updated synchronously.
      useStore.getState().addComponentToCurrentPage([parent, ...children], MODULE_ID, { saveAfterAction: false });
      const saved = components()[parent.id];
      const savedChildren = children.map((child) => components()[child.id]);
      return { dropped: parent, saved, savedChildren };
    }

    test('[Listview-CREATE-001] a dropped ListView is saved with every new-look value', async () => {
      // Break this catches: the drop path writing the config's old-look definition as-is, so every
      // new ListView looks like a pre-2.0 one; or a creation value going missing or wrong.
      const { saved } = await dropListview();
      const { properties, styles } = saved.component.definition;

      expect(properties.showHeader).toEqual({ value: '{{true}}' });
      // The header height is fixed (Figma 60px), so there is no key to save.
      expect(properties.headerHeight).toBeUndefined();
      expect(properties.serverSidePagination).toEqual({ value: '{{false}}' });
      expect(properties.totalRecords).toEqual({ value: '{{10}}' });
      expect(properties.disableRecords).toEqual({ value: '{{false}}' });
      expect(properties.rowHeight).toEqual({ value: '80' });
      expect(properties.gridRecordHeight).toEqual({ value: '170' });

      // listStyle bordered is what gives the 12px container padding.
      expect(styles.listStyle).toEqual({ value: 'bordered' });
      expect(styles.gap).toEqual({ value: '{{12}}' });
      expect(styles.recordBackgroundColor).toEqual({ value: 'var(--cc-surface1-surface)' });
      expect(styles.recordDividerColor).toEqual({ value: 'var(--cc-weak-border)' });
      expect(styles.recordBorderColor).toEqual({ value: 'var(--cc-weak-border)' });
      expect(styles.recordBorderRadius).toEqual({ value: '{{6}}' });
      // No shadow is expressed by leaving the key out; the shadow field cannot parse a 'none' value.
      expect(styles.recordBoxShadow).toBeUndefined();
      expect(styles.headerBackgroundColor).toEqual({ value: 'transparent' });
      expect(styles.headerDividerColor).toEqual({ value: 'var(--cc-weak-border)' });
    });

    test('[Listview-CREATE-001] a dropped ListView holds 8 sample records and is 624px tall, so 6 show', async () => {
      // Break this catches: keeping the 3-record sample or the 450px height, so a new ListView
      // does not match Figma (6 records of 80px + 12px gaps + header, the rest scroll).
      const { saved } = await dropListview();

      const data = saved.component.definition.properties.data.value;
      const records = new Function(`return ${data.slice(2, -2)}`)();
      expect(records).toHaveLength(8);
      expect(saved.layouts.desktop.height).toBe(624);
    });

    test('[Listview-CREATE-001] a new ListView holds 8 people with a photo, name, company and role', async () => {
      // Break this catches: the old text/buttonText sample, or a record missing a field the children bind.
      const { saved } = await dropListview();

      const records = new Function(`return ${saved.component.definition.properties.data.value.slice(2, -2)}`)();
      expect(records).toHaveLength(8);
      records.forEach((record) => {
        expect(Object.keys(record).sort()).toEqual(['company', 'imageURL', 'name', 'role']);
        expect(record.imageURL).toMatch(/^https:\/\/randomuser\.me\/api\/portraits\/(men|women)\/\d+\.jpg$/);
      });
      expect(records[0]).toMatchObject({
        name: 'Henry, Arthur',
        company: 'Big Kahuna Burger Ltd.',
        role: 'Project manager',
      });
    });

    test('[Listview-CREATE-001] the default children are the Figma card: round avatar, bold name, grey company, role chip', async () => {
      // Break this catches: the old Image/Text/Button row, an avatar that is not 40px and round, or a chip that is not the Tags widget.
      const { saved, savedChildren } = await dropListview();
      const record = savedChildren.filter((child) => child.component.parent === saved.id);

      expect(record.map((child) => child.component.component)).toEqual(['Image', 'Text', 'Text', 'Tags']);
      const [avatar, name, company, role] = record;
      expect(avatar.component.definition.properties.source).toEqual({ value: '{{listItem.imageURL}}' });
      expect(avatar.component.definition.styles.borderType).toEqual({ value: 'rounded-circle' });
      expect(avatar.component.definition.styles.imageFit).toEqual({ value: 'cover' });
      expect(avatar.layouts.desktop.height).toBe(40);
      expect(name.component.definition.properties.text).toEqual({ value: '{{listItem.name}}' });
      expect(name.component.definition.styles.fontWeight).toEqual({ value: 'bold' });
      expect(company.component.definition.properties.text).toEqual({ value: '{{listItem.company}}' });
      expect(company.component.definition.styles.textColor).toEqual({ value: 'var(--cc-placeholder-text)' });
      const chips = role.component.definition.properties.data.value;
      expect(chips).toContain('listItem.role');
      expect(chips).not.toMatch(/#[0-9a-fA-F]{3,8}/);
      // Without Dynamic tags the Tags widget ignores `data` and shows its sample options.
      expect(role.component.definition.properties.advanced).toEqual({ value: '{{true}}' });
      expect(chips).toContain('color-mix(in srgb, var(--cc-primary-brand)');
      expect(chips).not.toContain('surface3');
    });

    test('[Listview-CREATE-001] the default children fill the 80px list record: avatar left, texts stacked, chip right', async () => {
      // Break this catches: children spilling out of the record, or a card that is not avatar | name over company | chip.
      const { saved, savedChildren } = await dropListview();
      const [avatar, name, company, role] = savedChildren
        .filter((child) => child.component.parent === saved.id)
        .map((child) => child.layouts.desktop);

      [avatar, name, company, role].forEach(({ top, height }) => {
        expect(top).toBeGreaterThanOrEqual(0);
        expect(top + height).toBeLessThanOrEqual(80);
      });
      expect(avatar.left + avatar.width).toBeLessThanOrEqual(name.left);
      expect(name.left).toBe(company.left);
      expect(name.top + name.height).toBeLessThanOrEqual(company.top);
      expect(name.left + name.width).toBeLessThanOrEqual(role.left);
      expect(role.left + role.width).toBeLessThanOrEqual(43);
      // A large chip is 28px plus its own margin and padding; 30px clipped it.
      expect(role.height).toBeGreaterThanOrEqual(40);
      // Centred on the same line as the avatar.
      expect(avatar.top + avatar.height / 2).toBe(40);
      expect(role.top + role.height / 2).toBe(40);
    });

    test('[Listview-CREATE-001] a new ListView gets a grid card tall enough for the stacked children', async () => {
      // Break this catches: a grid record that is too short for avatar, name, company and chip.
      const { saved } = await dropListview();

      expect(saved.component.definition.properties.gridRecordHeight).toEqual({ value: '170' });
    });

    test('[Listview-HDR-006] a dropped ListView gets one header Text "List view", not bound to a record', async () => {
      // Break this catches: the header Text missing, filed under the record canvas (repeated per record),
      // or bound to `listItem` like the record template and so blank.
      const { saved, savedChildren } = await dropListview();
      const headerChildren = savedChildren.filter((child) => child.component.parent === `${saved.id}-header`);

      expect(headerChildren).toHaveLength(1);
      expect(headerChildren[0].component.component).toBe('Text');
      expect(headerChildren[0].component.definition.properties.text).toEqual({ value: 'List view' });
    });

    test('[Listview-CREATE-001] the dropped ListView does not carry the creation block itself', async () => {
      // Break this catches: leaving `creationDefinition` on the component the drop builds, where any
      // consumer that keeps the whole component (not just its definition) would store it.
      const { dropped, saved } = await dropListview();

      expect(dropped.component).not.toHaveProperty('creationDefinition');
      expect(saved.component).not.toHaveProperty('creationDefinition');
    });

    test('[Listview-CREATE-001] the creation values stay out of the config defaults', async () => {
      // Break this catches: writing the new look into the config `definition` instead of at
      // creation. The server merges that definition under every saved ListView, so every old
      // ListView would change its look on the next load.
      await dropListview();
      seedApp(
        { old1: componentDefinition('old1', 'listview9', 'Listview', { data: binding('{{[]}}') }) },
        { moduleId: MODULE_ID, pageId: PAGE_ID }
      );
      const { properties, styles } = components().old1.component.definition;

      expect(styles.listStyle).toEqual({ value: 'legacy' });
      expect(properties.showHeader).toEqual({ value: '{{false}}' });
      expect(properties.rowHeight).toEqual({ value: '100' });
    });
  });

  describe('Listview: copy and paste keeps the saved look', () => {
    /** A ListView saved before 2.0, then merged with the config defaults as the server does on load. */
    const OLD_ID = 'lv1';

    beforeEach(() => {
      seedApp(
        {
          [OLD_ID]: componentDefinition(OLD_ID, 'listview1', 'Listview', {
            dataSourceSelector: binding('rawJson'),
            data: binding(`{{[{ n: 'a' }]}}`),
            rowHeight: binding('120'),
          }),
        },
        { moduleId: MODULE_ID, pageId: PAGE_ID }
      );
    });

    test('[Listview-CREATE-002] a pasted old ListView keeps the old look', async () => {
      // Break this catches: the paste path stamping the creation values (for example by reusing
      // the drop function), so a copy of an old ListView switches to the new look.
      const original = components()[OLD_ID];

      await pasteComponents(undefined, {
        isCut: false,
        isCloning: false,
        pageId: PAGE_ID,
        newComponents: [
          { component: original.component, layouts: original.layouts, parent: null, id: OLD_ID, events: [] },
        ],
      });

      const pasted = listviewsOnPage().find((entry) => entry.component.name !== 'listview1');
      expect(pasted).toBeDefined();
      const { properties, styles } = pasted.component.definition;
      expect(styles.listStyle).toEqual({ value: 'legacy' });
      expect(styles.gap).toEqual({ value: '{{0}}' });
      expect(properties.showHeader).toEqual({ value: '{{false}}' });
      expect(properties.rowHeight).toEqual({ value: '120' });
      expect(properties.gridRecordHeight).toBeUndefined();
      expect(styles.recordBorderColor).toBeUndefined();
      expect(styles.recordBackgroundColor).toBeUndefined();
    });
  });
});

describe('ListviewEmptyState', () => {
  /**
   * Listview 2.0 empty state (Figma "No data found"): every ListView with no records shows an icon, a title and a
   * subtitle between its header and footer. Contract: frontend/ee/test/app-builder/widgets/Listview/TESTING.md
   * (Listview-EMPTY-001..005). Real store, real RenderWidget.
   */

  const ID = 'b1b1b1b1-0000-4000-8000-0000000000bb';

  function textChild() {
    const definition = componentDefinition('txt1', 'text1', 'Text', { text: binding('{{listItem.name}}') });
    definition.component.parent = ID;
    definition.component.definition.styles = {};
    definition.component.definition.others = {
      showOnDesktop: binding('{{true}}'),
      showOnMobile: binding('{{false}}'),
    };
    return definition;
  }

  const widget = createWidgetHarness({
    componentType: 'Listview',
    handle: 'listview1',
    id: ID,
    defaultProperties: {
      dataSourceSelector: binding('rawJson'),
      data: binding('{{[]}}'),
      mode: binding('list'),
      columns: binding('{{1}}'),
      rowHeight: binding('80'),
      loadingState: binding('{{false}}'),
      dynamicHeight: binding('{{false}}'),
      visibility: binding('{{true}}'),
      disabledState: binding('{{false}}'),
      showBorder: binding('{{true}}'),
      showHeader: binding('{{true}}'),
      rowsPerPage: binding('{{5}}'),
      enablePagination: binding('{{true}}'),
    },
    defaultStyles: {
      backgroundColor: binding('var(--cc-surface1-surface)'),
      borderColor: binding('var(--cc-weak-border)'),
      listStyle: binding('bordered'),
      gap: binding('{{12}}'),
    },
    defaultExtraComponents: { txt1: textChild() },
    capabilities: { dnd: true },
    widgetHeight: 600,
    widgetWidth: 600,
  });

  const container = () => document.getElementById(ID);
  const emptyState = () => container()?.querySelector('[data-cy="listview-empty-state"]');
  const rows = () => [...document.querySelectorAll('.list-item')];

  async function mount(options = {}) {
    widget.render({ currentMode: 'view', ...options });
    await waitFor(() => expect(container()).toBeInTheDocument());
  }

  describe('Listview: empty state', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test('[Listview-EMPTY-001] no records shows the icon, "No data found" and the subtitle', async () => {
      // Break this catches: a blank box, or Table's "No data" warning look.
      await mount();

      expect(emptyState()).toBeInTheDocument();
      expect(emptyState().textContent).toContain('No data found');
      expect(emptyState().textContent).toContain('Connect your database or use sample data to see results');
      expect(emptyState().querySelector('svg')).toBeInTheDocument();
      expect(rows()).toHaveLength(0);
    });

    test.each([
      ['text', "{{'abc'}}"],
      ['an object', '{{({ a: 1 })}}'],
      ['null', '{{null}}'],
    ])(
      '[Listview-EMPTY-002] data that is %s, not a list of records, shows the same empty state',
      async (_label, data) => {
        // Break this catches: an empty state only for [], so a failed query leaves a blank box.
        await mount({ properties: { data: binding(data) } });

        expect(emptyState()).toBeInTheDocument();
      }
    );

    test('[Listview-EMPTY-003] records hide the empty state', async () => {
      // Break this catches: the empty state drawn under real records.
      await mount({ properties: { data: binding("{{[{ name: 'a' }]}}") } });

      await waitFor(() => expect(rows()).toHaveLength(1));
      expect(emptyState()).toBeNull();
    });

    test('[Listview-EMPTY-004] the header and the footer stay around the empty state, in the builder too', async () => {
      // Break this catches: the empty state replacing the whole widget body, so the header and pager vanish.
      await mount({ currentMode: 'edit' });

      expect(emptyState()).toBeInTheDocument();
      expect(container().querySelector('.listview-header-wrapper')).toBeInTheDocument();
      expect(container().querySelector('[data-cy="container-pagination"]')).toBeInTheDocument();
      expect(container().querySelector('[data-cy="container-pagination"]').style.height).toBe('60px');
    });

    test('[Listview-EMPTY-005] the empty state fills the space between header and footer and centres', async () => {
      // Break this catches: an empty state pinned to the top instead of centred in the free space.
      await mount();

      const node = emptyState();
      expect(node.style.flex).toBe('1 1 0%');
      expect(node.style.justifyContent).toBe('center');
      expect(node.style.alignItems).toBe('center');
    });

    test('[Listview-EMPTY-006] a loading list shows the spinner, not the empty state', async () => {
      // Break this catches: "No data found" flashing while a query is still running.
      await mount({ properties: { loadingState: binding('{{true}}') } });

      expect(emptyState()).toBeNull();
    });

    test.each(['edit', 'view'])(
      '[Listview-EMPTY-007] the title and the subtitle follow the workspace language, in %s mode',
      async (currentMode) => {
        // Break this catches: hard-coded English, or a subtitle shown only to builders.
        i18next.addResourceBundle(
          'en',
          'translation',
          { widget: { listview: { noDataTitle: 'Sin datos', noDataSubtitle: 'Conecta tu base de datos' } } },
          true,
          true
        );
        try {
          await mount({ currentMode });

          expect(emptyState().textContent).toContain('Sin datos');
          expect(emptyState().textContent).toContain('Conecta tu base de datos');
        } finally {
          i18next.removeResourceBundle('en', 'translation');
        }
      }
    );
  });
});

describe('ListviewHeader', () => {
  /**
   * Listview header: a slot canvas `<listviewId>-header` above the records, shared by them rather than
   * repeated per record. Scenarios Listview-HDR-001..007 in frontend/ee/test/app-builder/widgets/Listview/TESTING.md.
   *
   * Real store, real RenderWidget, real Listview and real children. The ListView id is a uuid on purpose:
   * slot canvases are filed under `<uuid>-<slot>` and only a uuid is stripped back to its base, so a short
   * id would hide every row-scope mistake these tests exist to catch.
   */

  const LV = 'b1b1b1b1-0000-4000-8000-0000000000aa';
  const HEADER = `${LV}-header`;
  const NAME = 'listview1';
  const THREE_RECORDS = `{{[{ text: 'Alpha' }, { text: 'Beta' }, { text: 'Gamma' }]}}`;
  // Figma 238:1379 (list) and 294:45127 (grid): the header frame is 60px tall in both. Hand-copied, not imported.
  const FIGMA_HEADER_HEIGHT = 60;
  // The 1px divider is inside that 60px (Figma: border-b inside the frame), so the canvas slot is one less.
  const DIVIDER = 1;
  const SLOT_HEIGHT = `${FIGMA_HEADER_HEIGHT - DIVIDER}px`;

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
      enablePagination: binding('{{false}}'),
    },
    defaultStyles: {
      listStyle: binding('bordered'),
      gap: binding('{{12}}'),
    },
    defaultExtraComponents: { txt1: recordText() },
    capabilities: { dnd: true },
    // The drop template's Image (Listview-HDR-006).
    preload: ['Image', 'Tags'],
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
      const { paddingTop, paddingRight, paddingBottom, paddingLeft } = container().style;
      expect([paddingTop, paddingRight, paddingBottom, paddingLeft]).toEqual(['12px', '12px', '12px', '12px']);
    });
  });

  describe('Listview: header toggled at runtime', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test('[Listview-HDR-001] turning Show header off after it was on gives the records their top padding back', async () => {
      // Break this catches: `paddingTop` set only while the header shows. When the key disappears React
      // clears padding-top and the shorthand is not re-applied, so records sit flush under the top border.
      await mount();
      expect(container().style.paddingTop).toBe('0px');

      widget.setComponentProperty(LV, 'showHeader', '{{false}}', 'properties');

      await waitFor(() => expect(headerCanvases()).toHaveLength(0));
      expect(container().style.paddingTop).toBe('12px');
    });
  });

  describe('Listview: header on', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test('[Listview-HDR-002] the header renders once, above every record, with its height and colours', async () => {
      // Break this catches: the header rendered inside each record (repeated), below the records, or
      // not the Figma height, or ignoring headerBackgroundColor / headerDividerColor.
      await mount({
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
      // Figma 238:1379: the header is 60px including the divider, so the first record starts at 72.
      expect(header.style.boxSizing).toBe('border-box');
      expect(header.style.height).toBe(`${FIGMA_HEADER_HEIGHT}px`);
      expect(header.querySelector('.resizable-slot').style.height).toBe(SLOT_HEIGHT);
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

  describe('Listview: the header height is fixed', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test('[Listview-HDR-008] dragging the header edge in the builder does not change its height', async () => {
      // Break this catches: the header slot keeping a resize handle (or honouring a stray saved
      // headerHeight), so a builder drag or an old value moves the header off the Figma height.
      widget.render({ currentMode: 'edit', properties: { headerHeight: binding('{{70}}') } });
      await waitFor(() => expect(rows()).toHaveLength(3));
      const slot = () => headerSection().querySelector('.resizable-slot');
      expect(slot().style.height).toBe(SLOT_HEIGHT);

      const handle = headerSection().querySelector('.resize-handle');
      if (handle) {
        fireEvent.mouseDown(handle, { clientX: 0, clientY: 0, button: 0 });
        fireEvent.mouseMove(document, { clientX: 0, clientY: 40 });
        fireEvent.mouseUp(document);
      }

      expect(slot().style.height).toBe(SLOT_HEIGHT);
      expect(handle).toBeNull();
      expect(store().getComponentDefinition(LV, MODULE_ID).component.definition.properties.headerHeight).toEqual({
        value: '{{70}}',
      });
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

    test('[Listview-HDR-003] a header Text reads the header input as one value', async () => {
      // Break this catches: the record set-up (sizing every row child to one copy per record) reaching the
      // header, so a header Text bound to a header input resolves per record and stops following it.
      const headerMirror = child('hm1', 'hmirror', 'Text', { text: binding('H={{components.search.value}}') }, HEADER);
      await mount({ extraComponents: { srch1: headerSearch(), mir1: recordMirror(), hm1: headerMirror } });
      await widget.session.user.type(document.querySelector('.ele-srch1 input'), 'abc');
      await waitFor(() => expect(texts('mir1')).toEqual(['S=abc', 'S=abc', 'S=abc']));
      store().setVariable('poke', 1, MODULE_ID);

      await waitFor(() => expect(texts('hm1')).toEqual(['H=abc']));
    });

    test('[Listview-HDR-003] a header component has no record, so listItem never resolves to one', async () => {
      // Break this catches: the row-ancestor lookup taking the header slot for a record, so a header
      // binding to `listItem` silently shows the first record's values.
      const headerItem = child('hm2', 'hitem', 'Text', { text: binding('L={{listItem.text}}') }, HEADER);
      await mount({ extraComponents: { hm2: headerItem } });
      await waitFor(() => expect(texts('txt1')).toEqual(['Alpha', 'Beta', 'Gamma']));

      expect(texts('hm2')).toHaveLength(1);
      ['Alpha', 'Beta', 'Gamma'].forEach((record) => expect(texts('hm2')[0]).not.toContain(record));
    });

    test('[Listview-HDR-004] a header component is not in the list s data or children', async () => {
      // Break this catches: `getRowScopedDescendants` walking the `<id>-header` slot (its slotIdsOf filter),
      // which sizes a header Text's resolved value to one copy per record before any input is typed.
      const headerLabel = child('hl1', 'hlabel', 'Text', { text: binding('Title') }, HEADER);
      await mount({ extraComponents: { srch1: headerSearch(), mir1: recordMirror(), hl1: headerLabel } });
      await waitFor(() => expect(Object.keys(exposedRow('children') || {})).toHaveLength(3));
      expect(Array.isArray(store().resolvedStore.modules[MODULE_ID].components.hl1)).toBe(false);
      [0, 1, 2].forEach((row) => {
        ['search', 'hlabel'].forEach((headerName) => {
          expect(exposedRow('children')[row]).not.toHaveProperty(headerName);
          expect(exposedRow('data')[row]).not.toHaveProperty(headerName);
        });
      });

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
      await widget.session.user.click(document.querySelector('[data-cy="pagination-button-to-next"]'));
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

    test('[Listview-CREATE-001] the role chip of a new ListView shows the record role, not the Tags sample tags', async () => {
      // Break this catches: a Tags child left on its static options (advanced off), which renders "success" for every record.
      seedApp({}, { moduleId: MODULE_ID });
      const seeded = addChildrenWidgetsToParent('Listview', LV, 'desktop');
      const extraComponents = Object.fromEntries(seeded.map((entry) => [entry.id, entry]));
      const tags = seeded.find((entry) => entry.component.component === 'Tags');

      await mount(
        {
          extraComponents,
          properties: {
            data: binding(
              `{{[{ imageURL: '', name: 'Henry, Arthur', company: 'Big Kahuna Burger Ltd.', role: 'Project manager' }]}}`
            ),
          },
        },
        1
      );

      const chip = document.querySelector(`.ele-${tags.id}`);
      await waitFor(() => expect(chip.textContent).toContain('Project manager'));
      expect(chip.textContent).not.toContain('success');
    });

    test('[Listview-HDR-006] the header Text of a new ListView uses the Figma text style', async () => {
      // Break this catches: a weight the Text Weight select has no option for (Figma's 500), which leaves
      // the Weight field blank, or a size other than 16px.
      seedApp({}, { moduleId: MODULE_ID });
      const seeded = addChildrenWidgetsToParent('Listview', LV, 'desktop');
      const styles = seeded.find((entry) => entry.component.parent === HEADER).component.definition.styles;

      expect(styles.fontWeight.value).toBe('bold');
      expect(styles.textSize.value).toBe(16);
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
      expect(header.querySelector('.resizable-slot').style.height).toBe(SLOT_HEIGHT);
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
      const withHeader = await dynamicHeightFor({ showHeader: binding('{{true}}') });

      // 3 x 80 + 2 x 12 gaps + 28 chrome without; the header replaces the top padding with itself + its 12px gap.
      expect(without).toBe(292);
      expect(withHeader).toBe(292 + FIGMA_HEADER_HEIGHT);
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
});

describe('ListviewHeaderCopyPaste', () => {
  /**
   * Copy, paste and delete of a ListView that has header components (Listview-HDR-009), through the real
   * `copyComponents`, `pasteComponents` and `deleteComponents`. Store only: the paths are slot-agnostic
   * in the UI, so what matters is where each header component is filed afterwards.
   */

  const MODULE_ID = 'canvas';
  const PAGE_ID = 'page-1';
  const LV = 'b1b1b1b1-0000-4000-8000-0000000000aa';
  const HEADER = `${LV}-header`;

  function child(id, name, type, parent, properties) {
    const definition = componentDefinition(id, name, type, properties);
    definition.component.parent = parent;
    return definition;
  }

  const components = () => useStore.getState().getCurrentPageComponents(MODULE_ID);
  const textOf = (component) => component.component.definition.properties.text.value;

  describe('Listview header: copy-paste and delete', () => {
    let clipboard;

    beforeEach(() => {
      clipboard = null;
      // defineProperty, not assign: a user-event setup earlier in this file leaves a getter-only clipboard behind.
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: jest.fn((value) => (clipboard = value)) },
      });
      seedApp(
        {
          [LV]: componentDefinition(LV, 'listview1', 'Listview', {
            dataSourceSelector: binding('rawJson'),
            data: binding(`{{[{ n: 'a' }]}}`),
            showHeader: binding('{{true}}'),
          }),
          rec1: child('rec1', 'text1', 'Text', LV, { text: binding('{{listItem.n}}') }),
          hdr1: child('hdr1', 'title1', 'Text', HEADER, { text: binding('Title') }),
        },
        { moduleId: MODULE_ID, pageId: PAGE_ID }
      );
      useStore.getState().setSelectedComponents([LV]);
    });

    afterEach(() => {
      useStore.getState().clearSelectedComponents();
      jest.clearAllMocks();
    });

    test('[Listview-HDR-009] a pasted ListView keeps its header Text under its own new header slot', async () => {
      // Break this catches: paste leaving the header Text under the old ListView's slot, or filing it on
      // the canvas or under the bare new id, so the copy shows no header or steals the original's.
      copyComponents({ isCut: false, isCloning: false });
      expect(JSON.parse(clipboard).newComponents).toHaveLength(3);
      const before = new Set(Object.keys(components()));

      await pasteComponents(undefined, JSON.parse(clipboard));

      const added = Object.entries(components()).filter(([id]) => !before.has(id));
      const newLv = added.find(([, entry]) => entry.component.component === 'Listview')[0];
      const headerTexts = added.filter(([, entry]) => entry.component.parent === `${newLv}-header`);
      expect(added).toHaveLength(3);
      expect(newLv).not.toBe(LV);
      expect(headerTexts).toHaveLength(1);
      expect(textOf(headerTexts[0][1])).toBe('Title');
      expect(components().hdr1.component.parent).toBe(HEADER);
      expect(added.filter(([, entry]) => entry.component.parent === newLv)).toHaveLength(1);
    });

    test('[Listview-HDR-009] deleting a ListView removes its header components from the store', () => {
      // Break this catches: delete walking only direct children, so header Texts stay behind as orphans
      // filed under a ListView that no longer exists.
      useStore.getState().deleteComponents([LV], MODULE_ID, { saveAfterAction: false, skipUndoRedo: true });

      expect(Object.keys(components())).toEqual([]);
      expect(toast.error).not.toHaveBeenCalled();
    });
  });
});

describe('ListviewLayoutArrangement', () => {
  /**
   * Changing a ListView's Layout re-arranges every child of the record canvas: a row in List, a stack in Grid, in
   * one undo step. Contract: frontend/ee/test/app-builder/widgets/Listview/TESTING.md (Listview-GRID-005..008).
   */

  const MODULE_ID = 'canvas';
  const LV = 'lv1';
  const OTHER = 'lv2';

  const layoutOf = (id) => useStore.getState().getCurrentPageComponents(MODULE_ID)[id].layouts.desktop;
  const modeOf = (id = LV) =>
    useStore.getState().getCurrentPageComponents(MODULE_ID)[id].component.definition.properties.mode.value;
  const setMode = (value, id = LV) =>
    useStore.getState().setComponentProperty(id, 'mode', value, 'properties', 'value', false, MODULE_ID, {
      saveAfterAction: false,
    });

  function child(id, name, type, layout, parent = LV) {
    const definition = componentDefinition(id, name, type, {});
    definition.component.parent = parent;
    definition.layouts = { desktop: layout };
    return definition;
  }

  function seed({ mode = 'list', withChildren = true, properties = {}, styles, layout } = {}) {
    const lv = componentDefinition(
      LV,
      'listview1',
      'Listview',
      {
        dataSourceSelector: binding('rawJson'),
        data: binding('{{[{ a: 1 }]}}'),
        mode: binding(mode),
        rowHeight: binding('80'),
        gridRecordHeight: binding('150'),
        ...properties,
      },
      { styles }
    );
    if (layout) lv.layouts = { desktop: layout };
    const other = componentDefinition(OTHER, 'listview2', 'Listview', {
      mode: binding('list'),
      rowHeight: binding('80'),
    });
    seedApp(
      {
        [LV]: lv,
        [OTHER]: other,
        ...(withChildren && {
          img: child('img', 'image1', 'Image', { top: 10, left: 3, width: 6, height: 60 }),
          txt: child('txt', 'text1', 'Text', { top: 25, left: 11, width: 12, height: 30 }),
          btn: child('btn', 'button1', 'Button', { top: 25, left: 25, width: 17, height: 30 }),
        }),
        hdr: child('hdr', 'title1', 'Text', { top: 10, left: 1, width: 20, height: 40 }, `${LV}-header`),
        oth: child('oth', 'text2', 'Text', { top: 5, left: 5, width: 10, height: 30 }, OTHER),
      },
      { moduleId: MODULE_ID }
    );
  }

  describe('Listview: Layout change re-arranges the record canvas', () => {
    test('[Listview-GRID-005] List to Grid stacks every child, the moved ones too, and leaves the header and other lists alone', () => {
      // Break this catches: a card that keeps the list row's side-by-side children, or stretches the Image and the Button.
      seed();
      useStore
        .getState()
        .setComponentLayout({ btn: { top: 25, left: 0, width: 17, height: 30 } }, undefined, MODULE_ID, {
          skipUndoRedo: true,
          saveAfterAction: false,
        });

      setMode('grid');

      const stack = ['btn', 'img', 'txt'].map((id) => layoutOf(id));
      // Left edge for all; Text takes the card width. The default 3 columns make a card column a third of a list column,
      // so the Image keeps its pixels as 18 columns and the 17-column Button is capped at the card.
      stack.forEach((layout) => expect(layout.left).toBe(1));
      expect(stack.map((layout) => layout.width)).toEqual([41, 18, 41]);
      expect(stack[0].top).toBeLessThan(stack[1].top);
      expect(stack[1].top).toBeLessThan(stack[2].top);
      expect(layoutOf('hdr')).toEqual({ top: 10, left: 1, width: 20, height: 40 });
      expect(layoutOf('oth')).toEqual({ top: 5, left: 5, width: 10, height: 30 });
      expect(modeOf()).toBe('grid');
    });

    test('[Listview-GRID-006] Grid to List puts the children back in the row they had', () => {
      // Break this catches: children left stacked and full width in a list.
      seed();
      setMode('grid');
      expect(layoutOf('txt').left).toBe(1);

      setMode('list');

      expect(layoutOf('img')).toEqual({ top: 10, left: 3, width: 6, height: 60 });
      expect(layoutOf('txt')).toEqual({ top: 25, left: 11, width: 12, height: 30 });
      // The List remembers its own row, so the Button comes back at its own width, not the card's.
      expect(layoutOf('btn')).toEqual({ top: 25, left: 25, width: 17, height: 30 });
    });

    test('[Listview-GRID-007] one undo restores the old Layout and every child position, a moved one included', () => {
      // Break this catches: an undo that flips the switch back but leaves the children stacked, or re-arranges them again.
      seed();
      useStore
        .getState()
        .setComponentLayout({ txt: { top: 40, left: 20, width: 12, height: 30 } }, undefined, MODULE_ID, {
          skipUndoRedo: true,
          saveAfterAction: false,
        });

      setMode('grid');
      expect(layoutOf('txt').left).toBe(1);
      useStore.getState().handleUndo();

      expect(modeOf()).toBe('list');
      expect(layoutOf('img')).toEqual({ top: 10, left: 3, width: 6, height: 60 });
      expect(layoutOf('txt')).toEqual({ top: 40, left: 20, width: 12, height: 30 });
      expect(layoutOf('btn')).toEqual({ top: 25, left: 25, width: 17, height: 30 });
      useStore.getState().handleRedo();
      expect(modeOf()).toBe('grid');
      expect(layoutOf('txt').left).toBe(1);
    });

    test('[Listview-GRID-008] choosing the Layout the list already has moves nothing', () => {
      // Break this catches: a re-arrange on every write of the Layout, which would undo a hand-made row.
      seed();
      useStore
        .getState()
        .setComponentLayout({ txt: { top: 40, left: 20, width: 12, height: 30 } }, undefined, MODULE_ID, {
          skipUndoRedo: true,
          saveAfterAction: false,
        });

      setMode('list');

      expect(layoutOf('txt')).toEqual({ top: 40, left: 20, width: 12, height: 30 });
    });

    test('[Listview-GRID-009] a record with no children changes Layout without error', () => {
      // Break this catches: a crash on a ListView whose record canvas is empty.
      seed({ withChildren: false });

      expect(() => setMode('grid')).not.toThrow();
      expect(modeOf()).toBe('grid');
    });

    test('[Listview-GRID-001] the real column widths decide: a Button keeps its pixels in a narrow 3-column card and back', () => {
      // Break this catches: keeping columns, so a Button of 8 list columns (~82px) turns into a 26px stub in a 3-column card.
      // 15 columns of 30px = 450px wide; Bordered, gap 12, 3 columns: a list column is ~10.2px, a card column ~3.2px.
      seed({
        properties: { columns: binding('{{3}}') },
        styles: { listStyle: binding('bordered'), gap: binding('{{12}}') },
        layout: { top: 0, left: 0, width: 15, height: 624 },
      });
      useGridStore.getState().actions.setSubContainerWidths('canvas', 30);
      useStore
        .getState()
        .setComponentLayout({ btn: { top: 25, left: 3, width: 8, height: 30 } }, undefined, MODULE_ID, {
          skipUndoRedo: true,
          saveAfterAction: false,
        });

      setMode('grid');
      expect(Math.abs(layoutOf('btn').width - 25)).toBeLessThanOrEqual(1);

      setMode('list');
      expect(Math.abs(layoutOf('btn').width - 8)).toBeLessThanOrEqual(1);
    });
  });
});

describe('ListviewLayoutMemory', () => {
  /**
   * List and Grid each remember their own last layout: a switch saves the current desktop layouts of the record
   * canvas's children as that Layout's memory (`properties.recordLayouts`) and restores the target Layout's memory.
   * Contract: frontend/ee/test/app-builder/widgets/Listview/TESTING.md (Listview-GRID-010..016). Store only.
   */

  const MODULE_ID = 'canvas';
  const PAGE_ID = 'page-1';
  const LV = 'b1b1b1b1-0000-4000-8000-0000000000aa';

  const components = () => useStore.getState().getCurrentPageComponents(MODULE_ID);
  const layoutOf = (id, layout = 'desktop') => components()[id].layouts[layout];
  const modeOf = () => components()[LV].component.definition.properties.mode.value;
  const memoryOf = () => components()[LV].component.definition.properties.recordLayouts?.value;
  const setMode = (value) =>
    useStore.getState().setComponentProperty(LV, 'mode', value, 'properties', 'value', false, MODULE_ID, {
      saveAfterAction: false,
    });
  const moveTo = (id, layout) =>
    useStore.getState().setComponentLayout({ [id]: layout }, undefined, MODULE_ID, {
      skipUndoRedo: true,
      saveAfterAction: false,
    });
  const { handleUndo, handleRedo } = {
    handleUndo: () => useStore.getState().handleUndo(),
    handleRedo: () => useStore.getState().handleRedo(),
  };

  const IMG = { top: 10, left: 3, width: 6, height: 60 };
  const TXT = { top: 25, left: 11, width: 12, height: 30 };
  const BTN = { top: 25, left: 25, width: 17, height: 30 };

  function child(id, name, type, layout, extra = {}) {
    const definition = componentDefinition(id, name, type, {});
    definition.component.parent = LV;
    definition.layouts = { desktop: layout, ...extra };
    return definition;
  }

  function seed({ mode = 'list', recordLayouts, gridRecordHeight = '150' } = {}) {
    seedApp(
      {
        [LV]: componentDefinition(LV, 'listview1', 'Listview', {
          dataSourceSelector: binding('rawJson'),
          data: binding('{{[{ a: 1 }]}}'),
          mode: binding(mode),
          rowHeight: binding('80'),
          gridRecordHeight: binding(gridRecordHeight),
          ...(recordLayouts && { recordLayouts: { value: recordLayouts } }),
        }),
        img: child('img', 'image1', 'Image', IMG),
        txt: child('txt', 'text1', 'Text', TXT),
        btn: child('btn', 'button1', 'Button', BTN),
      },
      { moduleId: MODULE_ID, pageId: PAGE_ID }
    );
  }

  describe('Listview: each Layout remembers its own layout', () => {
    test('[Listview-GRID-010] List to Grid and back restores the exact List layout', () => {
      // Break this catches: a rebuild on the way back (the Button would come back at the card's width, the row squeezed), or no memory saved.
      seed();
      moveTo('txt', { top: 40, left: 20, width: 9, height: 30 });

      setMode('grid');
      expect(layoutOf('txt').left).toBe(1);
      setMode('list');

      expect(layoutOf('img')).toEqual(IMG);
      expect(layoutOf('txt')).toEqual({ top: 40, left: 20, width: 9, height: 30 });
      expect(layoutOf('btn')).toEqual(BTN);
      expect(modeOf()).toBe('list');
    });

    test('[Listview-GRID-011] an edit made in Grid comes back when the list returns to Grid', () => {
      // Break this catches: the Grid layout rebuilt on every switch, so the hand-made card is lost.
      seed();
      setMode('grid');
      moveTo('btn', { top: 100, left: 20, width: 15, height: 30 });

      setMode('list');
      expect(layoutOf('btn')).toEqual(BTN);
      setMode('grid');

      expect(layoutOf('btn')).toEqual({ top: 100, left: 20, width: 15, height: 30 });
    });

    test('[Listview-GRID-011] a ListView that opens in Grid remembers it: Grid, List, Grid keeps the first Grid layout', () => {
      // Break this catches: memory kept for List only.
      seed({ mode: 'grid' });
      moveTo('img', { top: 0, left: 30, width: 6, height: 60 });

      setMode('list');
      setMode('grid');

      expect(layoutOf('img')).toEqual({ top: 0, left: 30, width: 6, height: 60 });
    });

    test('[Listview-GRID-012] a child added in Grid goes after the row in List; one added in List goes under the stack in Grid', () => {
      // Break this catches: a new child dropped at its Grid position, on top of the restored row, or at the top of the stack.
      // The card is tall enough for the stack: a child that would not fit stays inside it instead (next tests).
      seed({ gridRecordHeight: '400' });
      moveTo('btn', { top: 25, left: 25, width: 8, height: 30 });
      setMode('grid');
      useStore.getState().addComponentToCurrentPage(
        [
          {
            ...child('new1', 'button2', 'Button', { top: 200, left: 1, width: 5, height: 30 }),
            id: 'new1',
            name: 'button2',
          },
        ],
        MODULE_ID,
        { saveAfterAction: false, skipUndoRedo: true }
      );

      setMode('list');

      expect(layoutOf('img')).toEqual(IMG);
      expect(layoutOf('txt')).toEqual(TXT);
      expect(layoutOf('btn')).toEqual({ top: 25, left: 25, width: 8, height: 30 });
      expect(layoutOf('new1').left).toBeGreaterThanOrEqual(33);

      useStore.getState().addComponentToCurrentPage(
        [
          {
            ...child('new2', 'button3', 'Button', { top: 30, left: 40, width: 3, height: 30 }),
            id: 'new2',
            name: 'button3',
          },
        ],
        MODULE_ID,
        { saveAfterAction: false, skipUndoRedo: true }
      );
      setMode('grid');

      const stackBottom = Math.max(
        ...['img', 'txt', 'btn', 'new1'].map((id) => layoutOf(id).top + layoutOf(id).height)
      );
      expect(layoutOf('new2').top).toBeGreaterThanOrEqual(stackBottom);
      expect(layoutOf('new2').left).toBe(1);
    });

    test('[Listview-GRID-012] a child added in List stays inside the card when the remembered Grid layout already fills it', () => {
      // Break this catches: the new child placed below the remembered ones, past the card, where the inner box hides it.
      seed({
        recordLayouts: {
          grid: {
            img: { top: 0, left: 1, width: 6, height: 70 },
            txt: { top: 70, left: 1, width: 41, height: 80 },
          },
        },
      });

      setMode('grid');

      const box = layoutOf('btn');
      expect(box.top).toBeGreaterThanOrEqual(0);
      expect(box.top + box.height).toBeLessThanOrEqual(150);
      expect(layoutOf('img')).toEqual({ top: 0, left: 1, width: 6, height: 70 });
      expect(layoutOf('txt')).toEqual({ top: 70, left: 1, width: 41, height: 80 });
    });

    test('[Listview-GRID-012] children added in Grid do not pile on one spot when the remembered row fills the record', () => {
      // Break this catches: every added child clamped to the same right-edge box, so all but one are hidden under it.
      seed({
        mode: 'grid',
        recordLayouts: { list: { img: { top: 10, left: 0, width: 43, height: 60 } } },
      });

      setMode('list');

      const [a, b] = [layoutOf('txt'), layoutOf('btn')];
      expect(a.left + a.width).toBeLessThanOrEqual(43);
      expect(b.left + b.width).toBeLessThanOrEqual(43);
      expect(a.top).not.toBe(b.top);
      [a, b].forEach((box) => {
        expect(box.top).toBeGreaterThanOrEqual(0);
        expect(box.top + box.height).toBeLessThanOrEqual(80);
      });
    });

    test('[Listview-GRID-013] one undo of a switch restores the Layout and every child position, and the memory agrees with them', () => {
      // Break this catches: an undo that flips the Layout but leaves the children stacked, two undo steps for one switch, or a memory that disagrees with the restored page.
      seed();
      setMode('grid');
      setMode('list');
      moveTo('txt', { top: 40, left: 20, width: 9, height: 30 });

      setMode('grid');
      expect(layoutOf('txt').left).toBe(1);
      handleUndo();

      expect(modeOf()).toBe('list');
      expect(layoutOf('img')).toEqual(IMG);
      expect(layoutOf('txt')).toEqual({ top: 40, left: 20, width: 9, height: 30 });
      expect(layoutOf('btn')).toEqual(BTN);
      expect(memoryOf().list.txt).toEqual({ top: 40, left: 20, width: 9, height: 30 });

      handleRedo();
      expect(modeOf()).toBe('grid');
      expect(layoutOf('txt').left).toBe(1);
      expect(memoryOf().list.txt).toEqual({ top: 40, left: 20, width: 9, height: 30 });

      handleUndo();
      setMode('grid');
      handleUndo();
      expect(modeOf()).toBe('list');
    });

    test('[Listview-GRID-013] undoing the first switch restores the List layout, and switching again then behaves like the first time', () => {
      // Break this catches: an undo that leaves the children stacked, or a memory that makes the second try differ from the first.
      seed();
      setMode('grid');
      const stacked = ['img', 'txt', 'btn'].map((id) => layoutOf(id));
      handleUndo();

      expect(modeOf()).toBe('list');
      expect(layoutOf('img')).toEqual(IMG);
      expect(layoutOf('txt')).toEqual(TXT);
      expect(layoutOf('btn')).toEqual(BTN);

      setMode('grid');
      expect(['img', 'txt', 'btn'].map((id) => layoutOf(id))).toEqual(stacked);
    });

    test('[Listview-GRID-014] a deleted child is not restored and its id leaves the memory', () => {
      // Break this catches: a restore that recreates the child, a crash on a stale id, or a stale id kept for ever.
      seed();
      setMode('grid');
      useStore.getState().deleteComponents(['txt'], MODULE_ID, { saveAfterAction: false, skipUndoRedo: true });

      expect(() => setMode('list')).not.toThrow();

      expect(components().txt).toBeUndefined();
      expect(layoutOf('img')).toEqual(IMG);
      expect(layoutOf('btn')).toEqual(BTN);
      expect(Object.keys(memoryOf().grid)).toEqual(expect.not.arrayContaining(['txt']));
      expect(Object.keys(memoryOf().list)).toEqual(['img', 'txt', 'btn']);
      setMode('grid');
      expect(Object.keys(memoryOf().list)).toEqual(['img', 'btn']);
    });

    test('[Listview-GRID-014] an id in the memory that is no child at all is ignored', () => {
      // Break this catches: a restore that throws on, or writes a layout for, an id the page does not have.
      seed({
        mode: 'grid',
        recordLayouts: { list: { ghost: IMG, img: { top: 1, left: 2, width: 6, height: 60 } } },
      });

      setMode('list');

      expect(components().ghost).toBeUndefined();
      expect(layoutOf('img')).toEqual({ top: 1, left: 2, width: 6, height: 60 });
      expect(layoutOf('txt').top).toBeGreaterThanOrEqual(0);
    });

    test('[Listview-GRID-015] a ListView without memory arranges as before on its first switch, and the mobile layouts stay', () => {
      // Break this catches: a first switch that restores nothing and arranges nothing, or one that writes the mobile layouts.
      seed();
      const mobile = { top: 5, left: 5, width: 10, height: 30 };
      components().img.layouts.mobile = mobile;
      expect(memoryOf()).toBeUndefined();

      setMode('grid');

      expect(layoutOf('img').left).toBe(1);
      expect(layoutOf('txt').width).toBe(41);
      expect(layoutOf('img', 'mobile')).toEqual(mobile);
      expect(memoryOf().list.img).toEqual(IMG);
      expect(memoryOf().list.img.mobile).toBeUndefined();
    });

    describe('a switch made in the mobile view', () => {
      const MOBILE = { top: 5, left: 5, width: 10, height: 30 };
      const toMobile = () => {
        ['img', 'txt', 'btn'].forEach((id) => {
          components()[id].layouts.mobile = { ...MOBILE };
        });
        useStore.getState().setCurrentLayout('mobile');
      };
      afterEach(() => useStore.getState().setCurrentLayout('desktop'));

      test('[Listview-GRID-015] saves the desktop layout it leaves and arranges the desktop children for the new Layout', () => {
        // Break this catches: desktop children left in the List row while the mode says Grid, and no desktop memory.
        seed();
        toMobile();

        setMode('grid');

        expect(memoryOf().list).toEqual({ img: IMG, txt: TXT, btn: BTN });
        expect(layoutOf('txt').left).toBe(1);
        expect(layoutOf('txt').width).toBe(41);
        expect(modeOf()).toBe('grid');
      });

      test('[Listview-GRID-015] never writes the mobile layouts into the memory', () => {
        // Break this catches: the mobile boxes saved as a Layout's memory.
        seed();
        toMobile();

        setMode('grid');

        expect(JSON.stringify(memoryOf())).not.toContain('"left":5,"width":10');
        expect(layoutOf('img', 'mobile').left).toBe(1);
      });

      test('[Listview-GRID-015] leaves the desktop memory right: back on desktop, List then Grid again gives the same stack', () => {
        // Break this catches: the Grid memory saved from a List row (the card would open with the row squeezed in it).
        seed();
        toMobile();
        setMode('grid');
        const stacked = ['img', 'txt', 'btn'].map((id) => layoutOf(id));
        useStore.getState().setCurrentLayout('desktop');

        setMode('list');
        expect(['img', 'txt', 'btn'].map((id) => layoutOf(id))).toEqual([IMG, TXT, BTN]);
        setMode('grid');

        expect(['img', 'txt', 'btn'].map((id) => layoutOf(id))).toEqual(stacked);
      });

      test('[Listview-GRID-015] one undo in the mobile view restores the desktop children too', () => {
        // Break this catches: a desktop write outside the undo step of the switch.
        seed();
        toMobile();
        setMode('grid');

        handleUndo();

        expect(modeOf()).toBe('list');
        expect(['img', 'txt', 'btn'].map((id) => layoutOf(id))).toEqual([IMG, TXT, BTN]);
        expect(layoutOf('txt', 'mobile')).toEqual(MOBILE);
      });
    });

    test('[Listview-GRID-015] choosing the Layout the list already has writes no memory', () => {
      // Break this catches: a memory write on every Layout write.
      seed();

      setMode('list');

      expect(memoryOf()).toBeUndefined();
    });
  });

  describe('Listview: the layout memory reaches the other editors', () => {
    let broadcasts;

    beforeEach(() => {
      broadcasts = [];
      jest.spyOn(appVersionService, 'autoSaveApp').mockResolvedValue({});
      useStore.getState().multiplayer.setYMap({ set: (_key, update) => broadcasts.push(update) });
    });

    afterEach(() => {
      useStore.getState().multiplayer.setYMap(undefined);
      jest.restoreAllMocks();
    });

    const switchAndSave = (value) =>
      useStore.getState().setComponentProperty(LV, 'mode', value, 'properties', 'value', false, MODULE_ID);
    const componentUpdates = () => broadcasts.filter((update) => update.type === 'components');

    test('[Listview-GRID-017] a Layout switch broadcasts the memory together with the mode, memory first', () => {
      // Break this catches: only the mode sent, so a peer has no memory and its next switch overwrites it.
      seed();

      switchAndSave('grid');

      const [update] = componentUpdates();
      expect(update.diff.componentId).toBe(LV);
      expect(update.diff.updates.map((item) => item.property)).toEqual(['recordLayouts', 'mode']);
      expect(update.diff.updates[0].value).toEqual({ list: { img: IMG, txt: TXT, btn: BTN } });
      expect(update.diff.updates[1].value).toBe('grid');
    });

    test("[Listview-GRID-017] a peer that applies the broadcast holds the memory, and its next switch keeps the sender's edits", () => {
      // Break this catches: a peer without the memory, which auto-arranges and then saves its own over the sender's.
      seed();
      moveTo('txt', { top: 40, left: 20, width: 9, height: 30 });
      switchAndSave('grid');
      const [update] = componentUpdates();

      seed({ mode: 'list' });
      useStore.getState().multiplayer.processUpdate(update);
      expect(memoryOf()).toEqual({ list: { img: IMG, txt: { top: 40, left: 20, width: 9, height: 30 }, btn: BTN } });
      expect(modeOf()).toBe('grid');

      setMode('list');
      expect(layoutOf('txt')).toEqual({ top: 40, left: 20, width: 9, height: 30 });
    });

    const MOBILE = { top: 5, left: 5, width: 10, height: 30 };
    const MOVED = { top: 40, left: 20, width: 9, height: 30 };
    afterEach(() => useStore.getState().setCurrentLayout('desktop'));
    const layoutUpdate = (layouts) => ({
      type: 'components/layout',
      operation: 'update',
      pageId: useStore.getState().getCurrentPageId('canvas'),
      versionId: useStore.getState().selectedVersion?.id,
      diff: { txt: { layouts } },
    });

    test('[Listview-GRID-018] a peer in the mobile view puts a desktop move in its desktop layout, not its mobile one', () => {
      // Break this catches: every diff written to the view on screen, so the peer's next switch saves a stale desktop box.
      seed();
      components().txt.layouts.mobile = { ...MOBILE };
      useStore.getState().setCurrentLayout('mobile');

      useStore.getState().multiplayer.processUpdate(layoutUpdate({ desktop: MOVED }));

      expect(layoutOf('txt', 'desktop')).toEqual(MOVED);
      expect(layoutOf('txt', 'mobile')).toEqual(MOBILE);
      expect(useStore.getState().currentLayout).toBe('mobile');
    });

    test('[Listview-GRID-018] a peer in the desktop view puts a mobile move in its mobile layout', () => {
      // Break this catches: a mobile diff read as desktop, which writes undefined over the peer's desktop box.
      seed();
      components().txt.layouts.mobile = { ...MOBILE };

      useStore.getState().multiplayer.processUpdate(layoutUpdate({ mobile: MOVED }));

      expect(layoutOf('txt', 'mobile')).toEqual(MOVED);
      expect(layoutOf('txt', 'desktop')).toEqual(TXT);
    });

    test('[Listview-GRID-018] a desktop move reaches a peer in the desktop view as before', () => {
      // Break this catches: the common case broken by the per-layout write, for every widget.
      seed();

      useStore.getState().multiplayer.processUpdate(layoutUpdate({ desktop: MOVED }));

      expect(layoutOf('txt', 'desktop')).toEqual(MOVED);
    });
  });

  describe('Listview: the layout memory follows a copy', () => {
    let clipboard;

    beforeEach(() => {
      clipboard = null;
      // defineProperty, not assign: a user-event setup earlier in this file leaves a getter-only clipboard behind.
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: jest.fn((value) => (clipboard = value)) },
      });
      seed({
        mode: 'grid',
        recordLayouts: {
          list: { img: IMG, txt: TXT, btn: BTN, gone: { top: 0, left: 0, width: 3, height: 10 } },
        },
      });
      useStore.getState().setSelectedComponents([LV]);
    });

    afterEach(() => {
      useStore.getState().clearSelectedComponents();
      jest.clearAllMocks();
    });

    test('[Listview-GRID-016] a pasted ListView remembers its List layout under the new child ids, and drops ids that were not copied', async () => {
      // Break this catches: a memory keyed by the old ids (the copy would restore nothing) or one that carries a foreign id over.
      copyComponents({ isCut: false, isCloning: false });
      const before = new Set(Object.keys(components()));

      await pasteComponents(undefined, JSON.parse(clipboard));

      const added = Object.entries(components()).filter(([id]) => !before.has(id));
      const newLv = added.find(([, entry]) => entry.component.component === 'Listview')[0];
      const byType = (type) => added.find(([, entry]) => entry.component.component === type)[0];
      const copied = components()[newLv].component.definition.properties.recordLayouts.value;
      expect(Object.keys(copied.list).sort()).toEqual([byType('Image'), byType('Text'), byType('Button')].sort());
      expect(copied.list[byType('Image')]).toEqual(IMG);
      expect(copied.list[byType('Button')]).toEqual(BTN);
      expect(copied.list.gone).toBeUndefined();
      // The original is untouched.
      expect(Object.keys(memoryOf().list)).toEqual(['img', 'txt', 'btn', 'gone']);
    });
  });
});

describe('ListviewOverflow', () => {
  /**
   * Listview overflow rule, for every ListView (Legacy and the new styles), in records and in the header slot:
   * Text wraps while it fits; when it does not fit its box the last visible line ends with an ellipsis (a
   * multi-line clamp of as many lines as the box holds, one line for a one-line box) and a tooltip shows the full
   * text. Text with Dynamic height keeps growing. A Button label is one line with an ellipsis and a tooltip.
   * Only components inside a ListView change. Contract: frontend/ee/test/app-builder/widgets/Listview/TESTING.md
   * (Listview-OVF-001..010). Real store, real RenderWidget.
   */

  const ID = 'b1b1b1b1-0000-4000-8000-0000000000bb';
  const HEADER = `${ID}-header`;
  const LONG = 'A very long record title that cannot fit in a narrow card';
  const FIELD_BY_FORMAT = { plainText: 'plain', markdown: 'md', html: 'html' };
  const RECORDS = `{{[{ plain: '${LONG}', md: '**${LONG}**', html: '<b>${LONG}</b>', cta: '${LONG} button' }]}}`;
  // Default Text: 14px at line height 1.5 is 21px a line; the box loses 2px to its border.
  const ONE_LINE_BOX = 30;
  const THREE_LINE_BOX = 70;

  function child(id, name, type, properties, { parent = ID, height = ONE_LINE_BOX } = {}) {
    const definition = componentDefinition(id, name, type, properties);
    definition.component.parent = parent;
    definition.component.definition.styles = {};
    definition.component.definition.others = {
      showOnDesktop: binding('{{true}}'),
      showOnMobile: binding('{{false}}'),
    };
    definition.layouts.desktop.height = height;
    return definition;
  }

  const recordText = (format, height, extra = {}) =>
    child(
      'txt1',
      'text1',
      'Text',
      { text: binding(`{{listItem.${FIELD_BY_FORMAT[format]}}}`), textFormat: binding(format), ...extra },
      { height }
    );
  const headerText = (format, height) =>
    child(
      'hdr1',
      'headerText',
      'Text',
      {
        text: binding(format === 'plainText' ? LONG : format === 'markdown' ? `**${LONG}**` : `<b>${LONG}</b>`),
        textFormat: binding(format),
      },
      { parent: HEADER, height }
    );

  const listview = createWidgetHarness({
    componentType: 'Listview',
    handle: 'listview1',
    id: ID,
    defaultProperties: {
      dataSourceSelector: binding('rawJson'),
      data: binding(RECORDS),
      mode: binding('list'),
      columns: binding('{{1}}'),
      rowHeight: binding('80'),
      loadingState: binding('{{false}}'),
      dynamicHeight: binding('{{false}}'),
      visibility: binding('{{true}}'),
      disabledState: binding('{{false}}'),
      enablePagination: binding('{{false}}'),
    },
    defaultStyles: {
      backgroundColor: binding('var(--cc-surface1-surface)'),
      borderColor: binding('var(--cc-weak-border)'),
    },
    defaultExtraComponents: {
      txt1: recordText('plainText', ONE_LINE_BOX),
      btn1: child('btn1', 'button1', 'Button', { text: binding('{{listItem.cta}}') }),
    },
    capabilities: { dnd: true },
    preload: ['Tags'],
    widgetHeight: 300,
    widgetWidth: 200,
  });

  const standaloneText = createWidgetHarness({
    componentType: 'Text',
    handle: 'text9',
    id: 'txt9',
    defaultProperties: {
      text: binding(LONG),
      textFormat: binding('plainText'),
      visibility: binding('{{true}}'),
      loadingState: binding('{{false}}'),
    },
    widgetHeight: ONE_LINE_BOX,
    widgetWidth: 200,
  });

  const FORMATS = ['plainText', 'markdown', 'html'];
  const STYLES = [['legacy'], ['bordered'], ['card']];

  const sectionChild = (scope) => document.querySelector(`${scope} .text-widget-section > div`);
  const recordText1 = () => sectionChild('.list-item');
  const headerText1 = () => sectionChild('.listview-header-wrapper');
  const recordButtonLabel = () => document.querySelector('.list-item [data-cy$="-label"]');
  const headerButtonLabel = () => document.querySelector('.listview-header-wrapper [data-cy$="-label"]');
  const lineClamp = (node) => String(node.style.WebkitLineClamp ?? '');
  const isClamped = (node) => lineClamp(node) !== '' || node.style.whiteSpace === 'nowrap';
  // react-markdown is stubbed under jest and renders the raw source, so Markdown text is asserted with `toContain`.
  const tooltip = () => document.querySelector('[role="tooltip"]');

  // jsdom has no layout: report the content as bigger than its box, or as fitting (browser geometry is a genuine boundary).
  const spies = [];
  const setGeometry = ({ overflowing }) => {
    spies.splice(0).forEach((spy) => spy.mockRestore());
    const [scroll, client] = overflowing ? [400, 100] : [100, 100];
    ['scrollWidth', 'scrollHeight'].forEach((name) =>
      spies.push(jest.spyOn(HTMLElement.prototype, name, 'get').mockReturnValue(scroll))
    );
    ['clientWidth', 'clientHeight'].forEach((name) =>
      spies.push(jest.spyOn(HTMLElement.prototype, name, 'get').mockReturnValue(client))
    );
  };
  beforeEach(() => setGeometry({ overflowing: true }));
  afterEach(() => spies.splice(0).forEach((spy) => spy.mockRestore()));

  const mountRecord = async (options = {}) => {
    listview.render({ currentMode: 'view', ...options });
    await waitFor(() => expect(recordText1() ?? recordButtonLabel()).toBeInTheDocument());
  };
  const mountHeader = async (format, height) => {
    listview.render({
      currentMode: 'view',
      properties: { showHeader: binding('{{true}}') },
      extraComponents: {
        hdr1: headerText(format, height),
        btn2: child('btn2', 'button2', 'Button', { text: binding(`${LONG} header`) }, { parent: HEADER }),
      },
    });
    await waitFor(() => expect(headerText1()).toBeInTheDocument());
  };

  describe('Listview: overflow', () => {
    beforeEach(listview.setup);
    afterEach(listview.teardown);

    test.each(FORMATS)(
      '[Listview-OVF-001] %s text in a one-line box clamps to one line with an ellipsis',
      async (format) => {
        // Break this catches: a one-line card whose title wraps onto a second line and spills out of the record.
        await mountRecord({ extraComponents: { txt1: recordText(format, ONE_LINE_BOX) } });

        const text = recordText1();
        expect(text.textContent).toContain(LONG);
        if (format === 'plainText') {
          expect(text.style.whiteSpace).toBe('nowrap');
          expect(text.style.textOverflow).toBe('ellipsis');
        } else {
          expect(lineClamp(text)).toBe('1');
        }
        expect(text.style.overflow).toBe('hidden');
      }
    );

    test.each(FORMATS)(
      '[Listview-OVF-002] %s text in a three-line box wraps and clamps to three lines',
      async (format) => {
        // Break this catches: a tall box cut to one line, or text that runs past its box without an ellipsis.
        await mountRecord({ extraComponents: { txt1: recordText(format, THREE_LINE_BOX) } });

        const text = recordText1();
        expect(text.textContent).toContain(LONG);
        expect(lineClamp(text)).toBe('3');
        expect(text.style.whiteSpace).not.toBe('nowrap');
        expect(text.style.overflow).toBe('hidden');
      }
    );

    test.each(FORMATS)(
      '[Listview-OVF-003] %s text with Dynamic height keeps growing and is not clamped',
      async (format) => {
        // Break this catches: a Dynamic height Text that stops growing and hides its tail behind an ellipsis.
        await mountRecord({
          extraComponents: { txt1: recordText(format, ONE_LINE_BOX, { dynamicHeight: binding('{{true}}') }) },
        });

        expect(isClamped(recordText1())).toBe(false);
        await listview.session.user.hover(recordText1());
        expect(tooltip()).toBeNull();
      }
    );

    test.each(FORMATS)(
      '[Listview-OVF-004] %s text shows the full text in a tooltip when it overflows',
      async (format) => {
        // Break this catches: text clipped with no way to read the rest.
        await mountRecord({ extraComponents: { txt1: recordText(format, ONE_LINE_BOX) } });

        await listview.session.user.hover(recordText1());

        await waitFor(() => expect(tooltip()?.textContent).toContain(LONG));
      }
    );

    test.each(FORMATS)('[Listview-OVF-004] %s text that fits shows no tooltip', async (format) => {
      // Break this catches: a tooltip on every record, repeating text that is fully visible.
      setGeometry({ overflowing: false });
      await mountRecord({ extraComponents: { txt1: recordText(format, ONE_LINE_BOX) } });

      await listview.session.user.hover(recordText1());

      expect(tooltip()).toBeNull();
    });

    test.each(STYLES)('[Listview-OVF-005] the rule holds in the %s style', async (listStyle) => {
      // Break this catches: the rule applied to the new styles only, leaving saved Legacy ListViews wrapping.
      await mountRecord({
        styles: { listStyle: binding(listStyle) },
        extraComponents: { txt1: recordText('html', THREE_LINE_BOX) },
      });

      expect(lineClamp(recordText1())).toBe('3');
    });

    test('[Listview-OVF-007] a Button label in a record is one line with an ellipsis and a tooltip', async () => {
      // Break this catches: a button label that wraps ("But\n1") inside a narrow grid card.
      await mountRecord();

      expect(recordButtonLabel().style.whiteSpace).toBe('nowrap');
      expect(recordButtonLabel().style.textOverflow).toBe('ellipsis');
      await listview.session.user.hover(recordButtonLabel());
      await waitFor(() => expect(tooltip()?.textContent).toBe(`${LONG} button`));
    });
  });

  describe('Listview: overflow in the header slot', () => {
    beforeEach(listview.setup);
    afterEach(listview.teardown);

    test.each(FORMATS)(
      '[Listview-OVF-006] %s Text in the header clamps to its box and shows a tooltip',
      async (format) => {
        // Break this catches: the rule covering the records only, so a long header title wraps out of the header.
        await mountHeader(format, THREE_LINE_BOX);

        expect(lineClamp(headerText1())).toBe('3');
        await listview.session.user.hover(headerText1());
        await waitFor(() => expect(tooltip()?.textContent).toContain(LONG));
      }
    );

    test('[Listview-OVF-008] a Button label in the header is one line with an ellipsis and a tooltip', async () => {
      // Break this catches: the header Button wrapping its label while the record Buttons clip.
      await mountHeader('plainText', ONE_LINE_BOX);

      expect(headerButtonLabel().style.whiteSpace).toBe('nowrap');
      expect(headerButtonLabel().style.textOverflow).toBe('ellipsis');
      await listview.session.user.hover(headerButtonLabel());
      await waitFor(() => expect(tooltip()?.textContent).toBe(`${LONG} header`));
    });
  });

  describe('Text outside a ListView', () => {
    beforeEach(standaloneText.setup);
    afterEach(standaloneText.teardown);

    test.each(FORMATS)(
      '[Listview-OVF-009] a %s Text outside a ListView keeps wrapping and shows no tooltip',
      async (format) => {
        // Break this catches: the clipping leaking to every Text in the app.
        standaloneText.render({ currentMode: 'view', properties: { textFormat: binding(format) } });
        await waitFor(() => expect(sectionChild('')).toBeInTheDocument());

        expect(isClamped(sectionChild(''))).toBe(false);
        await standaloneText.session.user.hover(sectionChild(''));
        expect(tooltip()).toBeNull();
      }
    );
  });

  const TAGS_DATA = `{{[{ title: 'Chief executive officer', color: 'rgb(1, 2, 3)', textColor: 'rgb(4, 5, 6)' }]}}`;
  const tagsChild = (extra = {}) =>
    child(
      'tag1',
      'tags1',
      'Tags',
      { advanced: binding('{{true}}'), data: binding(TAGS_DATA), ...extra },
      { height: 40 }
    );
  const chipOf = (scope) => document.querySelector(`${scope} .badge`);
  const chipLabel = (scope) => chipOf(scope).querySelector('div');

  const standaloneTags = createWidgetHarness({
    componentType: 'Tags',
    handle: 'tags9',
    id: 'tag9',
    defaultProperties: { advanced: binding('{{true}}'), data: binding(TAGS_DATA), overflow: binding('wrap') },
    defaultStyles: { size: binding('large') },
    widgetHeight: 40,
    widgetWidth: 120,
  });

  describe('Listview: a Tags chip follows the overflow rule', () => {
    beforeEach(listview.setup);
    afterEach(listview.teardown);

    test.each(['scroll', 'wrap'])(
      '[Listview-OVF-010] a too-wide chip in %s mode is capped at the box and ellipsized',
      async (overflow) => {
        // Break this catches: a chip wider than its box whose label is cut on both sides and loses its padding.
        await listview.render({
          currentMode: 'view',
          extraComponents: { tag1: tagsChild({ overflow: binding(overflow) }) },
        });
        await waitFor(() => expect(chipOf('.list-item')).toBeInTheDocument());

        const chip = chipOf('.list-item');
        expect(Number.parseFloat(chip.style.maxWidth)).toBeGreaterThan(0);
        expect(chip.style.maxWidth).toMatch(/px$/);
        expect(chip.style.padding).not.toBe('');
        expect(chipLabel('.list-item').style.whiteSpace).toBe('nowrap');
        expect(chipLabel('.list-item').style.textOverflow).toBe('ellipsis');
        expect(chipLabel('.list-item').style.overflow).toBe('hidden');
        expect(chipLabel('.list-item').textContent).toBe('Chief executive officer');
      }
    );

    test('[Listview-OVF-010] the full label shows in a tooltip only when the chip is cut', async () => {
      // Break this catches: no way to read a cut label, or a tooltip on every chip that fits.
      await listview.render({ currentMode: 'view', extraComponents: { tag1: tagsChild() } });
      await waitFor(() => expect(chipOf('.list-item')).toBeInTheDocument());
      await listview.session.user.hover(chipLabel('.list-item'));
      await waitFor(() => expect(tooltip()?.textContent).toBe('Chief executive officer'));
    });

    test('[Listview-OVF-010] a chip that fits shows no tooltip', async () => {
      // Break this catches: a tooltip repeating a fully visible label.
      setGeometry({ overflowing: false });
      await listview.render({ currentMode: 'view', extraComponents: { tag1: tagsChild() } });
      await waitFor(() => expect(chipOf('.list-item')).toBeInTheDocument());
      await listview.session.user.hover(chipLabel('.list-item'));
      expect(tooltip()).toBeNull();
    });
  });

  describe('Tags outside a ListView', () => {
    beforeEach(standaloneTags.setup);
    afterEach(standaloneTags.teardown);

    test('[Listview-OVF-010] a chip outside a ListView keeps its own sizing and shows no tooltip', async () => {
      // Break this catches: the clipping leaking to every Tags widget in the app.
      standaloneTags.render({ currentMode: 'view' });
      await waitFor(() => expect(chipOf('')).toBeInTheDocument());

      expect(chipOf('').style.maxWidth).toBe('');
      expect(chipOf('').querySelector('div')).toBeNull();
      await standaloneTags.session.user.hover(chipOf(''));
      expect(tooltip()).toBeNull();
    });
  });
});

describe('ListviewPager', () => {
  /**
   * Listview 2.0 pager: every List View shows Table's pager (no « », no "Showing x of y") in a 60px footer
   * that is a normal part of the layout. Contract: frontend/ee/test/app-builder/widgets/Listview/TESTING.md
   * (Listview-PAG-010..015). Real store, real RenderWidget.
   */

  const ID = 'lv1';
  const NAME = 'listview1';
  const records = (count) =>
    `{{${JSON.stringify(Array.from({ length: count }, (_, index) => ({ name: `r${index}` })))}}}`;

  function textChild() {
    const definition = componentDefinition('txt1', 'text1', 'Text', { text: binding('{{listItem.name}}') });
    definition.component.parent = ID;
    definition.component.definition.styles = {};
    definition.component.definition.others = {
      showOnDesktop: binding('{{true}}'),
      showOnMobile: binding('{{false}}'),
    };
    return definition;
  }

  const widget = createWidgetHarness({
    componentType: 'Listview',
    handle: NAME,
    id: ID,
    defaultProperties: {
      dataSourceSelector: binding('rawJson'),
      data: binding(records(40)),
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
    defaultExtraComponents: { txt1: textChild() },
    capabilities: { dnd: true },
    widgetHeight: 600,
    widgetWidth: 600,
  });

  const user = () => widget.session.user;
  const exposed = (key) => widget.exposed()?.[key];
  const container = () => document.getElementById(ID);
  const rows = () => [...document.querySelectorAll('.list-item')];
  const rowTexts = () => rows().map((node) => node.textContent);
  const cy = (name) => document.querySelector(`[data-cy="${name}"]`);
  const cyAll = (name) => [...document.querySelectorAll(`[data-cy="${name}"]`)];
  const pageLabels = () => cyAll('pagination-button-go-to-page').map((node) => node.textContent.trim());
  const footer = () => cy('container-pagination');
  const fired = (key) => store().getVariable(key, MODULE_ID) ?? 0;

  const PAGE_EVENT = {
    id: 'evt-page',
    index: 0,
    sourceId: ID,
    name: 'evt-page',
    target: 'component',
    event: {
      eventId: 'onPageChanged',
      actionId: 'set-custom-variable',
      key: 'pageCalls',
      value: '{{(variables.pageCalls ?? 0) + 1}}',
    },
  };

  async function mount(options = {}) {
    widget.render({ currentMode: 'view', ...options });
    await waitFor(() => expect(rows().length).toBeGreaterThan(0));
  }

  describe('Listview: pager', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test('[Listview-PAG-010] the pager is Table\'s: previous, numbers, more, next; no first, last or "Showing"', async () => {
      // Break this catches: the old Bootstrap pager with « » and "Showing x to y of z".
      await mount();

      expect(cy('pagination-section')).toBeInTheDocument();
      expect(cy('pagination-button-to-previous')).toBeDisabled();
      expect(cy('pagination-button-to-next')).toBeEnabled();
      expect(pageLabels()).toEqual(['1', '2', '3']);
      expect(cy('pagination-button-more-pages')).toBeInTheDocument();
      expect(cy('pagination-button-to-first')).toBeNull();
      expect(cy('pagination-button-to-last')).toBeNull();
      expect(footer().textContent).not.toMatch(/Showing/i);
      expect(document.querySelector('.pagination')).toBeNull();
    });

    test.each([
      [300, ['1', '2', '3'], true],
      [220, ['1', '2', '3'], true],
      [219, ['1'], true],
      [180, ['1'], true],
      [160, ['1'], true],
      [159, ['1'], false],
      [140, ['1'], false],
    ])(
      '[Listview-PAG-011] a %ipx list shows numbers %j and the page list button: %s',
      async (widgetWidth, numbers, more) => {
        // Break this catches: one rule for every width; Figma shows ‹ 1 2 3 ••• › at 260, ‹ 1 ••• › at 180 and ‹ 1 › at 140.
        await mount({ widgetWidth });

        expect(pageLabels()).toEqual(numbers);
        expect(!!cy('pagination-button-more-pages')).toBe(more);
        expect(cy('pagination-button-to-previous')).toBeInTheDocument();
        expect(cy('pagination-button-to-next')).toBeInTheDocument();
      }
    );

    test('[Listview-PAG-012] the footer is a 60px flex item, not fixed to the bottom, and the list keeps its full height', async () => {
      // Break this catches: the fixed-bottom footer and the 54px taken off the list height.
      await mount();

      expect(footer().style.height).toBe('60px');
      expect(footer().className).not.toContain('fixed-bottom');
      expect(footer().style.position).not.toBe('fixed');
      // The canvas hands a widget its box minus 4px; nothing more comes off for the pager.
      expect(container().style.height).toBe('596px');
      expect(container().contains(footer())).toBe(true);
      expect(footer().style.justifyContent).toBe('center');
    });

    test('[Listview-PAG-013] a Legacy list gets the same pager', async () => {
      // Break this catches: keeping the old pager for saved lists.
      await mount({ styles: { listStyle: binding('legacy') } });

      expect(cy('pagination-section')).toBeInTheDocument();
      expect(cy('pagination-button-to-first')).toBeNull();
      expect(footer().style.height).toBe('60px');
    });

    test('[Listview-PAG-014] next, a number and the page list change the page and fire On page change', async () => {
      // Break this catches: a pager that moves the list without the event, or a page list that goes nowhere.
      await mount({ events: [PAGE_EVENT] });

      await user().click(cy('pagination-button-to-next'));
      await waitFor(() => expect(exposed('pageIndex')).toBe(2));
      expect(rowTexts()[0]).toBe('r5');
      await user().click(cyAll('pagination-button-go-to-page').find((node) => node.textContent.trim() === '3'));
      await waitFor(() => expect(exposed('pageIndex')).toBe(3));
      await user().click(cy('pagination-button-to-previous'));
      await waitFor(() => expect(exposed('pageIndex')).toBe(2));
      await waitFor(() => expect(fired('pageCalls')).toBe(3));
    });

    test('[Listview-PAG-015] with pagination on and no records the footer stays, empty', async () => {
      // Break this catches: the footer collapsing, so the list resizes when data arrives.
      widget.render({ currentMode: 'view', properties: { data: binding('{{[]}}') } });
      await waitFor(() => expect(container()).toBeInTheDocument());

      expect(footer()).toBeInTheDocument();
      expect(footer().style.height).toBe('60px');
      expect(cy('pagination-section')).toBeNull();
    });
  });
});

describe('ListviewRecordClip', () => {
  /**
   * The viewer rule in `listview.scss` that hides the record canvas's own scrollbar when Dynamic height is on must keep
   * matching the record canvas, whatever sits between `.list-item` and `.sub-canvas` (tj-ee#5560 review).
   * Contract: frontend/ee/test/app-builder/widgets/Listview/TESTING.md (Listview-ROW-008).
   *
   * jsdom has no layout, so the scrollbar itself is a browser check; here the real compiled stylesheet is matched
   * against the real rendered records.
   */

  const sass = require('sass');

  const ID = 'lv1';

  const clipSelectors = () => {
    const { css } = sass.compileString(fs.readFileSync(path.resolve(__dirname, '../../listview.scss'), 'utf8'));
    return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter(([, , body]) => /overflow-y:\s*hidden\s*!important/.test(body))
      .flatMap(([, selector]) => selector.split(',').map((part) => part.trim()));
  };

  const matchesRule = (element, selectors) => selectors.some((selector) => element.matches(selector));

  const text = componentDefinition('txt1', 'text1', 'Text', { text: binding('{{listItem.name}}') });
  text.component.parent = ID;

  const widget = createWidgetHarness({
    componentType: 'Listview',
    handle: 'listview1',
    id: ID,
    defaultProperties: {
      dataSourceSelector: binding('rawJson'),
      data: binding('{{[{ name: "a" }, { name: "b" }, { name: "c" }]}}'),
      mode: binding('list'),
      columns: binding('{{1}}'),
      rowHeight: binding('100'),
      loadingState: binding('{{false}}'),
      dynamicHeight: binding('{{true}}'),
      visibility: binding('{{true}}'),
      collapseWhenHidden: binding('{{false}}'),
      disabledState: binding('{{false}}'),
      showBorder: binding('{{true}}'),
      rowsPerPage: binding('{{3}}'),
      enablePagination: binding('{{false}}'),
    },
    defaultStyles: {},
    defaultExtraComponents: { txt1: text },
    capabilities: { dnd: true },
    widgetHeight: 800,
    widgetWidth: 600,
  });

  // The viewer's wrappers around a widget, as the released app renders them.
  const inViewer = (row) => {
    const viewer = document.createElement('div');
    viewer.className = 'viewer';
    viewer.innerHTML = '<div class="dynamic-height-target"><div class="canvas-component"></div></div>';
    viewer.querySelector('.canvas-component').appendChild(row.cloneNode(true));
    document.body.appendChild(viewer);
    return viewer;
  };

  describe('Listview record canvas: the viewer Dynamic height rule', () => {
    beforeEach(widget.setup);
    afterEach(() => {
      widget.teardown();
      document.querySelectorAll('.viewer').forEach((node) => node.remove());
    });

    test('[Listview-ROW-008] the rule matches the canvas of every record the ListView renders', async () => {
      // Break this catches: a box added between the record and its canvas that the selector does not know about (the scrollbar returns in preview).
      widget.render({ currentMode: 'view' });
      await waitFor(() => expect(document.querySelectorAll('.list-item')).toHaveLength(3));
      const selectors = clipSelectors();
      expect(selectors.length).toBeGreaterThan(0);

      [...document.querySelectorAll('.list-item')].forEach((row) => {
        const viewer = inViewer(row);
        const canvas = viewer.querySelector('.list-item .sub-canvas');
        expect(canvas).not.toBeNull();
        expect(matchesRule(canvas, selectors)).toBe(true);
      });
    });

    test('[Listview-ROW-008] the rule still matches a record canvas that sits directly in the record', () => {
      // Break this catches: a selector rewritten for the box only, so a record rendered without it loses the rule.
      const viewer = document.createElement('div');
      viewer.className = 'viewer';
      viewer.innerHTML =
        '<div class="dynamic-height-target"><div class="canvas-component"><div class="list-item"><div class="sub-canvas"></div></div></div></div>';
      document.body.appendChild(viewer);

      expect(matchesRule(viewer.querySelector('.sub-canvas'), clipSelectors())).toBe(true);
    });

    test('[Listview-ROW-008] the rule does not reach a record canvas outside the viewer', async () => {
      // Break this catches: the `.viewer` scope dropped, which would hide the builder canvas's scrollbar.
      widget.render({ currentMode: 'view' });
      await waitFor(() => expect(document.querySelectorAll('.list-item')).toHaveLength(3));
      const wrapper = document.createElement('div');
      wrapper.innerHTML = '<div class="dynamic-height-target"><div class="canvas-component"></div></div>';
      wrapper.querySelector('.canvas-component').appendChild(document.querySelector('.list-item').cloneNode(true));
      document.body.appendChild(wrapper);

      expect(matchesRule(wrapper.querySelector('.sub-canvas'), clipSelectors())).toBe(false);
      wrapper.remove();
    });
  });
});

describe('ListviewRecordResize', () => {
  /**
   * Listview 2.0 drag-resize of the record height (tj-ee#5560). Contract: frontend/ee/test/app-builder/widgets/Listview/TESTING.md
   * (Listview-RSZ-001..004). Real store, real RenderWidget, the real handle element and the real, unmocked resize hook.
   *
   * The pointer is driven the way a browser does it: mousedown on the handle, mousemove and mouseup on `document`.
   * jsdom does no layout (clientHeight is 0), so the start height must come from the saved property, not from the DOM.
   */

  const ID = 'lv1';
  const INNER = 'lv2';
  const records = (count) =>
    `{{${JSON.stringify(Array.from({ length: count }, (_, index) => ({ name: `r${index}` })))}}}`;

  function child(id, name, type, properties, parent = ID) {
    const definition = componentDefinition(id, name, type, properties);
    definition.component.parent = parent;
    definition.component.definition.styles = {};
    definition.component.definition.others = {
      showOnDesktop: binding('{{true}}'),
      showOnMobile: binding('{{false}}'),
    };
    return definition;
  }

  const baseProperties = {
    dataSourceSelector: binding('rawJson'),
    data: binding(records(7)),
    mode: binding('list'),
    columns: binding('{{1}}'),
    rowHeight: binding('100'),
    loadingState: binding('{{false}}'),
    dynamicHeight: binding('{{false}}'),
    visibility: binding('{{true}}'),
    collapseWhenHidden: binding('{{false}}'),
    disabledState: binding('{{false}}'),
    showBorder: binding('{{true}}'),
    rowsPerPage: binding('{{3}}'),
    enablePagination: binding('{{true}}'),
  };
  const baseStyles = {
    backgroundColor: binding('var(--cc-surface1-surface)'),
    borderColor: binding('var(--cc-weak-border)'),
  };

  const textChild = () => child('txt1', 'text1', 'Text', { text: binding('{{listItem.name}}') });

  const widget = createWidgetHarness({
    componentType: 'Listview',
    handle: 'listview1',
    id: ID,
    defaultProperties: baseProperties,
    defaultStyles: baseStyles,
    defaultExtraComponents: { txt1: textChild() },
    capabilities: { dnd: true },
    widgetHeight: 800,
    widgetWidth: 600,
  });

  const NESTED = `{{[{ name: 'o1', items: [{ name: 'a' }, { name: 'b' }] }, { name: 'o2', items: [{ name: 'c' }, { name: 'd' }] }]}}`;
  const innerListview = () =>
    child(INNER, 'listview2', 'Listview', {
      ...baseProperties,
      data: binding('{{listItem.items}}'),
      rowsPerPage: binding('{{10}}'),
      enablePagination: binding('{{false}}'),
      rowHeight: binding('100'),
    });
  const innerText = () => child('txt2', 'text2', 'Text', { text: binding('{{listItem.name}}') }, INNER);

  const nestedWidget = createWidgetHarness({
    componentType: 'Listview',
    handle: 'listview1',
    id: ID,
    defaultProperties: {
      ...baseProperties,
      data: binding(NESTED),
      rowsPerPage: binding('{{1}}'),
      rowHeight: binding('250'),
    },
    defaultStyles: baseStyles,
    defaultExtraComponents: { [INNER]: innerListview(), txt2: innerText() },
    capabilities: { dnd: true },
    widgetHeight: 900,
    widgetWidth: 600,
  });

  const rows = () => [...document.querySelectorAll('.list-item')];
  const handles = () => [...document.querySelectorAll('.list-item .resize-handle')];
  const heights = () => rows().map((row) => row.style.height);
  const faded = () => rows().map((row) => row.style.opacity === '0.4');
  const framed = () => rows().map((row) => row.classList.contains('listview-record-moving'));
  const gridded = () => rows().map((row) => !!row.querySelector('.show-grid'));
  const raw = (key, id = ID) => store().getComponentDefinition(id, MODULE_ID).component.definition.properties[key];

  const START_Y = 300;
  // A drag as the browser sends it; `moves` are clientY offsets from the mousedown, the last one is where the button is released.
  function drag(handle, moves, { button = 0 } = {}) {
    fireEvent.mouseDown(handle, { clientX: 0, clientY: START_Y, button });
    moves.forEach((delta) => fireEvent.mouseMove(document, { clientX: 0, clientY: START_Y + delta }));
    fireEvent.mouseUp(document, { clientX: 0, clientY: START_Y + (moves[moves.length - 1] ?? 0) });
  }

  async function mount(harness, options = {}, count = 3) {
    harness.render({ currentMode: 'edit', ...options });
    await waitFor(() => expect(rows()).toHaveLength(count));
  }

  describe('Listview record resize: the written height', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test('[Listview-RSZ-001] 100 dragged down 33 becomes 130', async () => {
      // Break this catches: no rounding to steps of 10 (133), or no write at all.
      await mount(widget);
      expect(heights()).toEqual(['100px', '100px', '100px']);

      drag(handles()[0], [33]);

      await waitFor(() => expect(raw('rowHeight').value).toBe(130));
      expect(heights()).toEqual(['130px', '130px', '130px']);
    });

    test.each([
      [34, 130],
      [35, 140],
      [-33, 70],
      [-36, 60],
      [-500, 10],
      [900, 1000],
      [1234, 1330],
    ])('[Listview-RSZ-001] 100 dragged by %i becomes %i', async (delta, expected) => {
      // Break this catches: rounding down instead of to the nearest 10, a drag up that grows, or a floor missing at 10 or a cap added above.
      await mount(widget);

      drag(handles()[0], [delta]);

      await waitFor(() => expect(raw('rowHeight').value).toBe(expected));
      expect(heights()[0]).toBe(`${expected}px`);
    });

    test('[Listview-RSZ-001] a record that starts off the 10-step grid snaps from its own height: 104 plus 36 is 140', async () => {
      // Break this catches: snapping the delta (104 + 40) instead of the resulting height, or starting from the DOM (0 in jsdom).
      await mount(widget, { properties: { rowHeight: binding('104') } });

      drag(handles()[0], [36]);

      await waitFor(() => expect(raw('rowHeight').value).toBe(140));
    });

    test('[Listview-RSZ-001] the last move wins, however far the pointer went on the way', async () => {
      // Break this catches: writing the largest move, or the first one.
      await mount(widget);

      drag(handles()[0], [200, -40, 52]);

      await waitFor(() => expect(raw('rowHeight').value).toBe(150));
    });

    test('[Listview-RSZ-001] the value is written as a number, so the Inspector field and the record read the same thing', async () => {
      // Break this catches: a string such as "130px" or "130" in the property.
      await mount(widget);

      drag(handles()[0], [30]);

      await waitFor(() => expect(typeof raw('rowHeight').value).toBe('number'));
    });

    test('[Listview-RSZ-001] a click without a move writes nothing', async () => {
      // Break this catches: a write on mouseup with the DOM height (0 in jsdom), or rewriting the same value.
      await mount(widget);

      drag(handles()[0], []);

      expect(raw('rowHeight')).toEqual({ value: '100' });
      expect(heights()).toEqual(['100px', '100px', '100px']);
    });

    test('[Listview-RSZ-001] dragging out and back to the start height writes nothing', async () => {
      // Break this catches: a write whenever any move happened.
      await mount(widget);

      drag(handles()[0], [60, 2]);

      expect(raw('rowHeight')).toEqual({ value: '100' });
    });

    test('[Listview-RSZ-001] a right-click on the handle does nothing', async () => {
      // Break this catches: a context-menu press starting a resize.
      await mount(widget);

      drag(handles()[0], [60], { button: 2 });

      expect(raw('rowHeight')).toEqual({ value: '100' });
      expect(faded()).toEqual([false, false, false]);
    });

    test('[Listview-RSZ-001] the records show the live height during the drag, and the property is written on release', async () => {
      // Break this catches: only record 1 following the pointer, or a write on every move.
      await mount(widget);
      const handle = handles()[0];

      fireEvent.mouseDown(handle, { clientX: 0, clientY: START_Y, button: 0 });
      fireEvent.mouseMove(document, { clientX: 0, clientY: START_Y + 40 });

      await waitFor(() => expect(heights()).toEqual(['140px', '140px', '140px']));
      expect(raw('rowHeight')).toEqual({ value: '100' });

      fireEvent.mouseUp(document, { clientX: 0, clientY: START_Y + 40 });

      await waitFor(() => expect(raw('rowHeight').value).toBe(140));
      expect(heights()).toEqual(['140px', '140px', '140px']);
    });

    test('[Listview-RSZ-001] one Undo restores the old height and one Redo brings the new one back', async () => {
      // Break this catches: a write that skips the undo stack, or one that leaves two entries for one drag.
      await mount(widget);
      drag(handles()[0], [33]);
      await waitFor(() => expect(raw('rowHeight').value).toBe(130));

      await widget.session.store.act(() => store().handleUndo());

      await waitFor(() => expect(raw('rowHeight').value).toBe('100'));
      await waitFor(() => expect(heights()).toEqual(['100px', '100px', '100px']));

      await widget.session.store.act(() => store().handleRedo());

      await waitFor(() => expect(raw('rowHeight').value).toBe(130));
    });

    test('[Listview-RSZ-001] a click on the handle does not select the record', async () => {
      // Break this catches: the click that ends a drag reaching the record, so a resize also fires Record clicked.
      await mount(widget);

      drag(handles()[0], [30]);
      fireEvent.click(handles()[0]);
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(widget.exposed()?.selectedRecordIndex).toBeUndefined();
    });
  });

  describe('Listview record resize: no upper limit, a floor of 10 that never jumps', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test.each([
      ['600', -5, null],
      ['600', 33, 630],
      ['5', -20, null],
      ['8', -3, null],
      ['5', 33, 40],
    ])('[Listview-RSZ-001] saved %s dragged by %i writes %p', async (saved, delta, expected) => {
      // Break this catches: a cap that pulls 600 down to its limit on the first pixel, or a floor that lifts 5 or 8 to 10 when dragging up.
      await mount(widget, { properties: { rowHeight: binding(saved) } });
      const handle = handles()[0];

      fireEvent.mouseDown(handle, { clientX: 0, clientY: START_Y, button: 0 });
      fireEvent.mouseMove(document, { clientX: 0, clientY: START_Y + delta });
      if (expected === null) expect(heights()[0]).toBe(`${saved}px`);
      fireEvent.mouseUp(document, { clientX: 0, clientY: START_Y + delta });

      if (expected === null) expect(raw('rowHeight')).toEqual({ value: saved });
      else await waitFor(() => expect(raw('rowHeight').value).toBe(expected));
    });

    test('[Listview-RSZ-001] a capitalised Grid layout writes the grid key', async () => {
      // Break this catches: comparing the layout without lower-casing, so "Grid" shows the grid height and writes rowHeight.
      await mount(widget, {
        properties: { mode: binding('Grid'), columns: binding('{{2}}'), gridRecordHeight: binding('150') },
      });

      drag(handles()[0], [33]);

      await waitFor(() => expect(raw('gridRecordHeight').value).toBe(180));
      expect(raw('rowHeight')).toEqual({ value: '100' });
    });
  });

  describe('Listview record resize: the click that ends a drag', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    const settle = () => new Promise((resolve) => setTimeout(resolve, 20));
    const dragThenRelease = (distance = 30) => {
      fireEvent.mouseDown(handles()[0], { clientX: 0, clientY: START_Y, button: 0 });
      fireEvent.mouseMove(document, { clientX: 0, clientY: START_Y + distance });
      fireEvent.mouseUp(document, { clientX: 0, clientY: START_Y + distance });
    };

    test.each([
      ['the record body', () => rows()[0]],
      ['a child in the record', () => document.querySelector('.ele-txt1')],
    ])('[Listview-RSZ-001] a release over %s does not select record 1', async (_name, target) => {
      // Break this catches: the click a browser sends to the common ancestor of the press and the release reaching the record, so a resize selects it and fires Record clicked.
      await mount(widget);
      dragThenRelease();

      fireEvent.click(target());
      await settle();

      expect(widget.exposed()?.selectedRecordIndex).toBeUndefined();
    });

    test('[Listview-RSZ-001] only that one click is ignored: the next click selects the record', async () => {
      // Break this catches: a guard that stays on, so record 1 can no longer be selected after a resize.
      await mount(widget);
      dragThenRelease();
      fireEvent.click(rows()[0]);
      await settle();

      fireEvent.click(rows()[0]);

      await waitFor(() => expect(widget.exposed()?.selectedRecordIndex).toBe(0));
    });

    test('[Listview-RSZ-001] when no click follows the release, the next press and click select the record', async () => {
      // Break this catches: a guard that waits for a click that never came and eats the next real one.
      await mount(widget);
      dragThenRelease();

      fireEvent.mouseDown(rows()[0], { clientX: 0, clientY: START_Y, button: 0 });
      fireEvent.mouseUp(rows()[0]);
      fireEvent.click(rows()[0]);

      await waitFor(() => expect(widget.exposed()?.selectedRecordIndex).toBe(0));
    });
  });

  describe('Listview record resize: no copy hover starts or survives a resize', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    const copies = () => [...document.querySelectorAll('.ele-txt1')];
    const outlined = () => copies().map((node) => node.classList.contains('listview-copy-outline'));
    // React's enter logic needs the pointer to come from somewhere else.
    const pointerOver = (node, from) => fireEvent.mouseOver(node, { relatedTarget: from });

    test('[Listview-RSZ-005] a copy the pointer crosses during the drag shows no outline after the release', async () => {
      // Break this catches: the live resize moving the copy out from under the pointer, so mouseleave never comes and the dotted outline stays for good.
      await mount(widget);
      const handle = handles()[0];

      fireEvent.mouseDown(handle, { clientX: 0, clientY: START_Y, button: 0 });
      pointerOver(copies()[1], handle);
      fireEvent.mouseMove(document, { clientX: 0, clientY: START_Y + 33 });
      // The records moved; no mouseleave for the copy.
      await waitFor(() => expect(heights()).toEqual(['130px', '130px', '130px']));
      fireEvent.mouseUp(document, { clientX: 0, clientY: START_Y + 33 });

      await waitFor(() => expect(raw('rowHeight').value).toBe(130));
      expect(outlined()).toEqual([false, false, false]);
    });

    test('[Listview-RSZ-005] no outline starts while the drag is on', async () => {
      // Break this catches: a copy hover starting mid-drag, which the release alone would only hide afterwards.
      await mount(widget);
      const handle = handles()[0];

      fireEvent.mouseDown(handle, { clientX: 0, clientY: START_Y, button: 0 });
      pointerOver(copies()[1], handle);
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(outlined()).toEqual([false, false, false]);
      fireEvent.mouseUp(document);
    });

    test('[Listview-RSZ-005] an outline that is already on when the press starts is cleared', async () => {
      // Break this catches: a hover that began before the press and never gets its mouseleave because the copy moves.
      await mount(widget);
      pointerOver(copies()[1], rows()[0]);
      await waitFor(() => expect(outlined()).toEqual([false, true, false]));

      fireEvent.mouseDown(handles()[0], { clientX: 0, clientY: START_Y, button: 0 });

      await waitFor(() => expect(outlined()).toEqual([false, false, false]));
      fireEvent.mouseUp(document);
    });

    test('[Listview-RSZ-005] outside a resize, hovering a copy outlines it and leaving clears it, also after a resize', async () => {
      // Break this catches: the resize guard staying on, so copies never outline again.
      await mount(widget);
      pointerOver(copies()[2], rows()[2]);
      await waitFor(() => expect(outlined()).toEqual([false, false, true]));
      fireEvent.mouseLeave(copies()[2]);
      await waitFor(() => expect(outlined()).toEqual([false, false, false]));

      drag(handles()[0], [33]);
      await waitFor(() => expect(raw('rowHeight').value).toBe(130));

      pointerOver(copies()[1], rows()[1]);
      await waitFor(() => expect(outlined()).toEqual([false, true, false]));
      fireEvent.mouseLeave(copies()[1]);
      await waitFor(() => expect(outlined()).toEqual([false, false, false]));
    });
  });

  describe('Listview record resize: cleanup and rendering', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test('[Listview-RSZ-001] unmounting during a drag drops the listeners, so a later release writes nothing', async () => {
      // Break this catches: document listeners that outlive the ListView and write from a stale render.
      await mount(widget);
      const view = widget.render({ currentMode: 'edit' });
      fireEvent.mouseDown(handles()[0], { clientX: 0, clientY: START_Y, button: 0 });
      fireEvent.mouseMove(document, { clientX: 0, clientY: START_Y + 40 });

      view.unmount();
      fireEvent.mouseMove(document, { clientX: 0, clientY: START_Y + 80 });
      fireEvent.mouseUp(document, { clientX: 0, clientY: START_Y + 80 });

      expect(raw('rowHeight')).toEqual({ value: '100' });
    });

    test('[Listview-RSZ-001] the page shows a resize cursor for the whole drag and not after it', async () => {
      // Break this catches: the cursor falling back to the default once the pointer leaves the 8px handle.
      await mount(widget);
      expect(document.body.classList.contains('listview-record-resizing')).toBe(false);

      fireEvent.mouseDown(handles()[0], { clientX: 0, clientY: START_Y, button: 0 });
      await waitFor(() => expect(document.body.classList.contains('listview-record-resizing')).toBe(true));
      fireEvent.mouseUp(document);

      await waitFor(() => expect(document.body.classList.contains('listview-record-resizing')).toBe(false));
    });

    test('[Listview-RSZ-001] a ListView re-render that changes nothing for record 1 does not re-render record 1', async () => {
      // Break this catches: a fresh handle object per render, which defeats the record's memo on every hover.
      await mount(widget);
      const recordOneRenders = () =>
        useDynamicHeight.mock.calls.filter(([options]) => options.isRowSubcontainer && options.subContainerIndex === 0)
          .length;
      const before = recordOneRenders();

      // Selecting a child turns the fade on: the list re-renders, and nothing in record 1's props changes.
      act(() => useStore.getState().setSelectedComponents(['txt1']));
      await waitFor(() => expect(faded()).toEqual([false, true, true]));

      expect(recordOneRenders()).toBe(before);
    });
  });

  describe.each(['legacy', 'bordered', 'container', 'plain'])('Listview record resize: %s style', (listStyle) => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test(`[Listview-RSZ-001] ${listStyle}: a 33 drag writes the snapped 130, not the DOM height`, async () => {
      // Break this catches: writing clientHeight, which a Container card's 2px border makes 128 (and 0 in jsdom).
      await mount(widget, { styles: { listStyle: binding(listStyle) } });

      drag(handles()[0], [33]);

      await waitFor(() => expect(raw('rowHeight').value).toBe(130));
      expect(heights()).toEqual(['130px', '130px', '130px']);
    });
  });

  describe('Listview record resize: which record has the handle', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test('[Listview-RSZ-001] only record 1 has a handle, inside the record', async () => {
      // Break this catches: a handle on every record.
      await mount(widget);

      expect(handles()).toHaveLength(1);
      expect(rows()[0].contains(handles()[0])).toBe(true);
    });

    test('[Listview-RSZ-001] page 2 has no handle, not even on its first record', async () => {
      // Break this catches: gating on the page-relative index, so record 1 of every page can be resized.
      await mount(widget);
      await widget.act('setPage', 2);
      await waitFor(() => expect(document.querySelector('.ele-txt1')?.textContent).toContain('r3'));

      expect(handles()).toHaveLength(0);
    });

    test('[Listview-RSZ-001] preview has no handle', async () => {
      // Break this catches: the builder handle shown in the viewer.
      await mount(widget, { currentMode: 'view' });

      expect(handles()).toHaveLength(0);
    });

    test('[Listview-RSZ-001] the handle is only for the layout key that is saved: an expression in the other key does not hide it', async () => {
      // Break this catches: any expression in the properties hiding the handle.
      await mount(widget, { properties: { gridRecordHeight: binding('{{150}}') } });

      expect(handles()).toHaveLength(1);
    });
  });

  describe('Listview record resize: a frozen version', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test('[Listview-RSZ-009] a frozen editor shows no handle and no outline, and gets them back when unfrozen', async () => {
      // Break this catches: the drag writing and saving Record height on a released or read-only version.
      await mount(widget);
      expect(handles()).toHaveLength(1);

      act(() => useStore.setState({ isEditorFreezed: true }));
      await waitFor(() => expect(handles()).toHaveLength(0));
      fireEvent.mouseEnter(rows()[0]);
      expect(framed()).toEqual([false, false, false]);

      act(() => useStore.setState({ isEditorFreezed: false }));
      await waitFor(() => expect(handles()).toHaveLength(1));
    });
  });

  describe('Listview record resize: Record height holds an expression', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    const expressionHeight = {
      properties: { rowHeight: binding('{{components.text2.text}}') },
      extraComponents: { txt2: { ...child('txt2', 'text2', 'Text', { text: binding('120') }, 'canvas') } },
    };

    test('[Listview-RSZ-008] with no handle, the pointer on record 1 shows no outline', async () => {
      // Break this catches: an outline promising a resize that an expression forbids.
      await mount(widget, expressionHeight);

      fireEvent.mouseEnter(rows()[0]);
      await waitFor(() => expect(faded()).toEqual([false, true, true]));

      expect(framed()).toEqual([false, false, false]);
    });

    test('[Listview-RSZ-002] there is no handle, and the expression and the height are unchanged', async () => {
      // Break this catches: a handle on a dynamic height, which would overwrite the expression with a number.
      await mount(widget, expressionHeight);

      expect(handles()).toHaveLength(0);
      expect(raw('rowHeight')).toEqual({ value: '{{components.text2.text}}' });
    });

    test('[Listview-RSZ-002] pressing, moving and releasing on any element of record 1 leaves the expression alone', async () => {
      // Break this catches: any element of the record, not only the handle, starting a resize that overwrites the expression.
      await mount(widget, expressionHeight);

      [rows()[0], ...rows()[0].querySelectorAll('*')].forEach((node) => {
        fireEvent.mouseDown(node, { clientX: 0, clientY: START_Y, button: 0 });
        fireEvent.mouseMove(document, { clientX: 0, clientY: START_Y + 50 });
        fireEvent.mouseUp(document, { clientX: 0, clientY: START_Y + 50 });
      });

      expect(raw('rowHeight')).toEqual({ value: '{{components.text2.text}}' });
      expect(faded()).toEqual([false, false, false]);
    });

    test('[Listview-RSZ-002] a grid that falls back to an expression in Record height has no handle either', async () => {
      // Break this catches: reading only gridRecordHeight, so a grid showing rowHeight's expression gets a handle that would shadow it.
      await mount(widget, {
        properties: { ...expressionHeight.properties, mode: binding('grid'), columns: binding('{{2}}') },
        extraComponents: expressionHeight.extraComponents,
      });

      expect(handles()).toHaveLength(0);
    });
  });

  describe('Listview record resize: the other records do not fade', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test('[Listview-RSZ-003] records 2..K keep full opacity from mousedown to mouseup', async () => {
      // Break this catches: any fade of records 2..K while the handle is held (Figma frame 14 shows none).
      await mount(widget);
      expect(faded()).toEqual([false, false, false]);

      fireEvent.mouseDown(handles()[0], { clientX: 0, clientY: START_Y, button: 0 });
      await waitFor(() => expect(framed()).toEqual([true, false, false]));
      expect(faded()).toEqual([false, false, false]);

      fireEvent.mouseMove(document, { clientX: 0, clientY: START_Y + 30 });
      expect(faded()).toEqual([false, false, false]);

      fireEvent.mouseUp(document, { clientX: 0, clientY: START_Y + 30 });
      await waitFor(() => expect(framed()).toEqual([false, false, false]));
      expect(faded()).toEqual([false, false, false]);
    });
  });

  describe('Listview record resize: no fade even while record 1 is hovered', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test('[Listview-RSZ-003] with the pointer on record 1, records 2..K stay at full opacity for the whole drag, and the hover fade returns after the release', async () => {
      // Break this catches: the hover fade (the pointer is on record 1 when the handle is pressed) still applying during the resize.
      await mount(widget);
      fireEvent.mouseEnter(rows()[0]);
      await waitFor(() => expect(faded()).toEqual([false, true, true]));

      fireEvent.mouseDown(handles()[0], { clientX: 0, clientY: START_Y, button: 0 });
      await waitFor(() => expect(faded()).toEqual([false, false, false]));
      fireEvent.mouseMove(document, { clientX: 0, clientY: START_Y + 30 });
      expect(faded()).toEqual([false, false, false]);

      fireEvent.mouseUp(document, { clientX: 0, clientY: START_Y + 30 });
      await waitFor(() => expect(faded()).toEqual([false, true, true]));
    });
  });

  describe('Listview record resize: the pointer on record 1 shows the handle and the outline', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    const handleShown = () => handles()[0].classList.contains('listview-record-handle-shown');

    test('[Listview-RSZ-008] entering record 1 shows both, with no grid, on record 1 only, and leaving removes them', async () => {
      // Break this catches: the outline only on the handle or during a drag, on a copy, or the grid shown on hover too.
      await mount(widget);
      expect(handleShown()).toBe(false);

      fireEvent.mouseEnter(rows()[0]);
      await waitFor(() => expect(framed()).toEqual([true, false, false]));
      expect(handleShown()).toBe(true);
      expect(gridded()).toEqual([false, false, false]);

      fireEvent.mouseLeave(rows()[0]);
      await waitFor(() => expect(framed()).toEqual([false, false, false]));
      expect(handleShown()).toBe(false);
    });

    test('[Listview-RSZ-008] entering record 2 shows neither', async () => {
      // Break this catches: the hover signal read by every record.
      await mount(widget);

      fireEvent.mouseEnter(rows()[1]);
      fireEvent.mouseOver(rows()[1]);

      expect(framed()).toEqual([false, false, false]);
      expect(handleShown()).toBe(false);
    });

    test.each(['bordered', 'plain', 'container', 'legacy'])(
      '[Listview-RSZ-008] the %s style shows both',
      async (listStyle) => {
        // Break this catches: the outline tied to one list style.
        await mount(widget, { styles: { listStyle: binding(listStyle) } });

        fireEvent.mouseEnter(rows()[0]);
        await waitFor(() => expect(framed()).toEqual([true, false, false]));
        expect(handleShown()).toBe(true);
      }
    );

    test('[Listview-RSZ-008] a grid layout shows both on card 1 only', async () => {
      // Break this catches: the rule written for the List layout only.
      await mount(widget, {
        properties: { mode: binding('grid'), columns: binding('{{2}}'), gridRecordHeight: binding('150') },
      });

      fireEvent.mouseEnter(rows()[0]);
      await waitFor(() => expect(framed()).toEqual([true, false, false]));
      expect(handleShown()).toBe(true);
    });

    test('[Listview-RSZ-008] the pointer on the Moveable controls of a record 1 component keeps both', async () => {
      // Break this catches: CSS :hover on the record, which ends here because Moveable draws outside the record's DOM.
      await mount(widget);
      fireEvent.mouseEnter(rows()[0]);
      await waitFor(() => expect(handleShown()).toBe(true));

      const box = document.createElement('div');
      box.className = 'moveable-control-box';
      box.setAttribute('target-id', 'txt1');
      document.body.appendChild(box);
      fireEvent.mouseLeave(rows()[0]);
      fireEvent.mouseOver(box);

      await waitFor(() => expect(handleShown()).toBe(true));
      expect(framed()).toEqual([true, false, false]);
      box.remove();
    });

    test('[Listview-RSZ-008] a drag that ends away from record 1 leaves neither behind', async () => {
      // Break this catches: a live resize moves the record from under the pointer, so its mouseleave never fires.
      await mount(widget);

      fireEvent.mouseEnter(rows()[0]);
      fireEvent.mouseDown(handles()[0], { clientX: 0, clientY: START_Y, button: 0 });
      fireEvent.mouseMove(document, { clientX: 0, clientY: START_Y + 30 });
      // The pointer is elsewhere now, and the record never got a mouseleave.
      fireEvent.mouseOver(document.body);
      fireEvent.mouseUp(document, { clientX: 0, clientY: START_Y + 30 });

      await waitFor(() => expect(framed()).toEqual([false, false, false]));
      expect(handleShown()).toBe(false);
    });

    test('[Listview-RSZ-008] a release with the pointer still on the handle keeps both', async () => {
      // Break this catches: clearing the hover on every drag end, so they vanish under a resting pointer.
      await mount(widget);

      fireEvent.mouseEnter(rows()[0]);
      // jsdom's :hover matches only the last mouseover target, not its parents as a browser does.
      fireEvent.mouseOver(rows()[0]);
      fireEvent.mouseDown(handles()[0], { clientX: 0, clientY: START_Y, button: 0 });
      fireEvent.mouseUp(document, { clientX: 0, clientY: START_Y });

      await waitFor(() => expect(gridded()).toEqual([false, false, false]));
      expect(framed()).toEqual([true, false, false]);
      expect(handleShown()).toBe(true);
    });
  });

  describe('Listview record resize: record 1 shows the outline and the grid while the drag is on', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test('[Listview-RSZ-006] the outline and the grid start at mousedown and end at mouseup, on record 1 only', async () => {
      // Break this catches: no outline, no grid, either on a copy, or one that sticks after the release.
      await mount(widget);
      expect(framed()).toEqual([false, false, false]);
      expect(gridded()).toEqual([false, false, false]);

      fireEvent.mouseDown(handles()[0], { clientX: 0, clientY: START_Y, button: 0 });
      await waitFor(() => expect(framed()).toEqual([true, false, false]));
      expect(gridded()).toEqual([true, false, false]);

      fireEvent.mouseMove(document, { clientX: 0, clientY: START_Y + 30 });
      expect(framed()).toEqual([true, false, false]);
      expect(gridded()).toEqual([true, false, false]);

      fireEvent.mouseUp(document, { clientX: 0, clientY: START_Y + 30 });
      await waitFor(() => expect(framed()).toEqual([false, false, false]));
      expect(gridded()).toEqual([false, false, false]);
    });

    test('[Listview-RSZ-006] a click without a move shows them for the press and then removes them', async () => {
      // Break this catches: the outline or grid cleared only when a height was written.
      await mount(widget);

      fireEvent.mouseDown(handles()[0], { clientX: 0, clientY: START_Y, button: 0 });
      await waitFor(() => expect(gridded()).toEqual([true, false, false]));
      fireEvent.mouseUp(document);

      await waitFor(() => expect(framed()).toEqual([false, false, false]));
      expect(gridded()).toEqual([false, false, false]);
    });

    test('[Listview-RSZ-006] a grid layout shows them on card 1 only', async () => {
      // Break this catches: the rule written for the List layout only.
      await mount(widget, {
        properties: { mode: binding('grid'), columns: binding('{{2}}'), gridRecordHeight: binding('150') },
      });

      fireEvent.mouseDown(handles()[0], { clientX: 0, clientY: START_Y, button: 0 });

      await waitFor(() => expect(framed()).toEqual([true, false, false]));
      expect(gridded()).toEqual([true, false, false]);
    });
  });

  describe('Listview record resize: the handle sits on the bottom edge of record 1', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test('[Listview-RSZ-007] the handle is 26px wide, half of its height below the edge, and the record that holds it does not clip', async () => {
      // Break this catches: the handle inside the clipped box (half cut), a width other than 26px, or a bottom offset that leaves it above the edge.
      await mount(widget);
      const handle = handles()[0];

      expect(handle.style.width).toBe('26px');
      expect(handle.style.height).toBe('8px');
      expect(handle.style.bottom).toBe('-4px');
      expect(handle.style.left).toBe('50%');
      // The handle is a direct child of the record, so the record's own overflow is the only clip around it.
      expect(handle.parentElement).toBe(rows()[0]);
      expect(rows()[0].style.overflow).not.toBe('hidden');
      // The copies have no handle and still clip.
      expect(rows()[1].style.overflow).toBe('hidden');
    });

    test('[Listview-RSZ-007] the record children are still clipped at the record', async () => {
      // Break this catches: lifting the clip off the record canvas to free the handle.
      await mount(widget);

      const canvas = rows()[0].querySelector('.real-canvas');
      const clipped = [];
      for (let node = canvas; node && node !== rows()[0].parentElement; node = node.parentElement) {
        if (node.style.overflow === 'hidden') clipped.push(node);
      }
      expect(clipped.length).toBeGreaterThan(0);
    });

    test('[Listview-RSZ-007] a Container record puts the edge on its border: the handle centre follows the edge', async () => {
      // Break this catches: a fixed offset that ignores the 1px border under the record.
      await mount(widget, { styles: { listStyle: binding('container') } });

      expect(handles()[0].style.bottom).toBe('-5px');
    });
  });

  describe('Listview record resize: grid layout', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    const grid = (extra = {}) => ({
      properties: { mode: binding('grid'), columns: binding('{{2}}'), rowHeight: binding('90'), ...extra },
    });

    test('[Listview-RSZ-004] a grid resize writes gridRecordHeight and leaves rowHeight', async () => {
      // Break this catches: the grid drag writing rowHeight.
      await mount(widget, grid({ gridRecordHeight: binding('150') }));
      expect(heights()[0]).toBe('150px');

      drag(handles()[0], [33]);

      await waitFor(() => expect(raw('gridRecordHeight').value).toBe(180));
      expect(raw('rowHeight')).toEqual({ value: '90' });
      expect(heights()[0]).toBe('180px');
    });

    test('[Listview-RSZ-004] a saved grid without gridRecordHeight starts from rowHeight and adds gridRecordHeight', async () => {
      // Break this catches: starting from a missing key (NaN) or writing the fallback back into rowHeight.
      await mount(widget, grid());
      expect(heights()[0]).toBe('90px');

      drag(handles()[0], [40]);

      await waitFor(() => expect(raw('gridRecordHeight').value).toBe(130));
      expect(raw('rowHeight')).toEqual({ value: '90' });
    });

    test('[Listview-RSZ-004] a list resize leaves gridRecordHeight alone', async () => {
      // Break this catches: the list drag writing both keys.
      await mount(widget, { properties: { gridRecordHeight: binding('150') } });

      drag(handles()[0], [33]);

      await waitFor(() => expect(raw('rowHeight').value).toBe(130));
      expect(raw('gridRecordHeight')).toEqual({ value: '150' });
    });
  });

  describe('Listview record resize: nested ListView', () => {
    beforeEach(nestedWidget.setup);
    afterEach(nestedWidget.teardown);

    // The inner handle sits in a record that is itself inside the outer record.
    const outerHandle = () => handles().find((handle) => !handle.parentElement.parentElement.closest('.list-item'));
    const innerHandle = () => handles().find((handle) => handle.parentElement.parentElement.closest('.list-item'));

    test('[Listview-RSZ-001] each ListView has one handle, on its own main record', async () => {
      // Break this catches: a handle on every inner record, or none on the inner list.
      nestedWidget.render({ currentMode: 'edit' });
      await waitFor(() => expect(document.querySelectorAll('.ele-txt2')).toHaveLength(2));

      expect(handles()).toHaveLength(2);
      expect(outerHandle()).toBeDefined();
      expect(innerHandle()).toBeDefined();
    });

    test('[Listview-RSZ-001] resizing the inner record writes only the inner key', async () => {
      // Break this catches: the inner drag writing the outer ListView's Record height.
      nestedWidget.render({ currentMode: 'edit' });
      await waitFor(() => expect(document.querySelectorAll('.ele-txt2')).toHaveLength(2));

      drag(innerHandle(), [30]);

      await waitFor(() => expect(raw('rowHeight', INNER).value).toBe(130));
      expect(raw('rowHeight')).toEqual({ value: '250' });
    });

    test('[Listview-RSZ-001] resizing the outer record writes only the outer key', async () => {
      // Break this catches: the outer drag writing the inner ListView's Record height.
      nestedWidget.render({ currentMode: 'edit' });
      await waitFor(() => expect(document.querySelectorAll('.ele-txt2')).toHaveLength(2));

      drag(outerHandle(), [50]);

      await waitFor(() => expect(raw('rowHeight').value).toBe(300));
      expect(raw('rowHeight', INNER)).toEqual({ value: '100' });
    });

    test('[Listview-RSZ-006] an inner ListView inside record 1 shows no grid when the outer record is resized', async () => {
      // Break this catches: a global resize flag that turns every record canvas into a grid.
      nestedWidget.render({ currentMode: 'edit' });
      await waitFor(() => expect(document.querySelectorAll('.ele-txt2')).toHaveLength(2));

      fireEvent.mouseDown(outerHandle(), { clientX: 0, clientY: START_Y, button: 0 });

      await waitFor(() => expect(rows()[0].classList.contains('listview-record-moving')).toBe(true));
      const innerRows = [...rows()[0].querySelectorAll('.list-item')];
      expect(innerRows.length).toBeGreaterThan(0);
      expect(innerRows.every((row) => !row.classList.contains('listview-record-moving'))).toBe(true);
      expect(innerRows.every((row) => !row.querySelector('.show-grid'))).toBe(true);
    });

    test('[Listview-RSZ-001] on outer page 2 the inner list is a copy and has no handle', async () => {
      // Break this catches: the inner lock reading the page-relative outer index.
      nestedWidget.render({ currentMode: 'edit' });
      await waitFor(() => expect(document.querySelectorAll('.ele-txt2')).toHaveLength(2));

      await nestedWidget.act('setPage', 2);
      await waitFor(() => expect(copyTexts()).toEqual(['c', 'd']));

      expect(handles()).toHaveLength(0);
    });
  });

  const copyTexts = () => [...document.querySelectorAll('.ele-txt2')].map((node) => node.textContent.slice(-1));
});

describe('ListviewRecordStyles', () => {
  /**
   * Listview record styles: List style (Legacy / Bordered / Container / Plain), gap, record colours and the
   * grid record height. Scenarios live in frontend/ee/test/app-builder/widgets/Listview/TESTING.md.
   *
   * Real store, real RenderWidget, real Listview rows. jsdom drops `var(...)` colours and `calc(...)`
   * widths from inline styles, so colours here are rgb literals and the legacy separator is read from its
   * class; real geometry (scroll inside a record) is QA's Listview-BRW-008.
   */

  const ID = 'lv1';
  const NAME = 'listview1';
  const THREE_RECORDS = `{{[{ text: 'Alpha' }, { text: 'Beta' }, { text: 'Gamma' }]}}`;

  // WidgetWrapper hides a child without device flags, so every row would be empty without them.
  function textChild() {
    const definition = componentDefinition('txt1', 'text1', 'Text', { text: binding('{{listItem.text}}') });
    definition.component.parent = ID;
    definition.component.definition.styles = {};
    definition.component.definition.others = {
      showOnDesktop: binding('{{true}}'),
      showOnMobile: binding('{{false}}'),
    };
    return definition;
  }

  const widget = createWidgetHarness({
    componentType: 'Listview',
    handle: NAME,
    id: ID,
    defaultProperties: {
      dataSourceSelector: binding('rawJson'),
      data: binding(THREE_RECORDS),
      mode: binding('list'),
      columns: binding('{{3}}'),
      rowHeight: binding('100'),
      loadingState: binding('{{false}}'),
      dynamicHeight: binding('{{false}}'),
      visibility: binding('{{true}}'),
      disabledState: binding('{{false}}'),
      showBorder: binding('{{true}}'),
      rowsPerPage: binding('{{10}}'),
      enablePagination: binding('{{false}}'),
    },
    defaultStyles: {
      backgroundColor: binding('var(--cc-surface1-surface)'),
      borderColor: binding('var(--cc-weak-border)'),
      borderRadius: binding('{{6}}'),
    },
    defaultExtraComponents: { txt1: textChild() },
    capabilities: { dnd: true },
    widgetHeight: 624,
    widgetWidth: 600,
  });

  const container = () => document.getElementById(ID);
  const list = () => container().querySelector('[role="list"]');
  const rows = () => [...document.querySelectorAll('.list-item')];
  const dividers = () => [...container().querySelectorAll('.listview-record-divider')];
  const verticalDividers = () => [...container().querySelectorAll('.listview-record-divider-vertical')];
  // Layout space a divider takes along one axis: size, borders and margins (border-box is not assumed).
  const px = (value) => parseFloat(value) || 0;
  const dividerHeight = ({ style }) =>
    px(style.height) +
    px(style.borderTopWidth) +
    px(style.borderBottomWidth) +
    px(style.marginTop) +
    px(style.marginBottom);
  const dividerWidth = ({ style }) =>
    px(style.width) +
    px(style.borderLeftWidth) +
    px(style.borderRightWidth) +
    px(style.marginLeft) +
    px(style.marginRight);
  const SIX_RECORDS = `{{[1, 2, 3, 4, 5, 6].map((n) => ({ text: 'R' + n }))}}`;

  async function mount(options = {}, recordCount = 3) {
    widget.render({ currentMode: 'view', ...options });
    await waitFor(() => expect(container()).toBeInTheDocument());
    await waitFor(() => expect(rows()).toHaveLength(recordCount));
  }

  describe('Listview: list styles', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test.each([
      ['on', '{{true}}', true],
      ['off', '{{false}}', false],
    ])(
      '[Listview-STYLE-004] Legacy keeps 7px padding and the bottom separator follows showBorder (%s)',
      async (_label, showBorder, separated) => {
        // Break this catches: new styles leaking into Legacy, changing every saved ListView's spacing or separator.
        await mount({ properties: { showBorder: binding(showBorder) }, styles: { listStyle: binding('legacy') } });

        expect(container().style.padding).toBe('7px');
        expect(list().style.gap).toBe('');
        rows().forEach((row) => {
          expect(row.classList.contains('listview-legacy-divider')).toBe(separated);
          expect(row.style.border).toBe('');
          expect(row.style.backgroundColor).toBe('');
        });
        expect(dividers()).toHaveLength(0);
      }
    );

    test('[Listview-STYLE-005] Bordered fills records, draws no border and centres a divider in each gap', async () => {
      // Break this catches: a record border, a wrong divider colour, or a divider after the last record.
      await mount({
        styles: {
          listStyle: binding('bordered'),
          gap: binding('{{12}}'),
          recordBackgroundColor: binding('rgb(7, 8, 9)'),
          recordDividerColor: binding('rgb(1, 2, 3)'),
          recordBorderColor: binding('rgb(4, 5, 6)'),
        },
      });

      rows().forEach((row) => {
        expect(row.style.backgroundColor).toBe('rgb(7, 8, 9)');
        expect(row.style.border).toBe('');
        // No border, so the canvas keeps the full record height.
        expect(row.querySelector('.sub-canvas').getAttribute('canvas-height')).toBe('100');
      });
      expect(dividers()).toHaveLength(2);
      dividers().forEach((divider) => {
        expect(divider.style.backgroundColor).toBe('rgb(1, 2, 3)');
        expect(divider.style.height).toBe('1px');
      });
      // Half the gap on each side puts the line in the middle of the 12px gap.
      expect(list().style.rowGap).toBe('6px');
      expect(verticalDividers()).toHaveLength(0);
    });

    test('[Listview-STYLE-005] a new bordered ListView matches Figma 238:1379: padding 12, record 80, pitch 92', async () => {
      // Break this catches: the legacy 7px padding, or a divider that adds to the gap (pitch 93, not 92).
      await mount({
        properties: { rowHeight: binding('80') },
        styles: {
          listStyle: binding('bordered'),
          gap: binding('{{12}}'),
          recordDividerColor: binding('rgb(1, 2, 3)'),
        },
      });

      expect(container().style.padding).toBe('12px');
      expect(rows()[0].style.height).toBe('80px');
      expect(rows()[0].style.borderRadius).toBe('');
      // Record, half gap, the line (no layout space), half gap: the next record starts 92px on.
      const pitch = px(rows()[0].style.height) + 2 * px(list().style.rowGap) + dividerHeight(dividers()[0]);
      expect(pitch).toBe(92);
    });

    test('[Listview-STYLE-006] Container draws each record as a card with no divider', async () => {
      // Break this catches: a card missing its background, border or radius, or a divider between cards.
      await mount({
        styles: {
          listStyle: binding('container'),
          gap: binding('{{12}}'),
          recordBackgroundColor: binding('rgb(7, 8, 9)'),
          recordBorderColor: binding('rgb(4, 5, 6)'),
          recordBorderRadius: binding('{{8}}'),
          recordDividerColor: binding('rgb(1, 2, 3)'),
        },
      });

      rows().forEach((row) => {
        expect(row.style.backgroundColor).toBe('rgb(7, 8, 9)');
        expect(row.style.border).toBe('1px solid rgb(4, 5, 6)');
        expect(row.style.borderRadius).toBe('8px');
        expect(row.classList.contains('listview-legacy-divider')).toBe(false);
        // The 1px border sits inside the 100px record, so the row canvas gets the 98px left inside it.
        expect(row.style.height).toBe('100px');
        expect(row.querySelector('.sub-canvas').getAttribute('canvas-height')).toBe('98');
      });
      expect(list().style.rowGap).toBe('12px');
      expect(dividers()).toHaveLength(0);
    });

    test('[Listview-STYLE-007] Plain separates records by the gap only', async () => {
      // Break this catches: a background, border or divider leaking into Plain from saved record keys.
      await mount({
        styles: {
          listStyle: binding('plain'),
          gap: binding('{{12}}'),
          recordBackgroundColor: binding('rgb(7, 8, 9)'),
          recordDividerColor: binding('rgb(1, 2, 3)'),
          recordBorderColor: binding('rgb(4, 5, 6)'),
        },
      });

      rows().forEach((row) => {
        expect(row.style.backgroundColor).toBe('');
        expect(row.style.border).toBe('');
      });
      expect(dividers()).toHaveLength(0);
      expect(list().style.rowGap).toBe('12px');
    });

    test('[Listview-STYLE-008] grid Bordered draws dividers between rows and between columns', async () => {
      // Break this catches: no column dividers in grid, lines past the last row or column, or 13px spacing.
      await mount(
        {
          properties: { mode: binding('grid'), columns: binding('{{3}}'), data: binding(SIX_RECORDS) },
          styles: {
            listStyle: binding('bordered'),
            gap: binding('{{12}}'),
            recordDividerColor: binding('rgb(1, 2, 3)'),
          },
        },
        6
      );

      // Two lines of three: one row divider, two column dividers per line.
      expect(dividers()).toHaveLength(1);
      expect(verticalDividers()).toHaveLength(4);
      verticalDividers().forEach((divider) => {
        expect(divider.style.backgroundColor).toBe('rgb(1, 2, 3)');
        expect(divider.style.width).toBe('1px');
        // The line sits in a 0px track; without these a `max-width: 100%` rule clamps it to nothing.
        expect(divider.style.minWidth).toBe('1px');
        expect(divider.style.maxWidth).toBe('none');
      });
      // A 0px track per column line keeps the gap at exactly 12px.
      expect(list().style.gridTemplateColumns).toBe('minmax(0, 1fr) 0px minmax(0, 1fr) 0px minmax(0, 1fr)');
      rows().forEach((row) => expect(row.style.border).toBe(''));
      // The lines sit inside the gaps, so records are exactly 12px apart both ways.
      expect(2 * px(list().style.columnGap) + dividerWidth(verticalDividers()[0])).toBe(12);
      expect(2 * px(list().style.rowGap) + dividerHeight(dividers()[0])).toBe(12);
    });

    test('[Listview-STYLE-008] grid Bordered keeps every column divider in an incomplete last line', async () => {
      // Break this catches: no divider after the last record, so the empty side of the last line has no lines.
      await mount(
        {
          properties: {
            mode: binding('grid'),
            columns: binding('{{3}}'),
            data: binding(`{{[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ text: 'R' + n }))}}`),
          },
          styles: { listStyle: binding('bordered'), gap: binding('{{12}}') },
        },
        8
      );

      // Three lines, two column dividers each; the last line has two records and still both dividers.
      expect(verticalDividers()).toHaveLength(6);
      expect(dividers()).toHaveLength(2);
      const last = [...list().children].slice(-4);
      expect(last.map((node) => node.classList.contains('listview-record-divider-vertical'))).toEqual([
        false,
        true,
        false,
        true,
      ]);
    });

    test('[Listview-STYLE-008] a line with one record out of four still has its three dividers, each in its own track', async () => {
      // Break this catches: dividers that slide into the tracks of missing records.
      await mount(
        {
          properties: {
            mode: binding('grid'),
            columns: binding('{{4}}'),
            data: binding(`{{[1].map((n) => ({ text: 'R' + n }))}}`),
          },
          styles: { listStyle: binding('bordered'), gap: binding('{{12}}') },
        },
        1
      );

      const kinds = [...list().children].map((node) =>
        node.classList.contains('listview-record-divider-vertical') ? 'divider' : (node.getAttribute('role') ?? 'empty')
      );
      expect(kinds).toEqual(['listitem', 'divider', 'empty', 'divider', 'empty', 'divider']);
    });

    test.each(['container', 'plain'])(
      '[Listview-STYLE-008] a %s grid adds no divider or filler for an incomplete last line',
      async (listStyle) => {
        // Break this catches: lines or empty cells leaking into the styles that have no dividers.
        await mount(
          {
            properties: {
              mode: binding('grid'),
              columns: binding('{{3}}'),
              data: binding(`{{[1, 2, 3, 4].map((n) => ({ text: 'R' + n }))}}`),
            },
            styles: { listStyle: binding(listStyle) },
          },
          4
        );
        expect(verticalDividers()).toHaveLength(0);
        expect(list().children).toHaveLength(4);
      }
    );

    test('[Listview-STYLE-008] grid Bordered ignores showBorder, which stays Legacy-only', async () => {
      // Break this catches: the Legacy toggle hiding the Bordered dividers.
      await mount(
        {
          properties: {
            mode: binding('grid'),
            columns: binding('{{3}}'),
            data: binding(SIX_RECORDS),
            showBorder: binding('{{false}}'),
          },
          styles: { listStyle: binding('bordered'), recordDividerColor: binding('rgb(1, 2, 3)') },
        },
        6
      );

      expect(dividers()).toHaveLength(1);
      expect(verticalDividers()).toHaveLength(4);
    });

    test('[Listview-STYLE-009] Legacy in dark mode keeps the white-to-dark swap behind the records', async () => {
      // Break this catches: a Legacy record background covering the dark surface the white swap gives.
      await mount({ styles: { listStyle: binding('legacy'), backgroundColor: binding('#fff') }, darkMode: true });

      expect(container().style.backgroundColor).toBe('rgb(35, 46, 60)');
      rows().forEach((row) => expect(row.style.backgroundColor).toBe(''));
    });
  });

  describe('Listview: grid record height', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test('[Listview-ROW-004] grid records use gridRecordHeight', async () => {
      // Break this catches: grid reading rowHeight only, so new grids lose their 150px records.
      await mount({
        properties: { mode: binding('grid'), rowHeight: binding('100'), gridRecordHeight: binding('150') },
      });

      rows().forEach((row) => expect(row.style.height).toBe('150px'));
    });

    test('[Listview-ROW-004] grid records without gridRecordHeight use rowHeight', async () => {
      // Break this catches: no fallback, so a saved grid without the key loses its height.
      await mount({ properties: { mode: binding('grid'), rowHeight: binding('100') } });

      rows().forEach((row) => expect(row.style.height).toBe('100px'));
    });

    test('[Listview-ROW-004] list records keep rowHeight when gridRecordHeight is set', async () => {
      // Break this catches: the grid height leaking into list mode.
      await mount({ properties: { rowHeight: binding('80'), gridRecordHeight: binding('150') } });

      rows().forEach((row) => expect(row.style.height).toBe('80px'));
    });
  });

  /** A Text copied from elsewhere and pasted into the ListView's record: 120 tall, 20 from the top. */
  async function pasteTallTextInto(listProperties) {
    seedApp({
      [ID]: componentDefinition(ID, NAME, 'Listview', {
        dataSourceSelector: binding('rawJson'),
        data: binding(THREE_RECORDS),
        ...listProperties,
      }),
    });
    const text = componentDefinition('txt9', 'text9', 'Text', { text: binding('tall') });
    text.component.parent = ID;
    text.layouts = { desktop: { top: 20, left: 0, width: 10, height: 120 } };
    await pasteComponents(ID, {
      isCut: false,
      isCloning: false,
      pageId: 'page-1',
      newComponents: [{ component: text.component, layouts: text.layouts, parent: ID, id: 'txt9', events: [] }],
    });
    const pasted = Object.values(store().getCurrentPageComponents(MODULE_ID)).find(
      (entry) => entry.component.name !== NAME && entry.component.parent === ID
    );
    return pasted.layouts.desktop;
  }

  describe('Listview: pasting into a grid record', () => {
    test('[Listview-ROW-007] a paste into a grid record is limited by gridRecordHeight, not rowHeight', async () => {
      // Break this catches: the paste limit read from rowHeight (80), which pulls a 120px child to the top.
      const layout = await pasteTallTextInto({
        mode: binding('grid'),
        rowHeight: binding('80'),
        gridRecordHeight: binding('150'),
      });

      expect(layout.height).toBe(120);
      expect(layout.top).toBe(20);
      expect(layout.top + layout.height).toBeLessThanOrEqual(150);
    });

    test('[Listview-ROW-007] a paste into a list record is still limited by rowHeight', async () => {
      // Break this catches: the grid height leaking into list mode, letting a child run past the record.
      const layout = await pasteTallTextInto({ rowHeight: binding('80'), gridRecordHeight: binding('150') });

      expect(layout.height).toBe(120);
      expect(layout.top).toBe(0);
    });
  });

  /** The real Styles tab for the seeded ListView, as the Inspector builds it. */
  function renderStylesTab(listStyle) {
    seedApp({ [ID]: componentDefinition(ID, NAME, 'Listview', {}, { styles: { listStyle: binding(listStyle) } }) });
    const stored = store().getCurrentPageComponents(MODULE_ID)[ID];
    const componentMeta = {
      ...componentTypeDefinitionMap.Listview,
      ...stored.component,
      definition: stored.component.definition,
    };
    const component = { id: ID, component: JSON.parse(JSON.stringify(componentMeta)) };
    return (
      <MemoryRouter>
        <Inspector.RenderStyleOptions
          componentMeta={componentMeta}
          component={component}
          paramUpdated={() => {}}
          dataQueries={[]}
          currentState={{}}
          allComponents={{}}
          hasCustomStyling={false}
        />
      </MemoryRouter>
    );
  }

  /** Each Styles tab group as { title, fields } in the order shown. */
  const styleGroups = () =>
    [...document.querySelectorAll('.accordion-item')].map((group) => ({
      title: group.querySelector('.accordion-title-text')?.textContent,
      fields: [...group.querySelectorAll('label[data-cy^="label-"]')].map((label) => label.textContent),
    }));
  const groupFields = (title) => styleGroups().find((group) => group.title === title)?.fields;

  const CONTAINER_FIELDS = ['Background', 'Border', 'Border radius', 'Box shadow'];

  describe('Listview: the Styles tab follows List style', () => {
    // Legacy shows a code field (Show bottom border), and the code editor watches its own visibility.
    beforeAll(() => {
      global.IntersectionObserver ??= class {
        observe() {}
        unobserve() {}
        disconnect() {}
      };
    });

    test.each([
      ['legacy', ['List style', 'Show bottom border']],
      ['bordered', ['List style', 'Gap', 'Background', 'Divider']],
      ['container', ['List style', 'Gap', 'Background', 'Border', 'Border radius', 'Box shadow']],
      ['plain', ['List style', 'Gap']],
    ])('[Listview-STYLE-010] List style %s shows only its own record fields', (listStyle, expected) => {
      // Break this catches: a field shown for a style that ignores it, or missing for one that uses it.
      render(renderStylesTab(listStyle));

      expect(groupFields('Records')).toEqual(expected);
    });

    test('[Listview-STYLE-010] changing List style swaps the record fields', () => {
      // Break this catches: fields computed once, so switching style keeps the old style's fields.
      const { rerender } = render(renderStylesTab('container'));
      rerender(renderStylesTab('bordered'));

      expect(groupFields('Records')).toEqual(['List style', 'Gap', 'Background', 'Divider']);
    });

    test('[Listview-STYLE-010] the List style select offers the four styles, Legacy last', () => {
      // Break this catches: a style missing from the select, so it can only be reached by editing JSON.
      expect(listviewConfig.styles.listStyle.options.map((option) => option.value)).toEqual([
        'bordered',
        'container',
        'plain',
        'legacy',
      ]);
      expect(listviewConfig.definition.styles.listStyle).toEqual({ value: 'legacy' });
    });

    test('[Listview-STYLE-012] record fields sit under Records and the widget box fields under Container', () => {
      // Break this catches: record and box fields in one flat list, where the two Backgrounds look alike.
      render(renderStylesTab('container'));

      expect(styleGroups().map((group) => group.title)).toEqual(['Header', 'Records', 'Container']);
      expect(groupFields('Container')).toEqual(CONTAINER_FIELDS);
    });
  });

  /** No row children, so dynamic height falls back to the configured record height. */
  const bareWidget = createWidgetHarness({
    componentType: 'Listview',
    handle: NAME,
    id: ID,
    defaultProperties: {
      dataSourceSelector: binding('rawJson'),
      data: binding(THREE_RECORDS),
      rowHeight: binding('100'),
      columns: binding('{{3}}'),
      dynamicHeight: binding('{{true}}'),
    },
    capabilities: { dnd: true },
    widgetHeight: 400,
    widgetWidth: 600,
  });

  async function dynamicHeightFor({ properties = {}, styles = {} }) {
    bareWidget.render({ currentMode: 'view', properties, styles });
    await waitFor(() => expect(container()).toBeInTheDocument());
    const state = store();
    return resolveListviewHeightFromRows({
      componentId: ID,
      contextIndices: null,
      component: state.getResolvedComponent(ID),
      currentLayout: 'desktop',
      currentPageComponents: state.getCurrentPageComponents(MODULE_ID),
      temporaryLayouts: {},
      moduleId: MODULE_ID,
    });
  }

  describe('Listview: dynamic height counts the record style', () => {
    beforeEach(bareWidget.setup);
    afterEach(bareWidget.teardown);

    test("[Listview-ROW-006] Legacy keeps today's height: records, bottom borders and 7px padding", async () => {
      // Break this catches: the new allowances leaking into Legacy, which resizes every saved dynamic list.
      const height = await dynamicHeightFor({ styles: { listStyle: binding('legacy') } });

      // 3 x 100 + 3 bottom borders + 18 chrome.
      expect(height).toBe(321);
    });

    test('[Listview-ROW-006] Bordered with gap 12 adds the 12px padding and the 2 gaps', async () => {
      // Break this catches: a dynamic list sized for 7px padding and no gaps, which cuts off its last record.
      const height = await dynamicHeightFor({ styles: { listStyle: binding('bordered'), gap: binding('{{12}}') } });

      // 3 x 100 + 2 x 12 gap (the line takes no space) + 28 chrome (12px padding x 2 + borders + safety).
      expect(height).toBe(352);
    });

    const GRID_CONTAINER = { listStyle: binding('container'), gap: binding('{{12}}') };

    test('[Listview-ROW-006] grid uses gridRecordHeight', async () => {
      // Break this catches: grid dynamic height sized from rowHeight, so a 150px grid record is cut off.
      const height = await dynamicHeightFor({
        properties: { mode: binding('grid'), gridRecordHeight: binding('150') },
        styles: GRID_CONTAINER,
      });

      // One line of three records: 150 + 28 chrome, no gap.
      expect(height).toBe(178);
    });

    test('[Listview-ROW-006] grid without gridRecordHeight uses rowHeight', async () => {
      // Break this catches: no fallback, so a saved grid without the key sizes to nothing.
      const height = await dynamicHeightFor({ properties: { mode: binding('grid') }, styles: GRID_CONTAINER });

      expect(height).toBe(128);
    });

    describe('[Listview-ROW-009] dynamic height reads the same values as the widget', () => {
      const pagedHeight = (rowsPerPage) =>
        dynamicHeightFor({
          properties: {
            data: binding('{{Array.from({ length: 12 }, (_, i) => ({ text: `r${i}` }))}}'),
            enablePagination: binding('{{true}}'),
            rowsPerPage: binding(rowsPerPage),
          },
          styles: { listStyle: binding('legacy') },
        });

      test('[Listview-ROW-009] a negative rows-per-page counts the ten records the list shows', async () => {
        // Break this catches: the height rule keeping -5 while the list falls back to ten.
        // 10 x 100 + 10 bottom borders + 60 pager + 18 chrome.
        expect(await pagedHeight('{{-5}}')).toBe(1088);
      });

      test('[Listview-ROW-009] a fractional rows-per-page counts the whole records the list shows', async () => {
        // Break this catches: a half record in the count, which gives a fractional height.
        // 2 x 100 + 2 bottom borders + 60 pager + 18 chrome.
        expect(await pagedHeight('{{2.5}}')).toBe(280);
      });

      test('[Listview-ROW-009] a capitalised Grid is sized as the grid the list shows', async () => {
        // Break this catches: only the lower-case word meaning grid, which stacks the records in the height.
        const height = await dynamicHeightFor({
          properties: { mode: binding('Grid'), gridRecordHeight: binding('150') },
          styles: GRID_CONTAINER,
        });

        expect(height).toBe(178);
      });
    });
  });

  /** A ListView exported before 2.0: none of the 2.0 keys. */
  const PRE_TWO_ZERO_EXPORT = {
    properties: {
      data: { value: "{{[{ text: 'a' }]}}" },
      rowHeight: { value: '100' },
      showBorder: { value: '{{true}}' },
    },
    styles: { backgroundColor: { value: 'var(--cc-surface1-surface)' } },
  };

  // The harness seeds the config `definition` under the export, as the server does on import and load.
  const importedWidget = createWidgetHarness({
    componentType: 'Listview',
    handle: NAME,
    id: ID,
    defaultProperties: PRE_TWO_ZERO_EXPORT.properties,
    defaultStyles: PRE_TWO_ZERO_EXPORT.styles,
    capabilities: { dnd: true },
    widgetHeight: 300,
    widgetWidth: 600,
  });

  describe('Listview: an export from before 2.0', () => {
    beforeEach(importedWidget.setup);
    afterEach(importedWidget.teardown);

    test('[Listview-COMPAT-003] loads with the old look once the config defaults are merged under it', async () => {
      // Break this catches: a new-look config default for a 2.0 key, restyling every imported ListView.
      importedWidget.render({ currentMode: 'view' });
      await waitFor(() => expect(rows()).toHaveLength(1));

      const { properties, styles } = store().getCurrentPageComponents(MODULE_ID)[ID].component.definition;
      expect(styles.listStyle).toEqual({ value: 'legacy' });
      expect(properties.showHeader).toEqual({ value: '{{false}}' });
      expect(properties.rowHeight).toEqual({ value: '100' });
      expect(properties.gridRecordHeight).toBeUndefined();
      expect(container().style.padding).toBe('7px');
      expect(rows()[0].style.height).toBe('100px');
    });
  });
});

describe('ListviewServerPagination', () => {
  /**
   * Listview 2.0 server-side pagination (tj-ee#5557): with Type set to server side the list shows `data`
   * as-is and counts pages from Total records. Contract: frontend/ee/test/app-builder/widgets/Listview/TESTING.md
   * (Listview-SRV-001..008). Real store, real RenderWidget.
   */

  const ID = 'lv1';
  const NAME = 'listview1';
  const records = (count, prefix = 'r') =>
    `{{${JSON.stringify(Array.from({ length: count }, (_, index) => ({ name: `${prefix}${index}` })))}}}`;

  function textChild() {
    const definition = componentDefinition('txt1', 'text1', 'Text', { text: binding('{{listItem.name}}') });
    definition.component.parent = ID;
    definition.component.definition.styles = {};
    definition.component.definition.others = {
      showOnDesktop: binding('{{true}}'),
      showOnMobile: binding('{{false}}'),
    };
    return definition;
  }

  const widget = createWidgetHarness({
    componentType: 'Listview',
    handle: NAME,
    id: ID,
    defaultProperties: {
      dataSourceSelector: binding('rawJson'),
      data: binding(records(5)),
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
      serverSidePagination: binding('{{true}}'),
      totalRecords: binding('{{23}}'),
    },
    defaultStyles: {
      backgroundColor: binding('var(--cc-surface1-surface)'),
      borderColor: binding('var(--cc-weak-border)'),
    },
    defaultExtraComponents: { txt1: textChild() },
    capabilities: { dnd: true },
    widgetHeight: 600,
    widgetWidth: 600,
  });

  const user = () => widget.session.user;
  const rows = () => [...document.querySelectorAll('.list-item')];
  const rowTexts = () => rows().map((node) => node.textContent);
  const exposed = (key) => widget.exposed()?.[key];
  const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 80)));
  const fired = (key) => store().getVariable(key, MODULE_ID) ?? 0;
  const nextButton = () => document.querySelector('[data-cy="pagination-button-to-next"]');
  // The shared pager has no last-page button: walk to the end with Next, which is also what proves the page count.
  const lastPageLink = async () => {
    for (let step = 0; step < 60 && nextButton() && !nextButton().disabled; step += 1) await user().click(nextButton());
  };
  const setProperty = (name, value) =>
    widget.session.store.act(() => {
      widget.setComponentProperty(ID, name, binding(value).value, 'properties');
    });
  const setData = (value) => setProperty('data', value);

  const PAGE_EVENTS = [
    {
      id: 'evt-page',
      index: 0,
      sourceId: ID,
      name: 'evt-page',
      target: 'component',
      event: {
        eventId: 'onPageChanged',
        actionId: 'set-custom-variable',
        key: 'pageCalls',
        value: '{{(variables.pageCalls ?? 0) + 1}}',
      },
    },
  ];

  async function mount(options = {}, rowCount = 5) {
    widget.render({ currentMode: 'view', ...options });
    await waitFor(() => expect(rows()).toHaveLength(rowCount));
  }

  describe('Listview: server-side pagination', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test('[Listview-SRV-001] total 23 and 5 per page gives 5 pages and shows every data record unsliced', async () => {
      // Break this catches: counting pages from data.length, or slicing server data to the page.
      await mount({ properties: { data: binding(records(8)) } }, 8);

      expect(rowTexts()).toEqual(Array.from({ length: 8 }, (_, index) => `r${index}`));
      await lastPageLink();
      await waitFor(() => expect(exposed('pageIndex')).toBe(5));
      expect(rows()).toHaveLength(8);
    });

    test('[Listview-SRV-001] a page past the data length still shows the data as-is', async () => {
      // Break this catches: slicing server data by page, which leaves page 3 of an 8-record result empty.
      await mount({ properties: { data: binding(records(8)) } }, 8);

      await widget.act('setPage', 3);

      await waitFor(() => expect(exposed('pageIndex')).toBe(3));
      expect(rowTexts()).toEqual(Array.from({ length: 8 }, (_, index) => `r${index}`));
    });

    test('[Listview-SRV-002] new rows on page 3 keep the list on page 3', async () => {
      // Break this catches: a clamp against data.length, which snaps the list to page 1 after each query.
      await mount();
      await widget.act('setPage', 3);
      await waitFor(() => expect(exposed('pageIndex')).toBe(3));

      await setData(records(5, 'n'));

      await waitFor(() => expect(rowTexts()[0]).toBe('n0'));
      await settle();
      expect(exposed('pageIndex')).toBe(3);
    });

    test('[Listview-SRV-003] the first record on server page 3 is selectedRecordIndex 10', async () => {
      // Break this catches: a page-relative index on a server page.
      await mount();
      await widget.act('setPage', 3);
      await waitFor(() => expect(exposed('pageIndex')).toBe(3));

      await user().click(rows()[0]);

      await waitFor(() => expect(exposed('selectedRecordIndex')).toBe(10));
      expect(exposed('selectedRecordId')).toBe(0);
    });

    test('[Listview-SRV-004] client side ignores Total records: slices the data and counts pages from it', async () => {
      // Break this catches: treating every list as server side, or a client list reading Total records.
      await mount(
        {
          properties: {
            data: binding(records(10)),
            serverSidePagination: binding('{{false}}'),
            totalRecords: binding('{{99}}'),
          },
        },
        5
      );

      await lastPageLink();
      await waitFor(() => expect(exposed('pageIndex')).toBe(2));
      expect(rowTexts()[0]).toBe('r5');
      await widget.act('setPage', 9);
      await waitFor(() => expect(exposed('pageIndex')).toBe(2));
    });

    test('[Listview-SRV-004] a saved list without serverSidePagination behaves as client side', async () => {
      // Break this catches: defaulting a missing serverSidePagination to server side.
      await mount(
        { properties: { data: binding(records(10)), serverSidePagination: undefined, totalRecords: undefined } },
        5
      );

      expect(rowTexts()[0]).toBe('r0');
      await lastPageLink();
      await waitFor(() => expect(exposed('pageIndex')).toBe(2));
    });

    test('[Listview-SRV-005] a clamp after Total records shrinks moves the page and fires no On page change', async () => {
      // Break this catches: reporting a silent clamp as a user page change.
      await mount({ events: PAGE_EVENTS });
      await widget.act('setPage', 5);
      await waitFor(() => expect(exposed('pageIndex')).toBe(5));

      await setProperty('totalRecords', '{{11}}');

      await waitFor(() => expect(exposed('pageIndex')).toBe(3));
      await settle();
      expect(fired('pageCalls')).toBe(0);
    });

    test.each([
      ['empty', "{{''}}"],
      ['negative', '{{-4}}'],
      ['not a number', "{{'abc'}}"],
    ])('[Listview-SRV-006] Total records %s falls back to data.length for the page count', async (_label, total) => {
      // Break this catches: a NaN or negative page count, or trusting a value that is not a count.
      await mount({ properties: { data: binding(records(8)), totalRecords: binding(total) } }, 8);

      await lastPageLink();
      await waitFor(() => expect(exposed('pageIndex')).toBe(2));
    });

    test('[Listview-SRV-007] a new page of data clears selectedRecordIndex, selectedRecordId and selectedRecord', async () => {
      // Break this catches: keeping a selection that points at a record of the previous page.
      await mount();
      await user().click(rows()[1]);
      await waitFor(() => expect(exposed('selectedRecordIndex')).toBe(1));

      await setData(records(5, 'n'));

      await waitFor(() => expect(exposed('selectedRecordIndex')).toBeUndefined());
      expect(exposed('selectedRecordId')).toBeUndefined();
      expect(exposed('selectedRecord')).toBeUndefined();
    });

    test('[Listview-SRV-007] a new data value with equal content also clears the selection', async () => {
      // Break this catches: comparing content, so re-loading the same page leaves a stale selection.
      await mount();
      await user().click(rows()[1]);
      await waitFor(() => expect(exposed('selectedRecordIndex')).toBe(1));

      await setData(`{{${records(5).slice(2, -2)}.map((record) => ({ ...record }))}}`);

      await waitFor(() => expect(exposed('selectedRecordIndex')).toBeUndefined());
      expect(exposed('selectedRecordId')).toBeUndefined();
      expect(exposed('selectedRecord')).toBeUndefined();
    });

    test('[Listview-SRV-007] a re-render that does not change data keeps the selection', async () => {
      // Guard: the clear is tied to a new data value, not to every render.
      await mount();
      await user().click(rows()[1]);
      await waitFor(() => expect(exposed('selectedRecordIndex')).toBe(1));

      await setProperty('rowHeight', '90');
      await settle();

      expect(exposed('selectedRecordIndex')).toBe(1);
    });

    test('[Listview-SRV-008] setPage clamps against Total records, not data.length', async () => {
      // Break this catches: clamping setPage to the page of data, which makes later server pages unreachable.
      await mount();

      await widget.act('setPage', 9);
      await waitFor(() => expect(exposed('pageIndex')).toBe(5));
      await widget.act('setPage', 0);
      await waitFor(() => expect(exposed('pageIndex')).toBe(1));
      await setProperty('totalRecords', '{{11}}');
      await widget.act('setPage', 9);
      await waitFor(() => expect(exposed('pageIndex')).toBe(3));
    });

    test('[Listview-SRV-010] dynamic height counts every rendered server row, not one page', async () => {
      // Break this catches: sizing a server list for rowsPerPage rows while it renders every row of data.
      const PAGER_ALLOWANCE = 60;
      await mount({ properties: { data: binding(records(8)) } }, 8);
      const heightNow = () => {
        const state = store();
        return resolveListviewHeightFromRows({
          componentId: ID,
          contextIndices: null,
          component: state.getResolvedComponent(ID),
          currentLayout: 'desktop',
          currentPageComponents: state.getCurrentPageComponents(MODULE_ID),
          temporaryLayouts: {},
          moduleId: MODULE_ID,
        });
      };
      const server = heightNow();
      await setProperty('enablePagination', '{{false}}');
      await waitFor(() => expect(heightNow()).not.toBe(server));

      expect(server).toBe(heightNow() + PAGER_ALLOWANCE);
    });

    test('[Listview-SRV-011] a query run (data and Total records empty, then back) keeps the page', async () => {
      // Break this catches: clamping to page 1 while the bound query runs, which strands the list on page 1.
      await mount({ events: PAGE_EVENTS });
      await widget.act('setPage', 3);
      await waitFor(() => expect(exposed('pageIndex')).toBe(3));
      const seen = [];
      const unsubscribe = useStore.subscribe(() => seen.push(exposed('pageIndex')));

      await setProperty('data', '{{[]}}');
      await setProperty('totalRecords', '{{undefined}}');
      await settle();
      await setData(records(5, 'n'));
      await setProperty('totalRecords', '{{23}}');
      await waitFor(() => expect(rowTexts()[0]).toBe('n0'));
      await settle();
      unsubscribe();

      expect(exposed('pageIndex')).toBe(3);
      expect(seen.filter((page) => page !== undefined && page !== 3)).toEqual([]);
      expect(fired('pageCalls')).toBe(0);
    });

    test('[Listview-SRV-012] with a valid Total records the pager stays while data is empty', async () => {
      // Break this catches: hiding the pager on an empty page, which leaves the user no way back.
      await mount();
      await widget.act('setPage', 3);
      await waitFor(() => expect(exposed('pageIndex')).toBe(3));

      await setData('{{[]}}');

      await waitFor(() => expect(rows()).toHaveLength(0));
      expect(document.querySelector('[data-cy="pagination-button-to-previous"]')).toBeInTheDocument();
      expect(exposed('pageIndex')).toBe(3);
    });

    test.each([
      ['a fraction below one', '{{0.5}}', 1],
      ['a fraction between pages', '{{5.5}}', 2],
    ])(
      '[Listview-SRV-013] Total records %s counts pages like the pager and fires no event',
      async (_label, total, page) => {
        // Break this catches: a page count the shared pager disagrees with, which it then "fixes" as a user page change.
        await mount({ events: PAGE_EVENTS, properties: { totalRecords: binding(total) } });
        await widget.act('setPage', 2);
        await waitFor(() => expect(exposed('pageIndex')).toBe(Math.min(2, page === 1 ? 1 : 2)));
        await settle();

        expect(exposed('pageIndex')).toBe(page === 1 ? 1 : 2);
        expect(fired('pageCalls')).toBe(0);
      }
    );

    test('[Listview-SRV-014] leaving server side clears a selection counted across pages', async () => {
      // Break this catches: an index of 10 left standing on a client list of 5 records.
      await mount();
      await widget.act('setPage', 3);
      await waitFor(() => expect(exposed('pageIndex')).toBe(3));
      await user().click(rows()[0]);
      await waitFor(() => expect(exposed('selectedRecordIndex')).toBe(10));

      await setProperty('serverSidePagination', '{{false}}');

      await waitFor(() => expect(exposed('selectedRecordIndex')).toBeUndefined());
      expect(exposed('selectedRecordId')).toBeUndefined();
      expect(exposed('selectedRecord')).toBeUndefined();
    });

    test('[Listview-SRV-014] turning pagination off clears a selection counted across pages', async () => {
      // Break this catches: the same stale index after the pager is switched off.
      await mount();
      await widget.act('setPage', 3);
      await waitFor(() => expect(exposed('pageIndex')).toBe(3));
      await user().click(rows()[0]);
      await waitFor(() => expect(exposed('selectedRecordIndex')).toBe(10));

      await setProperty('enablePagination', '{{false}}');

      await waitFor(() => expect(exposed('selectedRecordIndex')).toBeUndefined());
      expect(exposed('selectedRecord')).toBeUndefined();
    });
  });

  describe('Listview: a server-side list nested in a record', () => {
    const NESTED = `{{[{ name: 'o1', items: [{ name: 'a' }, { name: 'b' }] }, { name: 'o2', items: [{ name: 'c' }] }]}}`;
    const inner = () => {
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
        rowsPerPage: binding('{{5}}'),
        enablePagination: binding('{{true}}'),
        serverSidePagination: binding('{{true}}'),
        totalRecords: binding('{{12}}'),
      });
      definition.component.parent = ID;
      definition.component.definition.styles = {};
      definition.component.definition.others = {
        showOnDesktop: binding('{{true}}'),
        showOnMobile: binding('{{false}}'),
      };
      return definition;
    };
    const innerText = () => {
      const definition = componentDefinition('txt2', 'text2', 'Text', { text: binding('{{listItem.name}}') });
      definition.component.parent = 'lv2';
      definition.component.definition.styles = {};
      definition.component.definition.others = {
        showOnDesktop: binding('{{true}}'),
        showOnMobile: binding('{{false}}'),
      };
      return definition;
    };
    const nested = createWidgetHarness({
      componentType: 'Listview',
      handle: NAME,
      id: ID,
      defaultProperties: {
        dataSourceSelector: binding('rawJson'),
        data: binding(NESTED),
        mode: binding('list'),
        columns: binding('{{1}}'),
        rowHeight: binding('400'),
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
      defaultExtraComponents: { lv2: inner(), txt2: innerText() },
      capabilities: { dnd: true },
      widgetHeight: 800,
      widgetWidth: 600,
    });
    const innerRows = () => [...document.querySelectorAll('.list-item .list-item')];
    const innerSelected = () =>
      useStore.getState().resolvedStore.modules[MODULE_ID].exposedValues.components.lv2?.[0]?.selectedRecordIndex;

    beforeEach(nested.setup);
    afterEach(nested.teardown);

    test('[Listview-SRV-015] an unrelated change keeps the inner selection; new outer data clears it', async () => {
      // Break this catches: a fresh inner data reference on every outer update, which wipes the inner selection.
      nested.render({ currentMode: 'view' });
      await waitFor(() => expect(innerRows().length).toBeGreaterThan(0));
      await nested.session.user.click(innerRows()[1]);
      await waitFor(() => expect(innerSelected()).toBe(1));

      await nested.session.store.act(() => {
        store().setVariable('sfx', '!', MODULE_ID);
      });
      await settle();
      expect(innerSelected()).toBe(1);

      await nested.session.store.act(() => {
        nested.setComponentProperty(
          ID,
          'data',
          binding(`{{[{ name: 'o1', items: [{ name: 'x' }, { name: 'y' }] }, { name: 'o2', items: [{ name: 'c' }] }]}}`)
            .value,
          'properties'
        );
      });
      await waitFor(() => expect(innerSelected()).toBeUndefined());
    });
  });
});

describe('ListviewVariablesCsaEvents', () => {
  /**
   * Listview 2.0 variables, actions and events (tj-ee#5555): selectedRecordIndex, pageIndex, setPage,
   * On page change, Record hovered and the visibility/disable/loading actions. Contract:
   * frontend/ee/test/app-builder/widgets/Listview/TESTING.md. Real store, real RenderWidget.
   */

  const ID = 'lv1';
  const NAME = 'listview1';
  const records = (count, prefix = 'r') =>
    `{{${JSON.stringify(Array.from({ length: count }, (_, index) => ({ name: `${prefix}${index}` })))}}}`;

  function textChild() {
    const definition = componentDefinition('txt1', 'text1', 'Text', { text: binding('{{listItem.name}}') });
    definition.component.parent = ID;
    definition.component.definition.styles = {};
    definition.component.definition.others = {
      showOnDesktop: binding('{{true}}'),
      showOnMobile: binding('{{false}}'),
    };
    return definition;
  }

  const widget = createWidgetHarness({
    componentType: 'Listview',
    handle: NAME,
    id: ID,
    defaultProperties: {
      dataSourceSelector: binding('rawJson'),
      data: binding(records(10)),
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
    defaultExtraComponents: { txt1: textChild() },
    capabilities: { dnd: true },
    widgetHeight: 600,
    widgetWidth: 600,
  });

  const user = () => widget.session.user;
  const container = () => document.getElementById(ID);
  const rows = () => [...document.querySelectorAll('.list-item')];
  const rowTexts = () => rows().map((node) => node.textContent);
  const exposed = (key) => widget.exposed()?.[key];
  const nextPage = () => user().click(document.querySelector('[data-cy="pagination-button-to-next"]'));
  const previousPage = () => user().click(document.querySelector('[data-cy="pagination-button-to-previous"]'));
  const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 80)));
  const recordsEqualTo10 = () => `{{${records(10).slice(2, -2)}.map((record) => ({ ...record }))}}`;
  const fired = (key) => store().getVariable(key, MODULE_ID) ?? 0;
  const setData = (value) =>
    widget.session.store.act(() => {
      widget.setComponentProperty(ID, 'data', binding(value).value, 'properties');
    });
  const setProperty = (name, value) =>
    widget.session.store.act(() => {
      widget.setComponentProperty(ID, name, binding(value).value, 'properties');
    });

  const handler = (eventId, index, key, value) => ({
    id: `evt-${eventId}-${index}`,
    index,
    sourceId: ID,
    name: `evt-${eventId}-${index}`,
    target: 'component',
    event: { eventId, actionId: 'set-custom-variable', key, value },
  });
  // The page the exposed state held when the handler ran: proves pageIndex updates before the event.
  const PAGE_EVENTS = [
    handler('onPageChanged', 0, 'pageCalls', '{{(variables.pageCalls ?? 0) + 1}}'),
    handler('onPageChanged', 1, 'pageAtEvent', `{{components.${NAME}.pageIndex}}`),
  ];
  const HOVER_EVENTS = [
    handler('onRecordHovered', 0, 'hoverCalls', '{{(variables.hoverCalls ?? 0) + 1}}'),
    handler('onRecordHovered', 1, 'hoverItem', '{{listItem.name}}'),
  ];

  async function mount(options = {}) {
    widget.render({ currentMode: 'view', ...options });
    await waitFor(() => expect(rows()).toHaveLength(5));
  }

  async function onPageTwo() {
    await mount();
    await nextPage();
    await waitFor(() => expect(rowTexts()[0]).toContain('r5'));
  }

  describe('Listview: selectedRecordIndex', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test('[Listview-SEL-003] the first record on page two is selectedRecordIndex 5 and selectedRecordId 0', async () => {
      // Break this catches: a page-relative index, so an app cannot tell page two's record 0 from page one's.
      await onPageTwo();

      await user().click(rows()[0]);

      await waitFor(() => expect(exposed('selectedRecordIndex')).toBe(5));
      expect(exposed('selectedRecordId')).toBe(0);
    });

    test('[Listview-SEL-004] a page change keeps selectedRecordIndex', async () => {
      // Break this catches: resetting the selection when the page turns.
      await onPageTwo();
      await user().click(rows()[0]);
      await waitFor(() => expect(exposed('selectedRecordIndex')).toBe(5));

      await previousPage();

      await waitFor(() => expect(rowTexts()[0]).toContain('r0'));
      expect(exposed('selectedRecordIndex')).toBe(5);
    });

    test('[Listview-SEL-005] new data with equal content clears index, id and record together', async () => {
      // Break this catches: keeping the selection when a new data value has equal content, which Table clears.
      await onPageTwo();
      await user().click(rows()[0]);
      await waitFor(() => expect(exposed('selectedRecordIndex')).toBe(5));

      await setData(recordsEqualTo10());

      await waitFor(() => expect(exposed('selectedRecordIndex')).toBeUndefined());
      expect(exposed('selectedRecordId')).toBeUndefined();
      expect(exposed('selectedRecord')).toBeUndefined();
    });

    test('[Listview-SEL-005] new data with changed content clears the selection even when its position is in range', async () => {
      // Break this catches: a past-the-end rule that keeps an index pointing at a different record.
      await onPageTwo();
      await user().click(rows()[0]);
      await waitFor(() => expect(exposed('selectedRecordIndex')).toBe(5));

      await setData(records(10, 'x'));

      await waitFor(() => expect(exposed('selectedRecordIndex')).toBeUndefined());
      expect(exposed('selectedRecordId')).toBeUndefined();
      expect(exposed('selectedRecord')).toBeUndefined();
    });

    test('[Listview-SEL-005] data that shrinks past the selected position clears index, id and record together', async () => {
      // Break this catches: keeping one of the three variables, or none being cleared.
      await onPageTwo();
      await user().click(rows()[0]);
      await waitFor(() => expect(exposed('selectedRecordIndex')).toBe(5));

      await setData(records(3));

      await waitFor(() => expect(exposed('selectedRecordIndex')).toBeUndefined());
      expect(exposed('selectedRecordId')).toBeUndefined();
      expect(exposed('selectedRecord')).toBeUndefined();
    });

    test('[Listview-SEL-005] a re-render that does not change data keeps the selection', async () => {
      // Break this catches: clearing the selection on a render that does not change data.
      await onPageTwo();
      await user().click(rows()[0]);
      await waitFor(() => expect(exposed('selectedRecordIndex')).toBe(5));

      await setProperty('rowHeight', '90');
      await settle();

      expect(exposed('selectedRecordIndex')).toBe(5);
      expect(exposed('selectedRecordId')).toBe(0);
    });

    test('[Listview-SEL-004] selectedRecord stays the selected record after a page change', async () => {
      // Break this catches: the row-0 sync overwriting selectedRecord with the first record of another page.
      await onPageTwo();
      await user().click(rows()[0]);
      await waitFor(() => expect(exposed('selectedRecord')?.text1?.text).toBe('r5'));

      await previousPage();
      await waitFor(() => expect(rowTexts()[0]).toContain('r0'));
      await settle();

      expect(exposed('selectedRecordIndex')).toBe(5);
      expect(exposed('selectedRecord')?.text1?.text).toBe('r5');

      await setData(records(10, 'x'));

      await waitFor(() => expect(exposed('selectedRecord')).toBeUndefined());
      expect(exposed('selectedRecordIndex')).toBeUndefined();
    });

    test('[Listview-SEL-006] the older variables keep their values after a click', async () => {
      // Break this catches: changing a released variable while adding the new ones.
      await onPageTwo();

      await user().click(rows()[1]);

      await waitFor(() => expect(exposed('selectedRowId')).toBe(1));
      expect(exposed('selectedRow')).toEqual(exposed('selectedRecord'));
      expect(exposed('selectedRow')?.text1?.text).toBe('r6');
      expect(exposed('data')?.[1]?.text1?.text).toBe('r6');
    });
  });

  describe('Listview: page index, Set page and On page change', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test('[Listview-PAGE-009] pageIndex is 1 on first render', async () => {
      // Break this catches: leaving pageIndex unset until the first page change.
      await mount();

      await waitFor(() => expect(exposed('pageIndex')).toBe(1));
    });

    test('[Listview-PAGE-006] setPage(2) shows page two, sets pageIndex 2 and fires no On page change', async () => {
      // Break this catches: firing On page change for the action, which Table does not do.
      await mount({ events: PAGE_EVENTS });

      await widget.act('setPage', 2);

      await waitFor(() => expect(rowTexts()[0]).toContain('r5'));
      await waitFor(() => expect(exposed('pageIndex')).toBe(2));
      await settle();
      expect(fired('pageCalls')).toBe(0);
    });

    test('[Listview-PAGE-006] a pager click fires On page change exactly once with the new pageIndex', async () => {
      // Break this catches: not firing for the pager, or firing twice.
      await mount({ events: PAGE_EVENTS });

      await nextPage();

      await waitFor(() => expect(fired('pageCalls')).toBe(1));
      await settle();
      expect(fired('pageCalls')).toBe(1);
      expect(fired('pageAtEvent')).toBe(2);
      expect(exposed('pageIndex')).toBe(2);
    });

    test('[Listview-PAGE-007] setPage clamps out-of-range numbers to the first and last page', async () => {
      // Break this catches: letting the page run past the data (even for one render) or below one.
      await mount();
      const seen = [];
      const unsubscribe = useStore.subscribe(() => seen.push(exposed('pageIndex')));

      await widget.act('setPage', 9);
      await waitFor(() => expect(exposed('pageIndex')).toBe(2));
      await settle();
      unsubscribe();
      expect(seen).not.toContain(3);
      expect(rowTexts()[0]).toContain('r5');

      await widget.act('setPage', 0);
      await waitFor(() => expect(exposed('pageIndex')).toBe(1));
      expect(rowTexts()[0]).toContain('r0');
    });

    test('[Listview-PAGE-008] a clamp after data shrinks moves the page and fires no On page change', async () => {
      // Break this catches: reporting a silent clamp as a user page change.
      await mount({ events: PAGE_EVENTS });
      await widget.act('setPage', 2);
      await waitFor(() => expect(exposed('pageIndex')).toBe(2));

      await setData(records(3));

      await waitFor(() => expect(rows()).toHaveLength(3));
      await waitFor(() => expect(exposed('pageIndex')).toBe(1));
      await settle();
      expect(fired('pageCalls')).toBe(0);
    });

    test('[Listview-PAGE-008] a rowsPerPage change that removes the current page moves to page 1 and fires no event', async () => {
      // Break this catches: leaving the clamp to the pager, which reports it as a user page change.
      await mount({ events: PAGE_EVENTS });
      await widget.act('setPage', 2);
      await waitFor(() => expect(exposed('pageIndex')).toBe(2));

      await setProperty('rowsPerPage', '{{10}}');

      await waitFor(() => expect(rows()).toHaveLength(10));
      await waitFor(() => expect(exposed('pageIndex')).toBe(1));
      await settle();
      expect(fired('pageCalls')).toBe(0);
    });

    test('[Listview-PAGE-008] turning pagination off moves to page 1, so the first record is selectedRecordIndex 0', async () => {
      // Break this catches: keeping page two after the pager is gone, which offsets every record index by a page.
      await mount({ events: PAGE_EVENTS });
      await widget.act('setPage', 2);
      await waitFor(() => expect(exposed('pageIndex')).toBe(2));

      await setProperty('enablePagination', '{{false}}');

      await waitFor(() => expect(rows()).toHaveLength(10));
      await waitFor(() => expect(exposed('pageIndex')).toBe(1));
      await user().click(rows()[0]);
      await waitFor(() => expect(exposed('selectedRecordIndex')).toBe(0));
      await settle();
      expect(fired('pageCalls')).toBe(0);
    });
  });

  describe('Listview: Record hovered', () => {
    beforeEach(widget.setup);
    afterEach(() => {
      jest.useRealTimers();
      widget.teardown();
    });

    test('[Listview-EVT-005] entering a record and moving over its children fires once with that record', async () => {
      // Break this catches: firing on mouseover (every child move) or sending the wrong record.
      await mount({ events: HOVER_EVENTS });

      const row = rows()[3];
      // user-event sends no relatedTarget, which React reads as a fresh entry on every move.
      fireEvent.mouseOver(row, { relatedTarget: document.body });
      fireEvent.mouseOver(row.querySelector('p, div'), { relatedTarget: row });
      fireEvent.mouseOver(row, { relatedTarget: row.querySelector('p, div') });

      await waitFor(() => expect(fired('hoverCalls')).toBe(1));
      expect(store().getVariable('hoverItem', MODULE_ID)).toBe('r3');
      await new Promise((resolve) => setTimeout(resolve, 400));
      expect(fired('hoverCalls')).toBe(1);
    });

    test('[Listview-EVT-006] a fast move across records ends with the last record', async () => {
      // Break this catches: a throttle without a trailing call, which drops the record the pointer ends on.
      await mount({ events: HOVER_EVENTS });
      jest.useFakeTimers();

      [0, 1, 2, 3, 4].forEach((index) => fireEvent.mouseOver(rows()[index], { relatedTarget: document.body }));
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      jest.useRealTimers();

      await waitFor(() => expect(store().getVariable('hoverItem', MODULE_ID)).toBe('r4'));
      expect(fired('hoverCalls')).toBe(2);
    });
  });

  describe('Listview: visibility, disable and loading actions', () => {
    // What the rendered list shows for each variable, so a variable cannot agree with a widget that disagrees.
    const widgetState = (variable) =>
      ({
        isVisible: () => container().style.display !== 'none',
        isDisabled: () => container().getAttribute('data-disabled') === 'true',
        isLoading: () => rows().length === 0,
      })[variable]();

    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test('[Listview-CSA-001] setVisibility, setDisable and setLoading change the widget and the variables', async () => {
      // Break this catches: an action that updates the variable but not the widget, or the reverse.
      await mount();
      expect(exposed('isVisible')).toBe(true);
      expect(exposed('isDisabled')).toBe(false);
      expect(exposed('isLoading')).toBe(false);

      await widget.act('setVisibility', false);
      await waitFor(() => expect(exposed('isVisible')).toBe(false));
      expect(container()).toHaveStyle({ display: 'none' });

      await widget.act('setDisable', true);
      await waitFor(() => expect(exposed('isDisabled')).toBe(true));
      expect(container()).toHaveAttribute('data-disabled', 'true');

      await widget.act('setLoading', true);
      await waitFor(() => expect(exposed('isLoading')).toBe(true));
      expect(rows()).toHaveLength(0);
      expect(document.querySelector('[class*="spinner"]')).toBeTruthy();
    });

    test.each([
      ['setVisibility', 'visibility', 'isVisible', false],
      ['setDisable', 'disabledState', 'isDisabled', true],
      ['setLoading', 'loadingState', 'isLoading', true],
    ])(
      '[Listview-CSA-002] %s survives an unrelated change and yields to a changed property',
      async (action, property, variable, actionValue) => {
        // Break this catches: an action that a re-resolution silently undoes, or one the property can never override.
        await mount();
        await widget.act(action, actionValue);
        await waitFor(() => expect(exposed(variable)).toBe(actionValue));

        await setProperty('rowHeight', '90');
        expect(exposed(variable)).toBe(actionValue);
        expect(widgetState(variable)).toBe(actionValue);

        await setProperty(property, `{{${actionValue}}}`);
        await setProperty(property, `{{${!actionValue}}}`);
        await waitFor(() => expect(exposed(variable)).toBe(!actionValue));
        expect(widgetState(variable)).toBe(!actionValue);
      }
    );
  });
});

describe('ListviewDisabledRecords', () => {
  // jsdom enforces neither `pointer-events` nor `inert`, so those are asserted as the attribute that asks for them.

  const ID = 'lv1';
  const NAME = 'listview1';
  const INNER = 'lv2';
  const records = `{{${JSON.stringify(Array.from({ length: 10 }, (_, index) => ({ name: `r${index}` })))}}}`;
  const DISABLE_R1_R7 = `{{listItem.name === 'r1' || listItem.name === 'r7'}}`;

  function child(id, name, type, properties, parent = ID) {
    const definition = componentDefinition(id, name, type, properties);
    definition.component.parent = parent;
    definition.component.definition.styles = {};
    definition.component.definition.others = {
      showOnDesktop: binding('{{true}}'),
      showOnMobile: binding('{{false}}'),
    };
    return definition;
  }

  const baseProperties = {
    dataSourceSelector: binding('rawJson'),
    data: binding(records),
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
  };
  const baseStyles = {
    backgroundColor: binding('var(--cc-surface1-surface)'),
    borderColor: binding('var(--cc-weak-border)'),
  };

  const widget = createWidgetHarness({
    componentType: 'Listview',
    handle: NAME,
    id: ID,
    defaultProperties: baseProperties,
    defaultStyles: baseStyles,
    defaultExtraComponents: {
      txt1: child('txt1', 'text1', 'Text', { text: binding('{{listItem.name}}') }),
      btn1: child('btn1', 'button1', 'Button', { text: binding('Go') }),
    },
    capabilities: { dnd: true },
    widgetHeight: 600,
    widgetWidth: 600,
  });

  const NESTED = `{{[{ name: 'o1', items: [{ name: 'a' }, { name: 'b' }] }, { name: 'o2', items: [{ name: 'c' }, { name: 'b' }] }]}}`;
  const nestedWidget = createWidgetHarness({
    componentType: 'Listview',
    handle: NAME,
    id: ID,
    defaultProperties: {
      ...baseProperties,
      data: binding(NESTED),
      rowHeight: binding('250'),
      enablePagination: binding('{{false}}'),
    },
    defaultStyles: baseStyles,
    defaultExtraComponents: {
      [INNER]: child(INNER, 'listview2', 'Listview', {
        ...baseProperties,
        data: binding('{{listItem.items}}'),
        enablePagination: binding('{{false}}'),
        disableRecords: binding(`{{listItem.name === 'b'}}`),
      }),
      txt2: child('txt2', 'text2', 'Text', { text: binding('{{listItem.name}}') }, INNER),
    },
    capabilities: { dnd: true },
    widgetHeight: 800,
    widgetWidth: 600,
  });

  const rows = () => [...document.querySelectorAll('.list-item')];
  const exposed = (key) => widget.exposed()?.[key];
  const fired = (key) => store().getVariable(key, MODULE_ID) ?? 0;
  const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 450)));
  const disabledRows = () =>
    rows().flatMap((row, index) => (row.getAttribute('aria-disabled') === 'true' ? [index] : []));
  const setDisableRecords = (value) =>
    widget.session.store.act(() => {
      widget.setComponentProperty(ID, 'disableRecords', binding(value).value, 'properties');
    });
  const counting = (eventId, key, sourceId = ID) => ({
    id: `evt-${eventId}-${key}`,
    index: 0,
    sourceId,
    name: `evt-${eventId}-${key}`,
    target: 'component',
    event: { eventId, actionId: 'set-custom-variable', key, value: `{{(variables.${key} ?? 0) + 1}}` },
  });
  const RECORD_EVENTS = [
    counting('onRecordClicked', 'rec'),
    counting('onRowClicked', 'row'),
    counting('onRecordHovered', 'hover'),
  ];

  async function mount(disableRecords = DISABLE_R1_R7, options = {}) {
    widget.render({
      currentMode: 'view',
      properties: disableRecords === null ? {} : { disableRecords: binding(disableRecords) },
      ...options,
    });
    await waitFor(() => expect(rows()).toHaveLength(5));
  }
  const nextPage = () => widget.session.user.click(document.querySelector('[data-cy="pagination-button-to-next"]'));

  describe('Listview: a disabled record fires no record event', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test('[Listview-REC-002] a click on a disabled record, or on a component in it, fires neither Record clicked nor Row clicked', async () => {
      // Break this catches: a click guard missing from the record, so the programmatic click still fires both events.
      await mount(DISABLE_R1_R7, { events: RECORD_EVENTS });

      fireEvent.click(rows()[1]);
      fireEvent.click(rows()[1].querySelector('p, div'));
      await settle();

      expect(fired('rec')).toBe(0);
      expect(fired('row')).toBe(0);
      expect(exposed('selectedRecordIndex')).toBeUndefined();

      fireEvent.click(rows()[2]);
      await waitFor(() => expect(fired('rec')).toBe(1));
      expect(fired('row')).toBe(1);
    });

    test('[Listview-REC-002] Enter and Space on a disabled record fire nothing, and still work on an enabled one', async () => {
      // Break this catches: only the pointer being guarded, so the keyboard still clicks a disabled record.
      await mount(DISABLE_R1_R7, { events: RECORD_EVENTS });

      fireEvent.keyDown(rows()[1], { key: 'Enter' });
      fireEvent.keyDown(rows()[1], { key: ' ' });
      await settle();
      expect(fired('rec')).toBe(0);

      fireEvent.keyDown(rows()[2], { key: 'Enter' });
      await waitFor(() => expect(fired('rec')).toBe(1));
    });

    test('[Listview-REC-002] hovering a disabled record fires no Record hovered, and an enabled one fires once', async () => {
      // Break this catches: the hover guard missing, so a disabled record still runs the hover handler.
      await mount(DISABLE_R1_R7, { events: RECORD_EVENTS });

      fireEvent.mouseOver(rows()[1], { relatedTarget: document.body });
      await settle();
      expect(fired('hover')).toBe(0);

      fireEvent.mouseOver(rows()[2], { relatedTarget: document.body });
      await waitFor(() => expect(fired('hover')).toBe(1));
    });

    test('[Listview-REC-002] on page 2 the disabled record is still guarded', async () => {
      // Break this catches: the guard keyed to the page-relative index, so page 2 loses it.
      await mount(DISABLE_R1_R7, { events: RECORD_EVENTS });
      await nextPage();
      await waitFor(() => expect(rows()[0].textContent).toContain('r5'));

      fireEvent.click(rows()[2]);
      await settle();

      expect(fired('rec')).toBe(0);
    });
  });

  describe('Listview: a disabled record inside an enabled one', () => {
    beforeEach(async () => {
      await nestedWidget.setup();
    });
    afterEach(nestedWidget.teardown);

    test('[Listview-REC-002] a click on a disabled inner record reaches the enabled outer record only', async () => {
      // Break this catches: the inner record firing its own Record clicked, or the outer one losing the click.
      nestedWidget.render({
        currentMode: 'view',
        events: [counting('onRecordClicked', 'outer'), counting('onRecordClicked', 'inner', INNER)],
      });
      await waitFor(() => expect(document.querySelectorAll('.list-item')).toHaveLength(6));
      const disabledInner = [...document.querySelectorAll('.list-item')].find(
        (row) => row.getAttribute('aria-disabled') === 'true'
      );

      fireEvent.click(disabledInner);
      await settle();

      expect(fired('outer')).toBe(1);
      expect(fired('inner')).toBe(0);
    });
  });

  describe('Listview: the children of a disabled record', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    const buttons = () => [...document.querySelectorAll('button')].filter((node) => node.textContent === 'Go');

    test('[Listview-REC-003] a click on a component in a disabled record does not reach the component, and its isDisabled stays false', async () => {
      // Break this catches: the record only fading, so its Button still runs its own On click handler.
      await mount(DISABLE_R1_R7, { events: [counting('onClick', 'btnClicks', 'btn1')] });

      fireEvent.click(buttons()[1]);
      await settle();
      expect(fired('btnClicks')).toBe(0);

      fireEvent.click(buttons()[2]);
      await waitFor(() => expect(fired('btnClicks')).toBe(1));
      await waitFor(() => expect(exposed('children')?.[1]?.button1).toBeDefined());
      expect(exposed('children')[1].button1.isDisabled).toBe(false);
    });
  });

  describe('Listview: how a disabled record looks and is announced', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test('[Listview-REC-005] a disabled record fades to 0.4 once, with no data-disabled that the global 0.6 rule would stack', async () => {
      // Break this catches: no fade, or data-disabled on the record so the global rule overrides the 0.4.
      await mount();

      expect(rows().map((row) => row.style.opacity)).toEqual(['', '0.4', '', '', '']);
      expect(rows()[1].hasAttribute('data-disabled')).toBe(false);
    });

    test('[Listview-REC-006] a disabled record is aria-disabled, out of the tab order, inert and blocks the pointer', async () => {
      // Break this catches: any one of the four being dropped, which leaves the keyboard or a screen reader a way in.
      await mount();

      const row = rows()[1];
      expect(row).toHaveAttribute('aria-disabled', 'true');
      expect(row.hasAttribute('tabindex')).toBe(false);
      await waitFor(() => expect(row.inert).toBe(true));
      expect(row.style.pointerEvents).toBe('none');
    });

    test('[Listview-REC-005] in a list with Disabled state on, a disabled record is not dimmed on top of the list', async () => {
      // Break this catches: 0.6 from the list and 0.4 from the record stacking to 0.24.
      await mount(DISABLE_R1_R7, {
        properties: { disabledState: binding('{{true}}'), disableRecords: binding(DISABLE_R1_R7) },
      });

      expect(rows().map((row) => row.style.opacity)).toEqual(['', '', '', '', '']);
      expect(disabledRows()).toEqual([1]);
    });

    test('[Listview-REC-006] an enabled record keeps tabindex 0 and carries no disabled attribute', async () => {
      // Break this catches: the disabled attributes leaking onto every record.
      await mount();

      const row = rows()[2];
      expect(row).toHaveAttribute('tabindex', '0');
      expect(row.hasAttribute('aria-disabled')).toBe(false);
      expect(row.inert).toBeFalsy();
      expect(row.style.pointerEvents).toBe('');
    });
  });

  describe('Listview: Disable records is resolved per record', () => {
    beforeEach(async () => {
      await widget.setup();
      await nestedWidget.setup();
    });
    afterEach(() => {
      nestedWidget.teardown();
      widget.teardown();
    });

    test('[Listview-REC-007] listItem picks the record on page 1 and again on page 2', async () => {
      // Break this catches: resolving once for the list, or with the page-relative record, so page 2 disables the wrong one.
      await mount();
      expect(disabledRows()).toEqual([1]);

      await nextPage();
      await waitFor(() => expect(rows()[0].textContent).toContain('r5'));

      expect(disabledRows()).toEqual([2]);
    });

    test('[Listview-REC-007] server pagination resolves against the records of the current page', async () => {
      // Break this catches: the server rows being indexed from the whole data, so a later page disables the wrong record.
      widget.render({
        currentMode: 'view',
        properties: {
          disableRecords: binding(`{{listItem.name === 'r3'}}`),
          data: binding(`{{[{ name: 'r3' }, { name: 'r4' }, { name: 'r5' }]}}`),
          serverSidePagination: binding('{{true}}'),
          totalRecords: binding('{{9}}'),
        },
      });
      await waitFor(() => expect(rows()).toHaveLength(3));
      await widget.act('setPage', 2);
      await waitFor(() => expect(exposed('pageIndex')).toBe(2));

      expect(disabledRows()).toEqual([0]);
    });

    test('[Listview-REC-007] a change to the expression re-resolves the records', async () => {
      // Break this catches: the result cached on first render, so editing the expression changes nothing.
      await mount();

      await setDisableRecords(`{{listItem.name === 'r4'}}`);

      await waitFor(() => expect(disabledRows()).toEqual([4]));
    });

    test('[Listview-REC-007] in a nested list the inner expression reads the inner record', async () => {
      // Break this catches: the outer record shadowing the inner one, so the inner list disables the wrong record.
      nestedWidget.render({ currentMode: 'view' });
      await waitFor(() => expect(document.querySelectorAll('.list-item')).toHaveLength(6));

      const flags = [...document.querySelectorAll('.list-item')].map((row) => [
        row.textContent.replace(/\s/g, ''),
        row.getAttribute('aria-disabled') === 'true',
      ]);
      expect(flags.filter(([, disabled]) => disabled).map(([text]) => text)).toEqual(['b', 'b']);
      expect(flags.filter(([text]) => text.startsWith('o1') || text.startsWith('o2')).every(([, d]) => !d)).toBe(true);
    });
  });

  describe('Listview: an expression that cannot say yes disables nothing', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test.each([
      ['throws', `{{listItem.missing.deep}}`],
      ['is a string', `{{listItem.name}}`],
      ['is a number', `{{1}}`],
      ['is empty', ''],
    ])('[Listview-REC-012] an expression that %s leaves every record enabled', async (_label, expression) => {
      // Break this catches: truthiness alone, so a string or an unresolved expression disables the whole list.
      await mount(expression);

      expect(disabledRows()).toEqual([]);
      expect(rows().every((row) => row.style.opacity === '')).toBe(true);
    });
  });

  describe('Listview: the Disable records field in the inspector', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    const editorFor = (initialValue) =>
      render(
        <MemoryRouter>
          <SingleLineCodeEditor
            componentId={ID}
            componentName={NAME}
            paramName="disableRecords"
            initialValue={initialValue}
            onChange={() => {}}
            portalProps={{
              handleTogglePopupExapand: () => {},
              isOpen: false,
              setIsOpen: () => {},
              forceUpdate: () => {},
            }}
            fieldMeta={{ validation: { schema: { type: 'string' }, defaultValue: '' } }}
          />
        </MemoryRouter>
      );

    test('[Listview-REC-011] listItem in the field resolves to the first record in the preview', async () => {
      // Break this catches: the field resolving listItem against nothing, so the preview says it is not defined.
      await mount(`{{false}}`);
      const { container } = editorFor(`{{listItem.name + '-preview'}}`);

      await widget.session.user.click(container.querySelector('.cm-content'));

      await waitFor(() => expect(document.body.textContent).toContain('r0-preview'));
    });

    test('[Listview-REC-011] a real mistake in the field still shows as an error', async () => {
      // Break this catches: the field accepting anything once listItem is in scope.
      await mount(`{{false}}`);
      const { container } = editorFor(`{{listItem.missing.deep}}`);

      await waitFor(() => expect(container.querySelector('.border-danger')).toBeTruthy());
    });
  });

  describe('Listview: what counts as true', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test.each([
      ['plain text true', 'true'],
      ['a spaced capitalised string', `{{' True '}}`],
      ['a field holding the text true', `{{String(listItem.name !== '')}}`],
    ])('[Listview-REC-012] %s disables the record like the boolean schema does', async (_label, expression) => {
      // Break this catches: only a real boolean disabling, so the inspector preview says true and the record stays enabled.
      await mount(expression);

      expect(disabledRows()).toEqual([0, 1, 2, 3, 4]);
    });

    test.each([
      ['the text false', `{{'false'}}`],
      ['yes', `{{'yes'}}`],
      ['an object', `{{{}}}`],
    ])('[Listview-REC-012] %s leaves every record enabled', async (_label, expression) => {
      // Break this catches: any non-empty string disabling the list.
      await mount(expression);

      expect(disabledRows()).toEqual([]);
    });
  });

  describe('Listview: Disable records is resolved only when what it reads changes', () => {
    beforeEach(async () => {
      await widget.setup();
      isRecordDisabled.mockClear();
    });
    afterEach(widget.teardown);

    const TOGGLE = () => componentDefinition('tg1', 'toggle1', 'ToggleSwitchV2', {});

    test.each([[null], [`{{false}}`], [` {{ false }} `]])(
      '[Listview-REC-004] %s never reaches the resolver',
      async (expression) => {
        // Break this catches: the default being resolved for every record on every store change.
        await mount(expression);
        fireEvent.mouseOver(rows()[0], { relatedTarget: document.body });
        await act(() => store().setVariable('x', 1, MODULE_ID));

        expect(isRecordDisabled).not.toHaveBeenCalled();
      }
    );

    test('[Listview-REC-004] isNeverDisabled is true for every spelling of the default and false for anything else', () => {
      // Break this catches: the fast path missing a spelling, or catching an expression that can be true.
      [undefined, null, false, '', '  ', 'false', '{{false}}', '{{ false }}', '{{\nfalse\n}}'].forEach((value) =>
        expect(isNeverDisabled(value)).toBe(true)
      );
      [true, 'true', '{{true}}', '{{listItem.x}}', '{{false || x}}', '0'].forEach((value) =>
        expect(isNeverDisabled(value)).toBe(false)
      );
    });

    test('[Listview-REC-018] hovering, selecting and clicking do not resolve again; a variable the expression reads does', async () => {
      // Break this catches: the store selector re-running the expression for every record on every store change.
      await mount(`{{variables.x === 1}}`);
      expect(disabledRows()).toEqual([]);
      isRecordDisabled.mockClear();

      fireEvent.mouseOver(rows()[1], { relatedTarget: document.body });
      await act(() => store().setSelectedComponents(['somewhere']));
      expect(isRecordDisabled).not.toHaveBeenCalled();

      await act(() => store().setVariable('x', 1, MODULE_ID));
      await waitFor(() => expect(disabledRows()).toEqual([0, 1, 2, 3, 4]));
    });

    test('[Listview-REC-018] a component value the expression reads updates the records', async () => {
      // Break this catches: only variables being tracked, so a toggle or a query never changes the records.
      await mount(`{{components.toggle1.value === true}}`, { extraComponents: { tg1: TOGGLE() } });
      expect(disabledRows()).toEqual([]);

      await act(() => store().setExposedValue('tg1', 'value', true, MODULE_ID));

      await waitFor(() => expect(disabledRows()).toEqual([0, 1, 2, 3, 4]));
    });

    test('[Listview-REC-007] the resolver reads the module it is asked for, and a syntax error does not throw', () => {
      // Break this catches: always reading the canvas, so a ListView in a module sees the wrong variables.
      useStore.setState((state) => {
        state.modules.modX = { componentNameIdMapping: {}, queryNameIdMapping: {} };
        state.resolvedStore.modules.modX = {
          exposedValues: {
            components: {},
            queries: {},
            variables: { flag: true },
            globals: {},
            constants: {},
            page: {},
          },
        };
      });

      expect(isRecordDisabled('{{variables.flag === true}}', {}, 'modX')).toBe(true);
      expect(isRecordDisabled('{{variables.flag === true}}', {}, 'canvas')).toBe(false);
      expect(() => isRecordDisabled('{{listItem.x ===}}', { x: 1 }, 'canvas')).not.toThrow();
      expect(isRecordDisabled('{{listItem.x ===}}', { x: 1 }, 'canvas')).toBe(false);
      expect(isRecordDisabled('{{listItem.missing.deep}}', {}, 'canvas')).toBe(false);
    });
  });

  describe('Listview: a disabled record keeps the selection and its place', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test('[Listview-REC-009] a selected record that becomes disabled keeps selectedRecord, id and index', async () => {
      // Break this catches: an effect that clears the selection when its record is disabled.
      await mount(`{{false}}`);
      fireEvent.click(rows()[2]);
      await waitFor(() => expect(exposed('selectedRecordIndex')).toBe(2));
      const selected = exposed('selectedRecord');

      await setDisableRecords(`{{listItem.name === 'r2'}}`);
      await waitFor(() => expect(disabledRows()).toEqual([2]));

      expect(exposed('selectedRecordIndex')).toBe(2);
      expect(exposed('selectedRecordId')).toBe(2);
      expect(exposed('selectedRecord')).toEqual(selected);
    });

    test('[Listview-REC-010] a disabled record keeps its place: the page, data and selectedRecordIndex do not shift', async () => {
      // Break this catches: a disabled record dropped from the page, so later records move up and renumber.
      await mount();

      expect(rows().map((row) => row.textContent.trim())).toEqual(['r0Go', 'r1Go', 'r2Go', 'r3Go', 'r4Go']);
      expect(Object.keys(exposed('data') ?? {})).toHaveLength(5);
      fireEvent.click(rows()[2]);
      await waitFor(() => expect(exposed('selectedRecordIndex')).toBe(2));

      await nextPage();
      await waitFor(() => expect(rows()[0].textContent).toContain('r5'));
      fireEvent.click(rows()[3]);
      await waitFor(() => expect(exposed('selectedRecordIndex')).toBe(8));
      expect(exposed('selectedRecordId')).toBe(3);
    });
  });

  describe('Listview: a ListView saved before Disable records', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test('[Listview-REC-004] without the key every record is enabled with the same attributes as before', async () => {
      // Break this catches: a default that disables, fades or re-attributes records of a ListView saved before 2.0.
      await mount(null, { events: RECORD_EVENTS });

      expect(disabledRows()).toEqual([]);
      expect(rows().every((row) => row.getAttribute('tabindex') === '0' && row.style.opacity === '')).toBe(true);
      expect(rows().some((row) => row.inert)).toBe(false);
      fireEvent.click(rows()[1]);
      await waitFor(() => expect(fired('rec')).toBe(1));
    });
  });

  describe('Listview: the whole-list disabledState', () => {
    beforeEach(widget.setup);
    afterEach(widget.teardown);

    test('[Listview-REC-004] disabledState still disables the list through data-disabled and inert, and records stay unflagged', async () => {
      // Break this catches: Disable records taking over the list-level disabled mechanism.
      await mount(`{{false}}`, {
        properties: { disabledState: binding('{{true}}'), disableRecords: binding('{{false}}') },
      });

      const list = document.getElementById(ID);
      expect(list).toHaveAttribute('data-disabled', 'true');
      await waitFor(() => expect(list.inert).toBe(true));
      expect(disabledRows()).toEqual([]);
    });
  });
});
