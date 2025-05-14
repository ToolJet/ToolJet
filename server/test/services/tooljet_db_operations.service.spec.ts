/** @jest-environment setup-polly-jest/jest-environment-node */

import { INestApplication } from '@nestjs/common';
import { getManager, getConnection, EntityManager } from 'typeorm';
import { TooljetDbOperationsService } from '../../src/services/tooljet_db_operations.service';
import { TooljetDbService } from '../../src/services/tooljet_db.service';
import { setupPolly } from 'setup-polly-jest';
import * as NodeHttpAdapter from '@pollyjs/adapter-node-http';
import * as FSPersister from '@pollyjs/persister-fs';
import * as path from 'path';
import { clearDB, createUser } from '../test.helper';
import { setupTestTables } from '../tooljet-db-test.helper';
import { InternalTable } from '@entities/internal_table.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ormconfig, tooljetDbOrmconfig } from '../../ormconfig';
import { PostgrestProxyService } from '@services/postgrest_proxy.service';
import { getEnvVars } from '../../scripts/database-config-utils';
import { User } from '@entities/user.entity';
import { Organization } from '@entities/organization.entity';
import { OrganizationUser } from '@entities/organization_user.entity';
import { AppVersion } from '@entities/app_version.entity';
import { GroupPermission } from '@entities/group_permission.entity';
import { UserGroupPermission } from '@entities/user_group_permission.entity';
import { App } from '@entities/app.entity';
import { LicenseService } from '@services/license.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

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
  let organizationId: string;
  let usersTableId: string;

  const context = setupPolly({
    adapters: [NodeHttpAdapter],
    persister: FSPersister,
    recordFailedRequests: true,
    matchRequestsBy: {
      method: true,
      headers: {
        exclude: ['tj-workspace-id', 'authorization', 'tableinfo'], // Exclude headers as they contain dynamic information
      },
      body: true,
      url: {
        protocol: true,
        username: true,
        password: true,
        hostname: true,
        port: true,
        pathname: false, // Don't match by pathname as it contains the dynamic table ID
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
    const mockLicenseService = {
      getLicenseTerms: jest.fn(),
    };

    const mockEventEmitter = {
      emit: jest.fn(),
      on: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['../.env.test'],
          load: [() => getEnvVars()],
        }),
        TypeOrmModule.forRoot(ormconfig),
        TypeOrmModule.forRoot(tooljetDbOrmconfig),
        TypeOrmModule.forFeature([
          User,
          Organization,
          OrganizationUser,
          App,
          AppVersion,
          GroupPermission,
          UserGroupPermission,
          InternalTable,
        ]),
      ],
      providers: [TooljetDbOperationsService, TooljetDbService, PostgrestProxyService, LicenseService, EventEmitter2],
    })
      .overrideProvider(LicenseService)
      .useValue(mockLicenseService)
      .overrideProvider(EventEmitter2)
      .useValue(mockEventEmitter)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    appManager = getManager();
    tjDbManager = getConnection('tooljetDb').manager;

    service = moduleFixture.get<TooljetDbOperationsService>(TooljetDbOperationsService);
    tooljetDbService = moduleFixture.get<TooljetDbService>(TooljetDbService);
  });

  beforeEach(async () => {
    await clearDB();

    const adminUserData = await createUser(app, {
      email: 'admin@tooljet.io',
      groups: ['all_users', 'admin'],
    });
    organizationId = adminUserData.organization.id;

    await setupTestTables(appManager, tjDbManager, tooljetDbService, organizationId);
    const usersTable = await appManager.findOneOrFail(InternalTable, { organizationId, tableName: 'users' });
    usersTableId = usersTable.id;
  });

  afterEach(async () => {
    context.polly.stop();
  });

  afterAll(async () => {
    await app.close();
    await clearDB();
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

      const result = await service.createRow(queryOptions);

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
      await service.createRow({
        table_id: usersTableId,
        create_row: {
          name: { column: 'name', value: 'John Doe' },
          email: { column: 'email', value: 'john@example.com' },
        },
        id: 'query-id',
        organization_id: organizationId,
      });

      const queryOptions = {
        table_id: usersTableId,
        list_rows: {
          limit: 10,
          offset: 0,
        },
        id: 'query-id',
        organization_id: organizationId,
      };

      const result = await service.listRows(queryOptions);

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
      await service.createRow({
        table_id: usersTableId,
        create_row: {
          name: { column: 'name', value: 'John Doe' },
          email: { column: 'email', value: 'john@example.com' },
        },
        id: 'query-id',
        organization_id: organizationId,
      });

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

      const result = await service.updateRows(queryOptions);

      expect(result).toBeDefined();
      expect(result.status).toBe('ok');

      // Verify the update
      const listResult = await service.listRows({
        table_id: usersTableId,
        list_rows: { limit: 1 },
        id: 'query-id',
        organization_id: organizationId,
      });

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
      await service.createRow({
        table_id: usersTableId,
        create_row: {
          name: { column: 'name', value: 'John Doe' },
          email: { column: 'email', value: 'john@example.com' },
        },
        id: 'query-id',
        organization_id: organizationId,
      });

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

      const result = await service.deleteRows(queryOptions);

      expect(result).toBeDefined();
      expect(result.status).toBe('ok');
    });
  });

  describe('.joinTables', () => {
    it('should join tables and verify the result', async () => {
      // Check if tables exist
      const usersTable = await appManager.findOne(InternalTable, { organizationId, tableName: 'users' });
      const ordersTable = await appManager.findOne(InternalTable, { organizationId, tableName: 'orders' });

      expect(usersTable).toBeDefined();
      expect(ordersTable).toBeDefined();

      const insertUserResult = await tjDbManager
        .createQueryBuilder()
        .insert()
        .into(usersTable.id)
        .values({
          name: 'John Doe',
          email: 'john@example.com',
        })
        .returning('id')
        .execute();

      const userId = insertUserResult.raw[0].id;

      await tjDbManager
        .createQueryBuilder()
        .insert()
        .into(ordersTable.id)
        .values({
          user_id: userId,
          total: 100.5,
        })
        .execute();

      // Perform join
      const queryOptions = {
        join_table: {
          joins: [
            {
              id: Date.now(), // unique ID
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

      const joinResult = await service.joinTables(queryOptions);

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
