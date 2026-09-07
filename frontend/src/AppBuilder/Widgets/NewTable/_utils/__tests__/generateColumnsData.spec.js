import generateColumnsData from '../generateColumnsData';

jest.mock('@/AppBuilder/_stores/store', () => ({
  __esModule: true,
  default: {
    getState: () => ({
      getResolvedValue: (value) => value,
    }),
  },
}));

describe('generateColumnsData - json column', () => {
  const buildJsonColumnCell = () => {
    const columnProperties = [
      {
        columnType: 'json',
        name: 'Data',
        key: 'data',
        isEditable: true,
        jsonIndentation: true,
      },
    ];

    const columns = generateColumnsData({
      columnProperties,
      columnSizes: {},
      tableData: [{ data: '{"a":1}' }],
      id: 'table1',
      darkMode: false,
      handleCellValueChange: jest.fn(),
      moduleId: 'canvas',
    });

    const jsonColumnDef = columns.find((c) => c.meta.columnType === 'json');
    const cell = {
      getValue: () => '{"a":1}',
      column: { columnDef: { accessorKey: 'data' } },
    };
    const row = { index: 0, original: { data: '{"a":1}' } };

    return { jsonColumnDef, cell, row };
  };

  it('passes the react-table cell object through to JsonColumn', () => {
    const { jsonColumnDef, cell, row } = buildJsonColumnCell();

    const element = jsonColumnDef.renderCell({ cell, row });

    // JsonColumnAdapter's handleChange reads cell.row.index/cell.row.original when committing
    // an edit; if this prop is dropped, that commit throws instead of saving the new value.
    expect(element.props.cell).toBe(cell);
  });
});
