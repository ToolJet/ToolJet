/**
 * The Properties tab of a List View, as the Inspector builds it. The code editor and the Event manager
 * are stubs: what is under test is which sections, labels and keys the Inspector hands them.
 */
const editors = [];
jest.mock('@/AppBuilder/CodeEditor', () => ({
  __esModule: true,
  default: (props) => {
    editors.push(props);
    return <div data-cy={`stub-editor-${props.paramName}`}>{props.paramLabel}</div>;
  },
}));
jest.mock('@/AppBuilder/RightSideBar/Inspector/EventManager', () => ({ EventManager: () => null }));
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

import React from 'react';
import { render } from '@testing-library/react';
import { listviewConfig } from '@tooljet/widget-definitions';
import useStore from '@/AppBuilder/_stores/store';
import { seedApp } from '@/test/app-builder';
import { DefaultComponent } from '@/AppBuilder/RightSideBar/Inspector/Components/DefaultComponent';

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
    // Break this catches: a section moved or left under the old "Properties" title.
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
      paginationType: 'serverSide',
    });

    expect(fieldsIn(container, 'Configure list item').filter(([name]) => name !== 'showBorder')).toEqual([
      ['mode', 'Layout'],
      ['gridRecordHeight', 'Record height'],
      ['columns', 'Number of columns'],
      ['enablePagination', 'Enable pagination'],
      ['paginationType', 'Type'],
      ['rowsPerPage', 'Number of records per page'],
      ['totalRecords', 'Total records'],
    ]);
  });

  test('[Listview-INSP-005] Type, records per page and Total records are hidden while pagination is off', () => {
    // Break this catches: pagination settings shown while the pager is off.
    const { container } = renderPanel({ enablePagination: '{{false}}', paginationType: 'serverSide' });

    const names = fieldsIn(container, 'Configure list item').map(([name]) => name);
    expect(names).toContain('enablePagination');
    expect(names).not.toContain('paginationType');
    expect(names).not.toContain('rowsPerPage');
    expect(names).not.toContain('totalRecords');
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
});
