import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { authHeaderForUser, clearDB, createUser, createNestAppInstanceWithEnvMock, getDefaultDataSource } from '../test.helper';
import { QueryFailedError } from 'typeorm';
import { InternalTable } from 'src/entities/internal_table.entity';

/**
 * Tests Tooljet DB controller
 *
 * @group database
 */
// TODO: this spec will need postgrest instance to run (skipping for now).
// Also requires rewrite: getDefaultDataSource().manager removed in TypeORM 0.3+, use DataSource manager instead.
describe.skip('Tooljet DB controller', () => {
  let nestApp: INestApplication;
  let mockConfig;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    ({ app: nestApp, mockConfig } = await createNestAppInstanceWithEnvMock());
  });

  afterEach(async () => {
    jest.resetAllMocks();
    jest.clearAllMocks();

    const manager = getDefaultDataSource().manager;
    const internalTables = await manager.find(InternalTable);
    for (const internalTable of internalTables) {
      // NOTE: This would need the tooljetDb data source, not the default one
      // await tooljetDbDataSource.query(`TRUNCATE "${internalTable.id}" RESTART IDENTITY CASCADE;`);
    }
  });

  describe('GET /api/tooljet_db/organizations/:organizationId/proxy/*', () => {
    it('should allow only authenticated users', async () => {
      const mockId = 'c8657683-b112-4a36-9ce7-79ebf68c8098';
      await request(nestApp.getHttpServer())
        .get(`/api/tooljet_db/organizations/${mockId}/proxy/table_name`)
        .expect(401);
    });

    it('should allow only active users in workspace', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
      });

      const archivedUserData = await createUser(nestApp, {
        email: 'developer@tooljet.io',
        groups: ['all_users'],
        status: 'archived',
        organization: adminUserData.organization,
      });

      await request(nestApp.getHttpServer())
        .get(`/api/tooljet_db/organizations/${archivedUserData.organization.id}/proxy/table_name`)
        .set('tj-workspace-id', archivedUserData.user.defaultOrganizationId)
        .set('Authorization', authHeaderForUser(archivedUserData.user))
        .expect(401);
    });

    it('should throw error when internal table is not found', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
      });

      const response = await request(nestApp.getHttpServer())
        .get(`/api/tooljet_db/organizations/${adminUserData.organization.id}/proxy/\${table_name}`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Authorization', authHeaderForUser(adminUserData.user));

      const { message, statusCode } = response.body;

      expect(message).toBe('Internal table not found: table_name');
      expect(statusCode).toBe(404);
    });

    xit('should replace the table names and proxy requests to postgrest host', async () => {
      jest.spyOn(mockConfig, 'get').mockImplementation((key: string) => {
        if (key === 'PGRST_HOST') {
          return 'http://postgrest-mock';
        } else {
          return process.env[key];
        }
      });

      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
      });

      const actorsTable = getDefaultDataSource().manager.create(InternalTable, {
        tableName: 'actors',
        organizationId: adminUserData.organization.id,
      });
      await actorsTable.save();

      const filmsTable = getDefaultDataSource().manager.create(InternalTable, {
        tableName: 'films',
        organizationId: adminUserData.organization.id,
      });
      await filmsTable.save();

      const postgrestResponse = jest.fn();
      postgrestResponse.mockImplementation(() => {
        return {
          json: () => {
            return {
              root: [],
            };
          },
        };
      });

      // TODO: got mock removed - needs proper setup when test is unskipped

      const response = await request(nestApp.getHttpServer())
        .get(
          `/api/tooljet_db/organizations/${adminUserData.organization.id}/proxy/\${actors}?select=first_name,last_name,\${films}(title)}`
        )
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Authorization', authHeaderForUser(adminUserData.user));

      // expect(postgrestResponse).toBeCalledWith(`http://localhost:3001/${actorsTable.id}?select=first_name,last_name,${filmsTable.id}(title)`, expect.anything());
      const { message, statusCode } = response.body;

      expect(message).toBe('Internal table not found: table_name');
      expect(statusCode).toBe(404);
    });
  });

  describe('GET /api/tooljet_db/organizations/table', () => {
    it('should allow only authenticated users', async () => {
      const mockId = 'c8657683-b112-4a36-9ce7-79ebf68c8098';
      await request(nestApp.getHttpServer())
        .get(`/api/tooljet_db/organizations/${mockId}/tables`)
        .send({ action: 'view_tables' })
        .expect(401);
    });

    it('should allow only active users in workspace', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
      });

      const archivedUserData = await createUser(nestApp, {
        email: 'developer@tooljet.io',
        groups: ['all_users'],
        status: 'archived',
        organization: adminUserData.organization,
      });

      await request(nestApp.getHttpServer())
        .post(`/api/tooljet_db/organizations/${archivedUserData.organization.id}/table`)
        .set('tj-workspace-id', archivedUserData.user.defaultOrganizationId)
        .set('Authorization', authHeaderForUser(archivedUserData.user))
        .expect(401);
    });

    it('should be able to create table', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
      });

      const { statusCode } = await request(nestApp.getHttpServer())
        .post(`/api/tooljet_db/organizations/${adminUserData.organization.id}/table`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Authorization', authHeaderForUser(adminUserData.user))
        .send({
          action: 'create_table',
          table_name: 'test_table',
          columns: [{ column_name: 'id', data_type: 'serial', constraint: 'PRIMARY KEY' }],
        });

      expect(statusCode).toBe(201);

      const internalTables = await getDefaultDataSource().manager.find(InternalTable);

      expect(internalTables).toHaveLength(1);
      const [createdInternalTable] = internalTables;
      expect(createdInternalTable.tableName).toEqual('test_table');

      await expect(
        getDefaultDataSource().manager /* TODO: should use tooljetDb DataSource */.query(`SELECT * from "${createdInternalTable.id}"`)
      ).resolves.not.toThrowError(QueryFailedError);
    });

    it('should be able to view tables', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
      });

      await request(nestApp.getHttpServer())
        .post(`/api/tooljet_db/organizations/${adminUserData.organization.id}/table`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Authorization', authHeaderForUser(adminUserData.user))
        .send({
          action: 'create_table',
          table_name: 'actors',
          columns: [{ column_name: 'id', data_type: 'serial', constraint: 'PRIMARY KEY' }],
        });

      await request(nestApp.getHttpServer())
        .post(`/api/tooljet_db/organizations/${adminUserData.organization.id}/table`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Authorization', authHeaderForUser(adminUserData.user))
        .send({
          action: 'create_table',
          table_name: 'films',
          columns: [{ column_name: 'id', data_type: 'serial', constraint: 'PRIMARY KEY' }],
        });

      const { statusCode, body } = await request(nestApp.getHttpServer())
        .get(`/api/tooljet_db/organizations/${adminUserData.organization.id}/tables`)
        .set('Authorization', authHeaderForUser(adminUserData.user))
        .send({ action: 'view_tables' });

      const tableNames = body.result.map((table) => table.table_name);

      expect(statusCode).toBe(200);
      expect(new Set(tableNames)).toEqual(new Set(['actors', 'films']));
    });

    it('should be able to add column to table', async () => {
      const adminUserData = await createUser(nestApp, {
        email: 'admin@tooljet.io',
      });

      await request(nestApp.getHttpServer())
        .post(`/api/tooljet_db/organizations/${adminUserData.organization.id}/table`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Authorization', authHeaderForUser(adminUserData.user))
        .send({
          action: 'create_table',
          table_name: 'test_table',
          columns: [{ column_name: 'id', data_type: 'serial', constraint: 'PRIMARY KEY' }],
        });

      const internalTable = await getDefaultDataSource().manager.findOne(InternalTable, { where: { tableName: 'test_table' } });

      expect(internalTable.tableName).toEqual('test_table');

      await expect(getDefaultDataSource().manager /* TODO: should use tooljetDb DataSource */.query(`SELECT name from "${internalTable.id}"`)).rejects.toThrowError(
        QueryFailedError
      );

      const { statusCode } = await request(nestApp.getHttpServer())
        .post(`/api/tooljet_db/organizations/${adminUserData.organization.id}/table/test_table/column`)
        .set('tj-workspace-id', adminUserData.user.defaultOrganizationId)
        .set('Authorization', authHeaderForUser(adminUserData.user))
        .send({
          action: 'add_column',
          table_name: 'test_table',
          column: { column_name: 'name', data_type: 'varchar' },
        });

      expect(statusCode).toBe(201);

      await expect(getDefaultDataSource().manager /* TODO: should use tooljetDb DataSource */.query(`SELECT name from "${internalTable.id}"`)).resolves.not.toThrowError(
        QueryFailedError
      );
    });
  });

  afterAll(async () => {
    await nestApp.close();
  });
});
