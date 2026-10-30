import { EntityManager } from 'typeorm';
import { TooljetDbBulkUploadService } from '@modules/tooljet-db/services/tooljet-db-bulk-upload.service';
import { TooljetDbTableOperationsService } from '@modules/tooljet-db/services/tooljet-db-table-operations.service';
import { TooljetDbUtilService } from '@modules/tooljet-db/services/tooljet-db-util.service';
import { findTenantSchema } from 'src/helpers/tooljet_db.helper';

const organizationId = '00000000-0000-0000-0000-000000000001';
const tableId = '00000000-0000-0000-0000-000000000002';
const environmentId = '00000000-0000-0000-0000-000000000003';
// The physical table is named after the per-environment relation, not the internal table id.
const relationId = '00000000-0000-0000-0000-000000000004';
const columnNames = ['id', 'name', 'email'];
// Both bulk methods resolve the table for the environment before touching it.
const resolveTableById = () => jest.fn().mockResolvedValue({ relation: { id: relationId } });

/**
 * @group database
 */
describe('TooljetDbBulkUploadService.bulkUpdateRowsWithPrimaryKey', () => {
  let service: TooljetDbBulkUploadService;
  let query: jest.Mock;
  let viewTable: jest.Mock;

  beforeEach(() => {
    query = jest.fn().mockResolvedValue([[{ id: 1, name: 'b' }], 1]);
    viewTable = jest.fn().mockResolvedValue({ columns: columnNames.map((column_name) => ({ column_name })) });
    const manager = { findOne: jest.fn().mockResolvedValue({ id: tableId }) } as unknown as EntityManager;
    const tooljetDbManager = { query } as unknown as EntityManager;
    const tableOperationsService = {
      perform: viewTable,
      resolveTableById: resolveTableById(),
    } as unknown as TooljetDbTableOperationsService;
    service = new TooljetDbBulkUploadService(
      manager,
      tooljetDbManager,
      tableOperationsService,
      {} as TooljetDbUtilService
    );
  });

  it('should reject row keys that are not columns of the table', async () => {
    const result = await service.bulkUpdateRowsWithPrimaryKey(
      [{ id: 1, name: 'b', unknown_column: 'x' }],
      tableId,
      'id',
      organizationId,
      environmentId
    );

    expect(result.status).toBe('failed');
    expect(result.error).toContain('unknown_column');
    expect(viewTable).toHaveBeenCalledWith(organizationId, 'view_table', { id: tableId }, environmentId);
    expect(query).not.toHaveBeenCalled();
  });

  it('should reject a primary key that is not a column of the table', async () => {
    const result = await service.bulkUpdateRowsWithPrimaryKey(
      [{ id: 1, name: 'b' }],
      tableId,
      'uid',
      organizationId,
      environmentId
    );

    expect(result.status).toBe('failed');
    expect(result.error).toContain('uid');
    expect(query).not.toHaveBeenCalled();
  });

  it('should quote column names that contain a double quote', async () => {
    viewTable.mockResolvedValue({ columns: [...columnNames, 'nick"name'].map((column_name) => ({ column_name })) });

    await service.bulkUpdateRowsWithPrimaryKey(
      [{ id: 1, 'nick"name': 'b' }],
      tableId,
      'id',
      organizationId,
      environmentId
    );

    expect(query.mock.calls[0][0]).toContain('SET "nick""name" = $1');
  });

  it('should update rows when all keys are columns of the table', async () => {
    const result = await service.bulkUpdateRowsWithPrimaryKey(
      [{ id: 1, name: 'b' }],
      tableId,
      ['id'],
      organizationId,
      environmentId
    );

    expect(result).toEqual({ status: 'ok', updatedRows: 1, data: [{ id: 1, name: 'b' }] });
    expect(query).toHaveBeenCalledTimes(1);
    const [sql, params] = query.mock.calls[0];
    expect(sql).toContain(`UPDATE "${findTenantSchema(organizationId)}"."${relationId}"`);
    expect(sql).toContain('SET "name" = $1');
    expect(sql).toContain('WHERE "id" = $2');
    expect(params).toEqual(['b', 1]);
  });
});

describe('TooljetDbBulkUploadService.bulkUpsertRowsWithPrimaryKey', () => {
  let service: TooljetDbBulkUploadService;
  let query: jest.Mock;

  beforeEach(() => {
    query = jest.fn().mockResolvedValue([{ id: 1, name: 'b', inserted: true }]);
    const columns = columnNames.map((column_name) => ({
      column_name,
      data_type: 'text',
      column_default: null,
      constraints_type: { is_primary_key: column_name === 'id' },
    }));
    const manager = { findOne: jest.fn().mockResolvedValue({ id: tableId }) } as unknown as EntityManager;
    const tableOperationsService = {
      perform: jest.fn().mockResolvedValue({ columns }),
      getRemainingRowCapacity: jest.fn().mockResolvedValue(1000),
      resolveTableById: resolveTableById(),
    } as unknown as TooljetDbTableOperationsService;
    service = new TooljetDbBulkUploadService(
      manager,
      { query } as unknown as EntityManager,
      tableOperationsService,
      {} as TooljetDbUtilService
    );
  });

  it('should reject row keys that are not columns of the table', async () => {
    const result = await service.bulkUpsertRowsWithPrimaryKey(
      [{ id: 1, name: 'b', unknown_column: 'x' }],
      tableId,
      ['id'],
      organizationId,
      environmentId
    );

    expect(result).toMatchObject({ status: 'failed', error: expect.stringContaining('unknown_column') });
    expect(query).not.toHaveBeenCalled();
  });

  it('should upsert rows when all keys are columns of the table', async () => {
    const result = await service.bulkUpsertRowsWithPrimaryKey(
      [{ id: 1, name: 'b' }],
      tableId,
      ['id'],
      organizationId,
      environmentId
    );

    expect(result).toMatchObject({ status: 'ok', inserted: 1, updated: 0 });
    const [sql, params] = query.mock.calls[0];
    expect(sql).toContain('("id", "name")');
    expect(sql).toContain('ON CONFLICT ("id")');
    expect(sql).toContain('"name" = EXCLUDED."name"');
    expect(params).toEqual([1, 'b']);
  });
});
