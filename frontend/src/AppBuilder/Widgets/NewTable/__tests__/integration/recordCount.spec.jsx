/**
 * The "N Records" count in the Table footer and the "Show record count" property that controls it.
 * A Table saved before the property existed has no key, and its count must still follow pagination.
 */
import { screen } from '@testing-library/react';
import { createWidgetHarness, binding } from '../../../__tests__/integration/widgetHarness';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager/componentTypes';

// Seeded by hand so a spec can leave showRecordCount out completely, as in an app saved before it existed
const { showRecordCount: newTableShowRecordCount, ...savedBeforeProperty } =
  componentTypeDefinitionMap.Table.definition.properties;

const widget = createWidgetHarness({
  componentType: 'Table',
  handle: 'table1',
  id: 't1',
  widgetHeight: 460,
  widgetWidth: 750,
  seedFromRegisteredDefinition: false,
  defaultStyles: componentTypeDefinitionMap.Table.definition.styles,
  defaultProperties: {
    ...savedBeforeProperty,
    data: binding('{{[{"id":1,"name":"a"},{"id":2,"name":"b"},{"id":3,"name":"c"}]}}'),
    columns: { value: [{ id: 'c1', name: 'name', key: 'name', columnType: 'string' }] },
  },
});

beforeEach(widget.setup);
afterEach(widget.teardown);

const noFooterButtons = {
  showAddNewRowButton: binding('{{false}}'),
  showDownloadButton: binding('{{false}}'),
  showRefreshButton: binding('{{false}}'),
  hideColumnSelectorButton: binding('{{true}}'),
};

const renderTable = async (properties) => {
  widget.render({ currentMode: 'view', properties });
  await screen.findByRole('columnheader', { name: /name/i });
};

const count = () => screen.queryByText(/\d+ Records/);
const footer = () => document.querySelector('.jet-table-footer');

describe('Table-RECCOUNT existing Table without the property follows pagination', () => {
  test('Table-RECCOUNT-001 pagination on shows the count', async () => {
    await renderTable({ enablePagination: binding('{{true}}') });
    expect(count()).toHaveTextContent('3 Records');
  });

  test('Table-RECCOUNT-002 pagination off keeps the footer but shows no count', async () => {
    await renderTable({ enablePagination: binding('{{false}}') });
    expect(footer()).toBeInTheDocument();
    expect(count()).not.toBeInTheDocument();
  });

  test('Table-RECCOUNT-003 pagination off and no footer buttons keeps the footer hidden', async () => {
    await renderTable({ enablePagination: binding('{{false}}'), ...noFooterButtons });
    expect(footer()).not.toBeInTheDocument();
  });
});

describe('Table-RECCOUNT Show record count set by the builder', () => {
  test('Table-RECCOUNT-004 on with pagination off shows the count of rows', async () => {
    await renderTable({ showRecordCount: binding('{{true}}'), enablePagination: binding('{{false}}') });
    expect(count()).toHaveTextContent('3 Records');
  });

  test('Table-RECCOUNT-005 on with pagination and every footer button off shows a footer with the count', async () => {
    await renderTable({
      showRecordCount: binding('{{true}}'),
      enablePagination: binding('{{false}}'),
      ...noFooterButtons,
    });
    expect(footer()).toBeInTheDocument();
    expect(count()).toHaveTextContent('3 Records');
  });

  test('Table-RECCOUNT-006 off with pagination on hides the count', async () => {
    await renderTable({ showRecordCount: binding('{{false}}'), enablePagination: binding('{{true}}') });
    expect(footer()).toBeInTheDocument();
    expect(count()).not.toBeInTheDocument();
  });

  test('Table-RECCOUNT-007 on with server-side pagination shows Total records', async () => {
    await renderTable({
      showRecordCount: binding('{{true}}'),
      enablePagination: binding('{{true}}'),
      serverSidePagination: binding('{{true}}'),
      totalRecords: binding('{{42}}'),
    });
    expect(count()).toHaveTextContent('42 Records');
  });

  test('Table-RECCOUNT-008 a new Table shows the count', async () => {
    await renderTable({ showRecordCount: newTableShowRecordCount });
    expect(count()).toHaveTextContent('3 Records');
  });
});
