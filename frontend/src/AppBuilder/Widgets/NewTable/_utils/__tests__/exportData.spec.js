import { exportToCSV, exportToExcel } from '../exportData';
import generateFile from '@/_lib/generate-file';
import zipcelx from 'zipcelx';

jest.mock('@/_lib/generate-file', () => jest.fn());
jest.mock('zipcelx', () => jest.fn());

describe('exportData - nested column export', () => {
  const buildTable = (rows, columns) => ({
    getAllColumns: () => columns,
    getCoreRowModel: () => ({ rows: rows.map((original, index) => ({ index, original })) }),
  });

  const columns = [
    { columnDef: { header: 'id', accessorKey: 'id' } },
    { columnDef: { header: 'user.name', accessorKey: 'user.name' } },
  ];
  const rows = [{ id: 1, user: { name: 'Tom' } }];

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('[Table-EXPORT-NESTED-001] includes a nested (dotted accessorKey) column value in CSV export', () => {
    const table = buildTable(rows, columns);

    exportToCSV(table, 'table1');

    const csvString = generateFile.mock.calls[0][1];
    expect(csvString).toContain('Tom');
  });

  it('[Table-EXPORT-NESTED-002] includes a nested (dotted accessorKey) column value in Excel export', () => {
    const table = buildTable(rows, columns);

    exportToExcel(table, 'table1');

    const config = zipcelx.mock.calls[0][0];
    const nestedCell = config.sheet.data[1][1];
    expect(nestedCell.value).toBe('Tom');
  });
});
