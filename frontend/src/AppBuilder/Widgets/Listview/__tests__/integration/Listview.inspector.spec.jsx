import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { listviewConfig, textConfig, tableConfig } from '@tooljet/widget-definitions';
import useStore from '@/AppBuilder/_stores/store';
import { seedApp } from '@/test/app-builder';
import { DefaultComponent } from '@/AppBuilder/RightSideBar/Inspector/Components/DefaultComponent';
import { Inspector } from '@/AppBuilder/RightSideBar/Inspector/Inspector';

const editors = [];
// The fx editor is a stub unless a describe turns it off; the Styles panel describe needs the real one.
const mockEditor = { stub: true };
jest.mock('@/AppBuilder/CodeEditor', () => {
  const mockReact = require('react');
  return {
    __esModule: true,
    default: (props) => {
      if (!mockEditor.stub)
        return mockReact.createElement(jest.requireActual('@/AppBuilder/CodeEditor').default, props);
      editors.push(props);
      return <div data-cy={`stub-editor-${props.paramName}`}>{props.paramLabel}</div>;
    },
  };
});
jest.mock('@/AppBuilder/RightSideBar/Inspector/EventManager', () => ({ EventManager: () => null }));
// The Styles tab hands back spread elements and empty objects for hidden fields; the real accordion skips the empties.
jest.mock('@/_ui/Accordion', () => ({
  __esModule: true,
  default: ({ items }) => (
    <div>
      {items.map((item) => (
        <section key={item.title} data-section={item.title}>
          {[].concat(item.children).filter((child) => child && child.$$typeof)}
        </section>
      ))}
    </div>
  ),
}));
jest.mock('@/AppBuilder/RightSideBar/Inspector/InspectorAccordion', () => ({
  __esModule: true,
  default: ({ items }) => (
    <div>
      {items.map((item) => (
        <section key={item.title} data-section={item.title}>
          {item.children}
        </section>
      ))}
    </div>
  ),
}));

