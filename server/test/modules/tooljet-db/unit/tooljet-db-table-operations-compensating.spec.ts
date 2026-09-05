/**
 * Unit tests for compensating-transaction logic in TooljetDbTableOperationsService.
 * These tests verify that when the app-DB (TypeORM) commit succeeds but the
 * ToolJet-DB (DDL) commit fails, the service applies a compensating action so
 * the two databases do not diverge.
 */
import { TooljetDbTableOperationsService } from '../../../../src/modules/tooljet-db/services/tooljet-db-table-operations.service';
import { EntityManager } from 'typeorm';
import { InternalTable } from '../../../../src/entities/internal_table.entity';

function makeQueryRunner(opts: { commitFails?: boolean } = {}) {
  let started = false;
  return {
    connect: jest.fn().mockResolvedValue(undefined),
    startTransaction: jest.fn().mockImplementation(() => { started = true; }),
    commitTransaction: jest.fn().mockImplementation(() => {
      if (opts.commitFails) throw new Error('simulated DDL commit failure');
    }),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
    manager: {
      create: jest.fn().mockImplementation((_, data) => ({ id: 'new-table-uuid', ...data })),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      findOne: jest.fn().mockResolvedValue(null),
    },
  };
}

function makeService(overrides: Record<string, any> = {}) {
  const mockAppManager = {
    connection: { createQueryRunner: jest.fn() },
    findOne: jest.fn().mockResolvedValue(null),
    delete: jest.fn().mockResolvedValue(undefined),
    save: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue(undefined),
    queryRunner: null,
  };

  const mockTjdbManager = {
    connection: { createQueryRunner: jest.fn() },
    query: jest.fn().mockResolvedValue(undefined),
    queryRunner: null,
  };

  const service: any = Object.create(TooljetDbTableOperationsService.prototype);
  Object.assign(service, {
    manager: mockAppManager,
    tooljetDbManager: mockTjdbManager,
    licenseTermsService: { getLicenseTerms: jest.fn().mockResolvedValue({ table_count: 100 }) },
    prepareColumnListForCreateTable: jest.fn().mockReturnValue([]),
    prepareForeignKeyDetailsJSON: jest.fn().mockReturnValue([]),
    fetchAndCheckIfValidForeignKeyTables: jest.fn().mockResolvedValue({}),
    checkIfForeignKeyReferencedColumnsAreFromCompositePrimaryKey: jest.fn().mockResolvedValue(false),
    ...overrides,
  });

  return { service, mockAppManager, mockTjdbManager };
}

describe('TooljetDbTableOperationsService compensating transactions', () => {
  describe('createTable', () => {
    it('compensates by deleting InternalTable when app DB commits but ToolJet DB commit fails', async () => {
      const appQR = makeQueryRunner({ commitFails: false });
      const tjdbQR = makeQueryRunner({ commitFails: true });

      const { service, mockAppManager, mockTjdbManager } = makeService();
      mockAppManager.connection.createQueryRunner.mockReturnValue(appQR);
      mockTjdbManager.connection.createQueryRunner.mockReturnValue(tjdbQR);
      // Simulate create inside queryRunner.manager.create
      const createdTable = { id: 'table-uuid-123', tableName: 'test_table', organizationId: 'org-1', configurations: {} };
      appQR.manager.create.mockReturnValue(createdTable);
      appQR.manager.save.mockResolvedValue(createdTable);
      // tjdb DDL succeeds but commit fails
      const mockCreateTable = jest.fn().mockResolvedValue(undefined);
      const mockCreatePrimaryKey = jest.fn().mockResolvedValue(undefined);
      tjdbQR['createTable'] = mockCreateTable;
      tjdbQR['createPrimaryKey'] = mockCreatePrimaryKey;

      const params = {
        table_name: 'test_table',
        columns: [{ column_name: 'id', data_type: 'integer', constraints_type: { is_primary_key: true }, configurations: {} }],
        foreign_keys: [],
      };

      await expect(
        service.createTable('org-1', params, { appManager: mockAppManager, tjdbManager: mockTjdbManager })
      ).rejects.toThrow('simulated DDL commit failure');

      // Compensating delete must have been called
      expect(mockAppManager.delete).toHaveBeenCalledWith(InternalTable, { id: createdTable.id });
    });
  });

  describe('dropTable', () => {
    it('compensates by re-saving InternalTable when app DB commits delete but ToolJet DB commit fails', async () => {
      const existingTable = new InternalTable();
      Object.assign(existingTable, { id: 'tbl-1', tableName: 'victim', organizationId: 'org-1', configurations: { columns: { column_names: {}, configurations: {} } } });

      const appQR = makeQueryRunner({ commitFails: false });
      const tjdbQR = makeQueryRunner({ commitFails: true });

      const { service, mockAppManager, mockTjdbManager } = makeService();
      mockAppManager.findOne.mockResolvedValue(existingTable);
      mockAppManager.connection.createQueryRunner.mockReturnValue(appQR);
      mockTjdbManager.connection.createQueryRunner.mockReturnValue(tjdbQR);
      tjdbQR['dropTable'] = jest.fn().mockResolvedValue(undefined);

      // Stub out findQueriesLinkedToTable
      service.findQueriesLinkedToTable = jest.fn().mockResolvedValue(false);
      service.findTenantSchema = jest.fn().mockReturnValue('org_1');

      await expect(
        service.dropTable('org-1', { table_name: 'victim' })
      ).rejects.toThrow();

      // Compensating save must have been called to restore the deleted row
      expect(mockAppManager.save).toHaveBeenCalledWith(InternalTable, existingTable);
    });
  });
});
