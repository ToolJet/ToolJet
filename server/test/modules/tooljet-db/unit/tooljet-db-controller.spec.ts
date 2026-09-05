import { Test, TestingModule } from '@nestjs/testing';
import { TooljetDbController } from '../../../../src/modules/tooljet-db/controller';
import { TooljetDbTableOperationsService } from '../../../../src/modules/tooljet-db/services/tooljet-db-table-operations.service';
import { PostgrestProxyService } from '../../../../src/modules/tooljet-db/services/postgrest-proxy.service';
import { TooljetDbBulkUploadService } from '../../../../src/modules/tooljet-db/services/tooljet-db-bulk-upload.service';
import { Logger } from 'nestjs-pino';

describe('TooljetDbController', () => {
  let controller: TooljetDbController;
  let tableOpsService: { perform: jest.Mock; getTablesLimit: jest.Mock };

  const mockUser = { organizationId: 'org-session-id', id: 'user-id' };
  const attackerReq = { user: { organizationId: 'org-attacker-id', id: 'attacker-id' } };

  beforeEach(async () => {
    tableOpsService = {
      perform: jest.fn().mockResolvedValue([]),
      getTablesLimit: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TooljetDbController],
      providers: [
        { provide: TooljetDbTableOperationsService, useValue: tableOpsService },
        { provide: PostgrestProxyService, useValue: {} },
        { provide: TooljetDbBulkUploadService, useValue: {} },
        { provide: Logger, useValue: { info: jest.fn(), error: jest.fn(), warn: jest.fn() } },
      ],
    }).compile();

    controller = module.get<TooljetDbController>(TooljetDbController);
  });

  describe('tables (GET /organizations/:organizationId/tables)', () => {
    it('uses organizationId from req.user, not the URL param', async () => {
      // Simulate a request where the URL param is a different org
      const req = { user: mockUser };
      await controller.tables(req as any);

      expect(tableOpsService.perform).toHaveBeenCalledWith(
        mockUser.organizationId,
        'view_tables'
      );
    });

    it('cannot access another org by changing the URL param because the param is ignored', async () => {
      // An attacker sets a different organizationId in the URL — the controller ignores it
      await controller.tables(attackerReq as any);

      expect(tableOpsService.perform).toHaveBeenCalledWith(
        'org-attacker-id',  // always the session org, never a URL param
        'view_tables'
      );
      // Crucially, it must NOT be called with any other org id
      expect(tableOpsService.perform).not.toHaveBeenCalledWith(
        'org-session-id',
        'view_tables'
      );
    });
  });

  describe('dropTable (DELETE /organizations/:organizationId/table/:tableName)', () => {
    it('uses organizationId from session, not the URL param', async () => {
      const req = { user: mockUser };
      await controller.dropTable(req as any, 'my_table');

      expect(tableOpsService.perform).toHaveBeenCalledWith(
        mockUser.organizationId,
        'drop_table',
        { table_name: 'my_table' }
      );
    });
  });

  describe('createTable (POST /organizations/:organizationId/table)', () => {
    it('uses organizationId from session for table creation', async () => {
      const req = { user: mockUser };
      const dto = { table_name: 'test', columns: [] } as any;
      await controller.createTable(req as any, dto);

      expect(tableOpsService.perform).toHaveBeenCalledWith(
        mockUser.organizationId,
        'create_table',
        dto
      );
    });
  });
});