describe('ListviewPropertyPanel', () => {
  /**
   * The Properties tab of a List View, as the Inspector builds it. The code editor and the Event manager
   * are stubs: what is under test is which sections, labels and keys the Inspector hands them.
   */

  const LV_ID = 'lv1';

  function renderPanel(properties = {}) {
    seedApp({});
    editors.length = 0;
    const paramUpdated = jest.fn();
    const definition = {
      ...listviewConfig.definition,
      properties: {
        ...listviewConfig.definition.properties,
        ...Object.fromEntries(Object.entries(properties).map(([key, value]) => [key, { value }])),
      },
    };
    const component = {
      id: LV_ID,
      component: { name: 'listview1', component: 'Listview', definition, properties: listviewConfig.properties },
    };
    const view = render(
      <DefaultComponent
        componentMeta={{ ...listviewConfig, general: { tooltip: { displayName: 'Tooltip' } } }}
        darkMode={false}
        component={component}
        paramUpdated={paramUpdated}
        layoutPropertyChanged={jest.fn()}
        dataQueries={[]}
        currentState={{}}
        eventsChanged={jest.fn()}
        apps={[]}
        components={{}}
        pages={[]}
        selectedComponentId={LV_ID}
      />
    );
    return { ...view, paramUpdated };
  }

  const sectionNames = (container) => [...container.querySelectorAll('[data-section]')].map((s) => s.dataset.section);
  const fieldsIn = (container, title) =>
    [...container.querySelector(`[data-section="${title}"]`).querySelectorAll('[data-cy^="stub-editor-"]')].map(
      (node) => [node.getAttribute('data-cy').replace('stub-editor-', ''), node.textContent]
    );
  const editor = (name) => editors.filter((props) => props.paramName === name).pop();

  describe('List View property panel', () => {
    test('[Listview-INSP-005] sections run Header, Data, Configure list item, Events, Additional Actions, Devices', () => {
      // Break this catches: a section moved or left under the old "Properties" title, or a ListView-only title spelling.
      const { container } = renderPanel();

      expect(sectionNames(container)).toEqual([
        'Header',
        'Data',
        'Configure list item',
        'Events',
        'Additional Actions',
        'Devices',
      ]);
    });

    test('[Listview-INSP-002] the data field reads "Populate data from" and keeps a query binding', () => {
      // Break this catches: the old "Data source" label, or the binding dropped when the field moves.
      const { container } = renderPanel({ dataSourceSelector: '{{queries.q1.data}}' });

      expect(fieldsIn(container, 'Data')[0]).toEqual(['dataSourceSelector', 'Populate data from']);
      expect(editor('dataSourceSelector').initialValue).toBe('{{queries.q1.data}}');
    });

    test('[Listview-INSP-005] Configure list item lists the fields in order under their new labels', () => {
      // Break this catches: an old label, a wrong order, or Type left outside the section.
      const { container } = renderPanel({
        mode: 'grid',
        enablePagination: '{{true}}',
        serverSidePagination: '{{true}}',
      });

      expect(fieldsIn(container, 'Configure list item').filter(([name]) => name !== 'showBorder')).toEqual([
        ['mode', 'Layout'],
        ['gridRecordHeight', 'Record height'],
        ['columns', 'Number of columns'],
        ['disableRecords', 'Disable records'],
        ['enablePagination', 'Enable pagination'],
        ['serverSidePagination', 'Type'],
        ['rowsPerPage', 'Number of records per page'],
        ['totalRecords', 'Total records'],
      ]);
    });

    test('[Listview-REC-011] Disable records is a code field with a false default, between Record height and pagination', () => {
      // Break this catches: a missing field, a non-code control, or one that moves behind the pagination settings.
      const { container } = renderPanel({ mode: 'list' });

      const names = fieldsIn(container, 'Configure list item').map(([name]) => name);
      expect(names.indexOf('disableRecords')).toBe(names.indexOf('rowHeight') + 1);
      expect(names.indexOf('disableRecords')).toBeLessThan(names.indexOf('enablePagination'));
      expect(editor('disableRecords').fieldMeta.type).toBe('code');
      expect(editor('disableRecords').fieldMeta.validation.schema).toEqual({ type: 'boolean' });
      expect(editor('disableRecords').initialValue).toBe('{{false}}');
      expect(listviewConfig.definition.properties.disableRecords).toEqual({ value: '{{false}}' });
    });

    test('[Listview-REC-011] Record visibility is gone from the config and the panel', () => {
      // Break this catches: the dropped record visibility key coming back in the definition or the Properties panel.
      const { container } = renderPanel();

      expect(listviewConfig.properties.recordVisibility).toBeUndefined();
      expect(listviewConfig.definition.properties.recordVisibility).toBeUndefined();
      expect(fieldsIn(container, 'Configure list item').map(([name]) => name)).not.toContain('recordVisibility');
    });

    test('[Listview-INSP-005] Type, records per page and Total records are hidden while pagination is off', () => {
      // Break this catches: pagination settings shown while the pager is off.
      const { container } = renderPanel({ enablePagination: '{{false}}', serverSidePagination: '{{true}}' });

      const names = fieldsIn(container, 'Configure list item').map(([name]) => name);
      expect(names).toContain('enablePagination');
      expect(names).not.toContain('serverSidePagination');
      expect(names).not.toContain('rowsPerPage');
      expect(names).not.toContain('totalRecords');
    });

    test('[Listview-INSP-007] Type is the Table client/server switch on the boolean serverSidePagination', () => {
      // Break this catches: a new select or a string key where Table users find a Client side / Server side switch.
      renderPanel({ enablePagination: '{{true}}', serverSidePagination: '{{true}}' });

      const type = editor('serverSidePagination');
      expect(type.fieldMeta.type).toBe('clientServerSwitch');
      expect(type.fieldMeta.options.map((option) => [option.displayName, option.value])).toEqual([
        ['Client side', 'clientSide'],
        ['Server side', 'serverSide'],
      ]);
      expect(type.fieldMeta.validation.schema).toEqual({ type: 'boolean' });
      expect(type.initialValue).toBe('{{true}}');
      expect(listviewConfig.definition.properties.serverSidePagination).toEqual({ value: '{{false}}' });
      expect(listviewConfig.properties.paginationType).toBeUndefined();
    });

    test('[Listview-INSP-003] Layout is a List/Grid switch and shows List for a saved "List"', () => {
      // Break this catches: the switch reading its saved value case-sensitively, so no option is selected.
      renderPanel({ mode: 'List' });

      const layout = editor('mode');
      expect(layout.fieldMeta.type).toBe('switch');
      expect(layout.fieldMeta.options.map((option) => [option.displayName, option.value])).toEqual([
        ['List', 'list'],
        ['Grid', 'grid'],
      ]);
      expect(layout.initialValue).toBe('list');
    });

    test('[Listview-INSP-008] Layout is the same compact inline switch as the Table Type, label left and switch right, and keeps fx', () => {
      // Break this catches: the stacked layout (newLine) or a switch stretched to the full row (fullWidth).
      renderPanel();

      const layout = editor('mode').fieldMeta;
      expect(layout.newLine).toBeFalsy();
      expect(layout.isFxNotRequired).toBeUndefined();
      expect(layout.fullWidth).toBeFalsy();
      expect(tableConfig.properties.serverSidePagination.fullWidth).toBeFalsy();
      expect(listviewConfig.definition.properties.mode).toEqual({ value: 'list' });
    });

    test('[Listview-INSP-009] Number of columns is a full-width code field like Number of records per page', () => {
      // Break this catches: the native number input, whose inline layout wraps the long label.
      renderPanel({ mode: 'grid', columns: '{{4}}' });

      const columns = editor('columns');
      expect(columns.fieldMeta.type).toBe('code');
      expect(columns.fieldMeta.type).toBe(listviewConfig.properties.rowsPerPage.type);
      expect(columns.paramLabel).toBe('Number of columns');
      expect(columns.initialValue).toBe('{{4}}');
    });

    test('[Listview-INSP-011] the Set page action labels its parameter "Page" like Table', () => {
      // Break this catches: "Page number", a name Table's Set page action does not use.
      const param = (config) => config.actions.find((action) => action.handle === 'setPage').params[0];

      expect(param(listviewConfig)).toMatchObject({ handle: 'page', displayName: 'Page' });
      expect(param(listviewConfig).displayName).toBe(param(tableConfig).displayName);
    });

    test('[Listview-INSP-003] a saved "grid" still shows Grid', () => {
      // Guard, not a bug: the normalising must not turn every layout into List.
      renderPanel({ mode: 'grid' });

      expect(editor('mode').initialValue).toBe('grid');
    });

    test('[Listview-ROW-005] in list layout Record height edits rowHeight', () => {
      // Break this catches: the list field writing the grid key.
      const { paramUpdated } = renderPanel({ mode: 'list', rowHeight: '90' });

      const field = editor('rowHeight');
      expect(field.paramLabel).toBe('Record height');
      expect(editor('gridRecordHeight')).toBeUndefined();
      field.onChange('120');
      expect(paramUpdated).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'rowHeight' }),
        'value',
        '120',
        'properties'
      );
    });

    test('[Listview-ROW-005] in grid layout Record height edits gridRecordHeight and leaves rowHeight', () => {
      // Break this catches: the grid field writing rowHeight.
      const { paramUpdated } = renderPanel({ mode: 'grid', rowHeight: '90', gridRecordHeight: '150' });

      const field = editor('gridRecordHeight');
      expect(field.paramLabel).toBe('Record height');
      expect(field.initialValue).toBe('150');
      expect(editor('rowHeight')).toBeUndefined();
      field.onChange('170');
      expect(paramUpdated).toHaveBeenCalledTimes(1);
      expect(paramUpdated).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'gridRecordHeight' }),
        'value',
        '170',
        'properties'
      );
    });

    test('[Listview-ROW-005] a saved grid without gridRecordHeight shows rowHeight in the field', () => {
      // Break this catches: the field going blank or showing a default when the grid has no height of its own.
      const { paramUpdated } = renderPanel({ mode: 'grid', rowHeight: '90' });

      const field = editor('gridRecordHeight');
      expect(field.initialValue).toBe('90');
      field.onChange('110');
      expect(paramUpdated).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'gridRecordHeight' }),
        'value',
        '110',
        'properties'
      );
    });

    test('[Listview-ROW-005] the saved definition of a grid without gridRecordHeight is not changed by showing it', () => {
      // Break this catches: the display fallback being written back, which would freeze rowHeight into the grid.
      const { paramUpdated } = renderPanel({ mode: 'grid', rowHeight: '90' });

      expect(paramUpdated).not.toHaveBeenCalled();
    });

    test('[Listview-ROW-005] a layout bound by an expression that resolves to grid edits gridRecordHeight', () => {
      // Break this catches: reading the raw expression text, so a bound grid is treated as a list.
      renderPanel({ mode: "{{'grid'}}", rowHeight: '90' });

      expect(useStore.getState().getResolvedValue("{{'grid'}}")).toBe('grid');

      expect(editor('gridRecordHeight').initialValue).toBe('90');
      expect(editor('rowHeight')).toBeUndefined();
    });

    test('[Listview-INSP-005] another widget keeps the title "Additional Actions"', () => {
      // Break this catches: the lower-case title leaking to every widget.
      seedApp({});
      const definition = textConfig.definition;
      const component = {
        id: 't1',
        component: { name: 'text1', component: 'Text', definition, properties: textConfig.properties },
      };
      const { container } = render(
        <DefaultComponent
          componentMeta={{ ...textConfig, general: { tooltip: { displayName: 'Tooltip' } } }}
          darkMode={false}
          component={component}
          paramUpdated={jest.fn()}
          layoutPropertyChanged={jest.fn()}
          dataQueries={[]}
          currentState={{}}
          eventsChanged={jest.fn()}
          apps={[]}
          components={{}}
          pages={[]}
          selectedComponentId="t1"
        />
      );

      expect(sectionNames(container)).toContain('Additional Actions');
      expect(sectionNames(container)).not.toContain('Additional actions');
    });
  });
});

