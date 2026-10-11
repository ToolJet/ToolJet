/**
 * Table's shipped defaults: condensed cell height, 10px radius, content wrap
 * off, search off, filtering off, coloured multiselect tags.
 *
 * Asserts the settings the widget resolved, not the config literals — a spec
 * reading tableConfig back would pass even if the renderer ignored it.
 */
import { waitFor } from '@testing-library/react';
import { tableConfig } from '@/AppBuilder/WidgetManager/widgets/table';
import useTableStore from '@/AppBuilder/Widgets/NewTable/_stores/tableStore';
import { createWidgetHarness } from './widgetHarness';

const TBL = 'tbl1';

const widget = createWidgetHarness({
  componentType: 'Table',
  handle: 'table1',
  id: TBL,
  defaultProperties: tableConfig.definition.properties,
  defaultStyles: tableConfig.definition.styles,
  widgetHeight: 400,
  widgetWidth: 800,
});

// Table is a React.lazy widget, so mounting is not complete when render() resolves.
const renderTable = async (overrides = {}) => {
  const { container } = await widget.render(overrides);
  await waitFor(() => expect(container.querySelector('.jet-table')).toBeInTheDocument(), { timeout: 15000 });
};

const styles = () => useTableStore.getState().getTableStyles(TBL);
const properties = () => useTableStore.getState().getTableProperties(TBL);
const multiselectColumn = () =>
  useTableStore
    .getState()
    .getColumnProperties(TBL)
    .find((column) => column.columnType === 'newMultiSelect');

describe('Table shipped defaults', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('cell height is condensed', async () => {
    await renderTable();
    expect(styles().cellHeight).toBe('condensed');
  });

  test('border radius is 10', async () => {
    await renderTable();
    expect(styles().borderRadius).toBe(10);
  });

  test('content wrap is off', async () => {
    await renderTable();
    expect(styles().contentWrap).toBe(false);
  });

  test('search is off', async () => {
    await renderTable();
    expect(properties().displaySearchBox).toBe(false);
  });

  test('filtering is off', async () => {
    await renderTable();
    expect(properties().showFilterButton).toBe(false);
  });

  test('the multiselect column has coloured tags', async () => {
    await renderTable();
    expect(multiselectColumn().autoAssignColors).toBe(true);
  });

  // Without this, the suite could not tell a default from a forced value.
  test('a saved value wins over every one of those defaults', async () => {
    await renderTable({
      properties: { displaySearchBox: { value: '{{true}}' }, showFilterButton: { value: '{{true}}' } },
      styles: {
        cellSize: { value: 'regular' },
        borderRadius: { value: '6' },
        contentWrap: { value: '{{true}}' },
      },
    });

    expect(styles().cellHeight).toBe('regular');
    expect(styles().borderRadius).toBe(6);
    expect(styles().contentWrap).toBe(true);
    expect(properties().displaySearchBox).toBe(true);
    expect(properties().showFilterButton).toBe(true);
  });
});
