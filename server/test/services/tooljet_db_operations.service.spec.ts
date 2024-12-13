/** @jest-environment setup-polly-jest/jest-environment-node */

import { INestApplication } from '@nestjs/common';
import { DataSource as TypeOrmDataSource, EntityManager } from 'typeorm';
import { TooljetDbOperationsService } from '../../src/services/tooljet_db_operations.service';
import { TooljetDbService } from '../../src/services/tooljet_db.service';
import { setupPolly } from 'setup-polly-jest';
import * as NodeHttpAdapter from '@pollyjs/adapter-node-http';
import * as FSPersister from '@pollyjs/persister-fs';
import * as path from 'path';
import { createNestAppInstanceWithServiceMocks } from '../test.helper';
import { setupTestTables } from '../tooljet-db-test.helper';
import { InternalTable } from '@entities/internal_table.entity';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Organization } from '@entities/organization.entity';
import { createOrganization, createUser, clearDB } from '../common.helper';
import { USER_ROLE } from '@modules/user_resource_permissions/constants/group-permissions.constant';
import { LICENSE_FIELD, LICENSE_LIMIT } from '@ee/licensing/helper';

/**
 * Tests TooljetDbOperationsService
 *
 * @group database
 */
describe('TooljetDbOperationsService', () => {
  let app: INestApplication;
  let appManager: EntityManager;
  let tjDbManager: EntityManager;
  let service: TooljetDbOperationsService;
  let tooljetDbService: TooljetDbService;
  let organization: Organization;
  let organizationId: string;
  let usersTableId: string;
  let licenseServiceMock;

  const context = setupPolly({
    adapters: [NodeHttpAdapter],
    persister: FSPersister,
    recordFailedRequests: true,
    matchRequestsBy: {
      method: true,
      headers: {
        exclude: ['tj-workspace-id', 'authorization', 'tableinfo'], // Exclude dynamic headers
      },
      body: true,
      url: {
        protocol: true,
        username: true,
        password: true,
        hostname: true,
        port: true,
        pathname: false, // Exclude pathname since it may contain dynamic IDs
        query: true,
      },
    },
    persisterOptions: {
      fs: {
        recordingsDir: path.resolve(__dirname, '../__fixtures__'),
      },
    },
  });

  beforeAll(async () => {
    ({ app, licenseServiceMock } = await createNestAppInstanceWithServiceMocks({
      shouldMockLicenseService: true,
    }));
    jest.spyOn(licenseServiceMock, 'getLicenseTerms').mockImplementation((key: LICENSE_FIELD) => {
      switch (key) {
        case LICENSE_FIELD.USER:
          return {
            total: LICENSE_LIMIT.UNLIMITED,
            editors: LICENSE_LIMIT.UNLIMITED,
            viewers: LICENSE_LIMIT.UNLIMITED,
            superadmins: LICENSE_LIMIT.UNLIMITED,
          };
        case LICENSE_FIELD.AUDIT_LOGS:
          return false;
      }
    });

    const defaultDataSource = app.get<TypeOrmDataSource>(getDataSourceToken('default'));
    const tooljetDbDataSource = app.get<TypeOrmDataSource>(getDataSourceToken('tooljetDb'));
    appManager = defaultDataSource.manager;
    tjDbManager = tooljetDbDataSource.manager;

    service = app.get<TooljetDbOperationsService>(TooljetDbOperationsService);
    tooljetDbService = app.get<TooljetDbService>(TooljetDbService);
  });

  beforeEach(async () => {
    await clearDB(app);

    // Create an organization and a user with admin role
    organization = await createOrganization(app, { name: 'Test Org', slug: 'test-org' });
    const adminUserParams = {
      email: 'admin@tooljet.io',
      firstName: 'Admin',
      lastName: 'User',
      password: 'password',
      status: 'active',
    };
    // createUser adds the user to the org with the specified role
    await createUser(app, adminUserParams, organization.id, USER_ROLE.ADMIN);
    organizationId = organization.id;

    // Setup test tables within this organization
    await setupTestTables(appManager, tjDbManager, tooljetDbService, organizationId);

    // Retrieve the users table ID for convenience
    const usersTable = await appManager.findOneOrFail(InternalTable, {
      where: { organizationId, tableName: 'users' },
    });
    usersTableId = usersTable.id;
  });

  afterEach(async () => {
    context.polly.stop();
  });

  afterAll(async () => {
    await clearDB(app);
    await app.close();
  });

  describe('.createRow', () => {
    it('should create a new row and verify its content', async () => {
      const queryOptions = {
        table_id: usersTableId,
        create_row: {
          name: { column: 'name', value: 'John Doe' },
          email: { column: 'email', value: 'john@example.com' },
        },
        id: 'query-id',
        organization_id: organizationId,
      };

      const result = await service.createRow(queryOptions, {
        app: { organization_id: organizationId },
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('ok');
      expect(Array.isArray(result.data)).toBe(true);

      const data = result.data as Array<Record<string, unknown>>;

      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          name: 'John Doe',
          email: 'john@example.com',
        })
      );
    });
  });

  describe('.listRows', () => {
    it('should list rows correctly', async () => {
      // Create a test row
      await service.createRow(
        {
          table_id: usersTableId,
          create_row: {
            name: { column: 'name', value: 'John Doe' },
            email: { column: 'email', value: 'john@example.com' },
          },
          id: 'query-id',
          organization_id: organizationId,
        },
        { app: { organization_id: organizationId } }
      );

      const queryOptions = {
        table_id: usersTableId,
        list_rows: {
          limit: 10,
          offset: 0,
        },
        id: 'query-id',
        organization_id: organizationId,
      };

      const result = await service.listRows(queryOptions, {
        app: { organization_id: organizationId },
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('ok');

      const data = result.data as Array<Record<string, unknown>>;

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1);
      expect(data[0]).toEqual(
        expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com',
        })
      );
    });
  });

  describe('.updateRows', () => {
    it('should update rows and verify the changes', async () => {
      // Create a test row
      await service.createRow(
        {
          table_id: usersTableId,
          create_row: {
            name: { column: 'name', value: 'John Doe' },
            email: { column: 'email', value: 'john@example.com' },
          },
          id: 'query-id',
          organization_id: organizationId,
        },
        { app: { organization_id: organizationId } }
      );

      const queryOptions = {
        table_id: usersTableId,
        update_rows: {
          where_filters: {
            filter1: { column: 'name', operator: 'eq', value: 'John Doe' },
          },
          columns: {
            name: { column: 'name', value: 'Jane Doe' },
          },
        },
        id: 'query-id',
        organization_id: organizationId,
      };

      const result = await service.updateRows(queryOptions, {
        app: { organization_id: organizationId },
      });

      expect(result).toBeDefined();
      expect(result.status).toBe('ok');

      // Verify the update
      const listResult = await service.listRows(
        {
          table_id: usersTableId,
          list_rows: { limit: 1 },
          id: 'query-id',
          organization_id: organizationId,
        },
        { app: { organization_id: organizationId } }
      );

      const data = listResult.data as Array<Record<string, unknown>>;

      expect(Array.isArray(data)).toBe(true);
      expect(data).toEqual([
        {
          id: 1,
          name: 'Jane Doe',
          email: 'john@example.com',
        },
      ]);
    });
  });

  describe('.deleteRows', () => {
    it('should delete rows and verify the deletion', async () => {
      await service.createRow(
        {
          table_id: usersTableId,
          create_row: {
            name: { column: 'name', value: 'John Doe' },
            email: { column: 'email', value: 'john@example.com' },
          },
          id: 'query-id',
          organization_id: organizationId,
        },
        { app: { organization_id: organizationId } }
      );

      const queryOptions = {
        table_id: usersTableId,
        delete_rows: {
          where_filters: {
            filter1: { column: 'name', operator: 'eq', value: 'John Doe' },
          },
        },
        id: 'query-id',
        organization_id: organizationId,
      };

      const result = await service.deleteRows(queryOptions, { app: { organization_id: organizationId } });

      expect(result).toBeDefined();
      expect(result.status).toBe('ok');

      // Verify that the row was actually deleted
      const listResult = await service.listRows(
        {
          table_id: usersTableId,
          list_rows: { limit: 10 },
          id: 'query-id',
          organization_id: organizationId,
        },
        { app: { organization_id: organizationId } }
      );
      const data = listResult.data as Array<Record<string, unknown>>;
      expect(data.length).toBe(0);
    });
  });

  describe('.joinTables', () => {
    it('should join tables and verify the result', async () => {
      const usersTable = await appManager.findOneOrFail(InternalTable, {
        where: { organizationId, tableName: 'users' },
      });
      const ordersTable = await appManager.findOneOrFail(InternalTable, {
        where: { organizationId, tableName: 'orders' },
      });

      // Insert test data directly into tooljetDb using the tjDbManager
      const userInsertResult = await tjDbManager
        .createQueryBuilder()
        .insert()
        .into(`"${organizationId}"."users"`)
        .values({
          name: 'John Doe',
          email: 'john@example.com',
        })
        .returning('*')
        .execute();

      const userId = userInsertResult.raw[0].id;

      await tjDbManager
        .createQueryBuilder()
        .insert()
        .into(`"${organizationId}"."orders"`)
        .values({
          user_id: userId,
          total: 100.5,
        })
        .returning('*')
        .execute();

      // Perform join
      const queryOptions = {
        join_table: {
          joins: [
            {
              id: Date.now(),
              conditions: {
                operator: 'AND',
                conditionsList: [
                  {
                    operator: '=',
                    leftField: {
                      table: usersTable.id,
                      columnName: 'id',
                      type: 'Column',
                    },
                    rightField: {
                      table: ordersTable.id,
                      columnName: 'user_id',
                      type: 'Column',
                    },
                  },
                ],
              },
              joinType: 'INNER',
              table: ordersTable.id,
            },
          ],
          from: {
            name: usersTable.id,
            type: 'Table',
          },
          fields: [
            { name: 'id', table: usersTable.id },
            { name: 'name', table: usersTable.id },
            { name: 'email', table: usersTable.id },
            { name: 'id', table: ordersTable.id },
            { name: 'user_id', table: ordersTable.id },
            { name: 'total', table: ordersTable.id },
          ],
          conditions: {
            conditionsList: [],
          },
          order_by: [],
        },
        organization_id: organizationId,
      };

      const joinResult = await service.joinTables(queryOptions, {
        app: { organization_id: organizationId },
      });

      const expectedResponse = {
        status: 'ok',
        data: {
          result: [
            {
              users_id: expect.any(Number),
              users_name: 'John Doe',
              users_email: 'john@example.com',
              orders_id: expect.any(Number),
              orders_user_id: expect.any(Number),
              orders_total: 100.5,
            },
          ],
        },
      };

      expect(joinResult).toEqual(expectedResponse);
    });
  });
});