describe('ListviewShowBorderPlacement', () => {
  /**
   * "Show bottom border" only acts on a Legacy List, so the Inspector shows it in the Styles tab, Records group,
   * for that case alone. The saved value stays under `properties.showBorder`: moving the key would need a data migration.
   */

  const LV_ID = 'lv1';

  function inspectorFor({ mode = 'list', listStyle = 'legacy', showBorder } = {}) {
    seedApp({});
    editors.length = 0;
    const definition = {
      ...listviewConfig.definition,
      properties: {
        ...listviewConfig.definition.properties,
        mode: { value: mode },
        ...(showBorder === undefined ? {} : { showBorder: { value: showBorder } }),
      },
      styles: { ...listviewConfig.definition.styles, listStyle: { value: listStyle } },
    };
    const component = {
      id: LV_ID,
      component: { name: 'listview1', component: 'Listview', definition, properties: listviewConfig.properties },
    };
    const meta = { ...listviewConfig, general: { tooltip: { displayName: 'Tooltip' } } };
    const paramUpdated = jest.fn();
    const common = {
      component,
      paramUpdated,
      dataQueries: [],
      currentState: {},
      allComponents: {},
    };
    const properties = render(
      <DefaultComponent
        componentMeta={meta}
        darkMode={false}
        layoutPropertyChanged={jest.fn()}
        eventsChanged={jest.fn()}
        apps={[]}
        components={{}}
        pages={[]}
        selectedComponentId={LV_ID}
        {...common}
      />
    );
    const propertiesFields = [...properties.container.querySelectorAll('[data-cy^="stub-editor-"]')].map((node) =>
      node.getAttribute('data-cy').replace('stub-editor-', '')
    );
    properties.unmount();
    editors.length = 0;
    const styles = render(<Inspector.RenderStyleOptions componentMeta={meta} hasCustomStyling={false} {...common} />);
    const recordsFields = [
      ...(styles.container.querySelector('[data-section="Records"]')?.querySelectorAll('[data-cy^="stub-editor-"]') ??
        []),
    ].map((node) => [node.getAttribute('data-cy').replace('stub-editor-', ''), node.textContent]);
    return { paramUpdated, propertiesFields, recordsFields };
  }

  const editor = (name) => editors.filter((props) => props.paramName === name).pop();

  describe('Show bottom border placement', () => {
    test('[Listview-INSP-006] Legacy list shows it in Styles > Records and edits properties.showBorder', () => {
      // Break this catches: the field missing from Styles, or writing a styles key.
      const { paramUpdated, recordsFields } = inspectorFor({
        mode: 'list',
        listStyle: 'legacy',
        showBorder: '{{true}}',
      });

      expect(recordsFields).toContainEqual(['showBorder', 'Show bottom border']);
      editor('showBorder').onChange('{{false}}');
      expect(paramUpdated).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'showBorder' }),
        'value',
        '{{false}}',
        'properties'
      );
    });

    test('[Listview-INSP-006] it shows the saved value', () => {
      // Break this catches: the field reading a styles default instead of the saved property.
      inspectorFor({ showBorder: '{{false}}' });

      expect(editor('showBorder').initialValue).toBe('{{false}}');
    });

    test('[Listview-INSP-006] a bordered list does not show it', () => {
      // Break this catches: showing a field that does nothing outside Legacy.
      expect(inspectorFor({ listStyle: 'bordered' }).recordsFields.map(([name]) => name)).not.toContain('showBorder');
    });

    test('[Listview-INSP-006] a Legacy grid does not show it', () => {
      // Break this catches: showing a field that does nothing in a grid.
      expect(inspectorFor({ mode: 'grid', listStyle: 'legacy' }).recordsFields.map(([name]) => name)).not.toContain(
        'showBorder'
      );
    });

    test('[Listview-INSP-006] a Legacy list saved with "List" still shows it', () => {
      // Break this catches: a case-sensitive layout check hiding the field from a list the widget treats as List.
      expect(inspectorFor({ mode: 'List' }).recordsFields.map(([name]) => name)).toContain('showBorder');
    });

    test('[Listview-INSP-006] it is not in the Properties tab', () => {
      // Break this catches: the field shown twice.
      expect(inspectorFor({ mode: 'list', listStyle: 'legacy' }).propertiesFields).not.toContain('showBorder');
    });

    test('[Listview-INSP-006] a Legacy layout bound by an expression that resolves to list still shows it', () => {
      // Break this catches: judging the layout from the raw expression text.
      expect(useStore.getState().getResolvedValue("{{'list'}}")).toBe('list');
      expect(inspectorFor({ mode: "{{'list'}}" }).recordsFields.map(([name]) => name)).toContain('showBorder');
    });
  });
});

