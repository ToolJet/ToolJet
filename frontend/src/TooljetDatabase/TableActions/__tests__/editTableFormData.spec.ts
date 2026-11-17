import { buildEditTableFormData, type TableColumn } from '../editTableFormData';

const COLUMNS: TableColumn[] = [
  {
    Header: 'id',
    dataType: 'serial',
    constraints_type: { is_primary_key: true },
    column_default: "nextval('orders_id_seq'::regclass)",
  },
  { Header: 'email', dataType: 'character varying', constraints_type: {}, column_default: null },
  { Header: 'mystery', dataType: 'not-a-real-type' },
];

describe('buildEditTableFormData', () => {
  it('lists the columns by position with name and data type', () => {
    const { selectedColumns } = buildEditTableFormData(COLUMNS);
    expect(selectedColumns).toEqual({
      0: { column_name: 'id', data_type: 'serial' },
      1: { column_name: 'email', data_type: 'character varying' },
      2: { column_name: 'mystery', data_type: 'not-a-real-type' },
    });
  });

  it('adds the matching data type details, constraints and default to each column', () => {
    const { selectedTableData } = buildEditTableFormData(COLUMNS);
    expect(selectedTableData[0]).toMatchObject({
      column_name: 'id',
      data_type: 'serial',
      constraints_type: { is_primary_key: true },
      column_default: "nextval('orders_id_seq'::regclass)",
    });
    expect(selectedTableData[0].dataTypeDetails).toHaveLength(1);
    expect((selectedTableData[0].dataTypeDetails as Array<{ value: string }>)[0].value).toBe('serial');
  });

  it('uses null details for a data type the editor does not know', () => {
    const { selectedTableData } = buildEditTableFormData(COLUMNS);
    expect(selectedTableData[2].dataTypeDetails).toBeNull();
  });

  it('returns empty maps for no columns', () => {
    expect(buildEditTableFormData([])).toEqual({ selectedColumns: {}, selectedTableData: {} });
  });
});