describe('ListviewStylesPanel', () => {
  /**
   * The Styles tab of a List View with the real fx editor: numeric fields reuse the Number input that Container,
   * Table and Key value pair use, and the Container group labels its background "Background".
   */

  beforeAll(() => {
    mockEditor.stub = false;
  });
  afterAll(() => {
    mockEditor.stub = true;
  });

  const LV_ID = 'lv1';

  function renderStyles(styles = {}) {
    seedApp({});
    const definition = {
      ...listviewConfig.definition,
      styles: { ...listviewConfig.definition.styles, listStyle: { value: 'container' }, ...styles },
    };
    const component = {
      id: LV_ID,
      component: { name: 'listview1', component: 'Listview', definition, properties: listviewConfig.properties },
    };
    const paramUpdated = jest.fn();
    const view = render(
      <Inspector.RenderStyleOptions
        componentMeta={{ ...listviewConfig, general: { tooltip: { displayName: 'Tooltip' } } }}
        hasCustomStyling={false}
        component={component}
        paramUpdated={paramUpdated}
        dataQueries={[]}
        currentState={{}}
        allComponents={{}}
      />
    );
    return { ...view, paramUpdated };
  }

  const numberInputs = (name) => [...document.querySelectorAll(`[data-param="${name}"] input[type="number"]`)];
  const group = (title) => document.querySelector(`[data-section="${title}"]`);

  describe('List View Styles panel', () => {
    test('[Listview-INSP-010] Gap and both Border radius fields are Number inputs, the radius ones with the corners icon', () => {
      // Break this catches: the old native number input, or a radius field without the icon Container and Table show.
      renderStyles();

      expect(numberInputs('gap')).toHaveLength(1);
      expect(numberInputs('recordBorderRadius')).toHaveLength(1);
      expect(numberInputs('borderRadius')).toHaveLength(1);
      expect(group('Records').querySelector('[data-param="recordBorderRadius"] [data-cy$="prefix-icon"]')).toBeTruthy();
      expect(group('Container').querySelector('[data-param="borderRadius"] [data-cy$="prefix-icon"]')).toBeTruthy();
      expect(group('Records').querySelector('[data-param="gap"] .tj-number-input-element')).toBeTruthy();
    });

    test('[Listview-INSP-010] the Container group labels its background "Background"', () => {
      // Break this catches: "Background color", which wraps to two lines in the panel.
      renderStyles();

      const labels = [...group('Container').querySelectorAll('[data-cy$="-widget-parameter-label"]')].map((node) =>
        node.textContent.trim()
      );
      expect(labels).toContain('Background');
      expect(labels).not.toContain('Background color');
    });

    test('[Listview-INSP-010] saved {{12}}, {{6}} and plain numbers still display in the Number inputs', () => {
      // Break this catches: a numeric control that shows the expression text or goes blank for a saved binding.
      renderStyles({ gap: { value: '{{12}}' }, recordBorderRadius: { value: '{{6}}' }, borderRadius: { value: 4 } });

      expect(useStore.getState().getResolvedValue('{{12}}')).toBe(12);
      expect(numberInputs('gap')[0].value).toBe('12');
      expect(numberInputs('recordBorderRadius')[0].value).toBe('6');
      expect(numberInputs('borderRadius')[0].value).toBe('4');
    });

    test('[Listview-INSP-010] a Number input edit is saved as the typed number', () => {
      // Break this catches: an edit saved in a shape the widget cannot read back.
      const { paramUpdated } = renderStyles({ gap: { value: '{{12}}' } });

      fireEvent.change(numberInputs('gap')[0], { target: { value: '20' } });

      expect(paramUpdated).toHaveBeenCalledWith(expect.objectContaining({ name: 'gap' }), 'value', '20', 'styles');
    });
  });
});
