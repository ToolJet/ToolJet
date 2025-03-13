import { BadRequestException, ConflictException, INestApplication, NotFoundException } from '@nestjs/common';
import { getManager, getConnection, EntityManager } from 'typeorm';
import { TooljetDbImportExportService } from '@services/tooljet_db_import_export_service';
import { TooljetDbService } from '@services/tooljet_db.service';
import { clearDB, createUser } from '../test.helper';
import { setupTestTables } from '../tooljet-db-test.helper';
import { InternalTable } from '@entities/internal_table.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ormconfig, tooljetDbOrmconfig } from '../../ormconfig';
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
import { ValidateTooljetDatabaseConstraint } from '@dto/validators/tooljet-database.validator';
import { v4 as uuidv4 } from 'uuid';
import { ImportResourcesDto } from '@dto/import-resources.dto';

describe('TooljetDbImportExportService', () => {
  let app: INestApplication;
  let appManager: EntityManager;
  let tjDbManager: EntityManager;
  let service: TooljetDbImportExportService;
  let tooljetDbService: TooljetDbService;
  let organizationId: string;
  let usersTableId: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let ordersTableId: string;

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
      providers: [TooljetDbImportExportService, TooljetDbService, LicenseService, EventEmitter2],
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

    service = moduleFixture.get<TooljetDbImportExportService>(TooljetDbImportExportService);
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
    const ordersTable = await appManager.findOneOrFail(InternalTable, { organizationId, tableName: 'orders' });
    ordersTableId = ordersTable.id;
  });

  afterAll(async () => {
    await app.close();
    await clearDB();
  });

  describe('.export', () => {
    it('should export ToolJet DB table schema', async () => {
      const exportResult = await service.export(organizationId, { table_id: usersTableId });

      const expectedStructure = {
        id: expect.any(String),
        table_name: 'users',
        schema: {
          columns: [
            {
              column_name: 'id',
              data_type: 'integer',
              column_default: expect.stringContaining('nextval'),
              character_maximum_length: null,
              numeric_precision: 32,
              constraints_type: {
                is_not_null: true,
                is_primary_key: true,
                is_unique: false,
              },
              keytype: 'PRIMARY KEY',
            },
            {
              column_name: 'name',
              data_type: 'character varying',
              column_default: null,
              character_maximum_length: null,
              numeric_precision: null,
              constraints_type: {
                is_not_null: true,
                is_primary_key: false,
                is_unique: false,
              },
              keytype: '',
            },
            {
              column_name: 'email',
              data_type: 'character varying',
              column_default: null,
              character_maximum_length: null,
              numeric_precision: null,
              constraints_type: {
                is_not_null: true,
                is_primary_key: false,
                is_unique: true,
              },
              keytype: '',
            },
          ],
          foreign_keys: [],
        },
      };

      // Check if the exported result matches the expected structure
      expect(exportResult).toEqual(expect.objectContaining(expectedStructure));

      // Validate against the latest schema version
      const validator = new ValidateTooljetDatabaseConstraint();
      const isValid = validator.validate(exportResult, null);
      expect(isValid).toBe(true);
    });

    it('should throw NotFoundException for non-existent table', async () => {
      await expect(service.export(organizationId, { table_id: uuidv4() })).rejects.toThrow(NotFoundException);
    });
  });

  describe('.import', () => {
    it('should import a single ToolJet DB table', async () => {
      const importData = {
        id: uuidv4(),
        table_name: 'imported_users',
        schema: {
          columns: [
            {
              column_name: 'id',
              data_type: 'bigint',
              constraints_type: {
                is_not_null: true,
                is_primary_key: true,
                is_unique: false,
              },
            },
            {
              column_name: 'name',
              data_type: 'character varying',
              constraints_type: {
                is_not_null: true,
                is_primary_key: false,
                is_unique: false,
              },
            },
            {
              column_name: 'email',
              data_type: 'character varying',
              constraints_type: {
                is_not_null: true,
                is_primary_key: false,
                is_unique: true,
              },
            },
          ],
          foreign_keys: [],
        },
      };

      const importResult = await service.import(organizationId, importData);
      const expectedStructure = {
        id: expect.stringMatching(/^[0-9a-f-]{36}$/), // uuid
        table_name: 'imported_users',
      };

      expect(importResult).toEqual(expect.objectContaining(expectedStructure));

      const importedTable = await appManager.findOne(InternalTable, { id: importResult.id });
      expect(importedTable).toBeDefined();
      expect(importedTable.tableName).toBe('imported_users');
    });

    it('should create table with timestamp attached name when same name exists', async () => {
      const importData = {
        id: uuidv4(),
        table_name: 'users', // Same name as existing table
        schema: {
          columns: [
            {
              column_name: 'id',
              data_type: 'bigint',
              constraints_type: {
                is_not_null: true,
                is_primary_key: true,
                is_unique: false,
              },
            },
          ],
          foreign_keys: [],
        },
      };

      const importResult = await service.import(organizationId, importData);
      await expect(importResult.table_name).toContain('users_');
    });

    it('should not import new table cloning when table with same id and columns subset exist', async () => {
      const existingTable = await appManager.findOne(InternalTable, { organizationId, tableName: 'users' });
      const importData = {
        id: existingTable.id,
        table_name: 'users',
        schema: {
          columns: [
            {
              column_name: 'id',
              data_type: 'integer',
              constraints_type: {
                is_not_null: true,
                is_primary_key: true,
                is_unique: false,
              },
            },
            {
              column_name: 'name',
              data_type: 'character varying',
              constraints_type: {
                is_not_null: true,
                is_primary_key: false,
                is_unique: false,
              },
            },
          ],
          foreign_keys: [],
        },
      };

      const countBeforeImport = await appManager.count(InternalTable);
      const result = await service.import(organizationId, importData, true);
      const countAfterImport = await appManager.count(InternalTable);

      expect(countAfterImport).toBe(countBeforeImport);
      expect(result.id).toBe(existingTable.id);
      expect(result.name).toBe(existingTable.tableName);
    });

    it('should throw BadRequestException when primary key is missing', async () => {
      const importData = {
        id: uuidv4(),
        table_name: 'no_primary_key',
        schema: {
          columns: [
            {
              column_name: 'name',
              data_type: 'character varying',
              constraints_type: {
                is_not_null: true,
                is_primary_key: false,
                is_unique: false,
              },
            },
          ],
          foreign_keys: [],
        },
      };

      await expect(service.import(organizationId, importData)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when table with same name exists', async () => {
      const importData = {
        id: uuidv4(),
        table_name: 'users', // Same name as existing table
        schema: {
          columns: [
            {
              column_name: 'id',
              data_type: 'bigint',
              constraints_type: {
                is_not_null: true,
                is_primary_key: true,
                is_unique: false,
              },
            },
          ],
          foreign_keys: [],
        },
      };

      // Mock the createTable method to throw ConflictException
      jest
        .spyOn(tooljetDbService, 'perform')
        .mockRejectedValueOnce(new ConflictException('Table with with name "users" already exists'));

      await expect(service.import(organizationId, importData)).rejects.toThrow(ConflictException);
    });
  });

  describe('.bulkImport', () => {
    it('should import multiple ToolJet DB tables with foreign key relationships', async () => {
      const importData = {
        app: null,
        organization_id: organizationId,
        tooljet_version: '2.50.5.5.8',
        tooljet_database: [
          {
            id: 'products-table-id',
            table_name: 'products',
            schema: {
              columns: [
                {
                  column_name: 'id',
                  data_type: 'bigint',
                  constraints_type: {
                    is_not_null: true,
                    is_primary_key: true,
                    is_unique: false,
                  },
                },
                {
                  column_name: 'name',
                  data_type: 'character varying',
                  constraints_type: {
                    is_not_null: true,
                    is_primary_key: false,
                    is_unique: true,
                  },
                },
              ],
              foreign_keys: [],
            },
          },
          {
            id: 'orders-table-id',
            table_name: 'orders',
            schema: {
              columns: [
                {
                  column_name: 'id',
                  data_type: 'bigint',
                  constraints_type: {
                    is_not_null: true,
                    is_primary_key: true,
                    is_unique: false,
                  },
                },
                {
                  column_name: 'product_id',
                  data_type: 'bigint',
                  constraints_type: {
                    is_not_null: true,
                    is_primary_key: false,
                    is_unique: false,
                  },
                },
              ],
              foreign_keys: [
                {
                  referenced_table_name: 'products',
                  constraint_name: 'fk_orders_product',
                  column_names: ['product_id'],
                  referenced_column_names: ['id'],
                  on_update: 'CASCADE',
                  on_delete: 'RESTRICT',
                  referenced_table_id: 'products-table-id',
                },
              ],
            },
          },
        ],
      };

      const bulkImportResult = await service.bulkImport(importData, '2.50.5.5.8', false);

      expect(bulkImportResult).toBeDefined();
      expect(bulkImportResult.tooljet_database).toHaveLength(2);
      expect(bulkImportResult.tableNameMapping).toBeDefined();

      const productsTable = await appManager.findOne(InternalTable, { tableName: 'products' });
      const ordersTable = await appManager.findOne(InternalTable, { tableName: 'orders' });

      expect(productsTable).toBeDefined();
      expect(ordersTable).toBeDefined();

      // Verify foreign key
      const foreignKeys = await tjDbManager.query(
        'SELECT * FROM information_schema.table_constraints WHERE table_name = $1 AND constraint_type = $2',
        [ordersTable.id, 'FOREIGN KEY']
      );

      expect(foreignKeys).toHaveLength(1);
      expect(foreignKeys[0].constraint_name).toContain('FK_');
    });

    it('should throw ConflictException when foreign key references part of a composite primary key', async () => {
      const importData: ImportResourcesDto = {
        app: [],
        organization_id: organizationId,
        tooljet_version: '2.50.5.5.8',
        tooljet_database: [
          // First, create a table with a composite primary key
          {
            id: uuidv4(),
            table_name: 'composite_key_table',
            schema: {
              columns: [
                {
                  column_name: 'id1',
                  data_type: 'bigint',
                  constraints_type: {
                    is_not_null: true,
                    is_primary_key: true,
                    is_unique: false,
                  },
                },
                {
                  column_name: 'id2',
                  data_type: 'bigint',
                  constraints_type: {
                    is_not_null: true,
                    is_primary_key: true,
                    is_unique: false,
                  },
                },
                {
                  column_name: 'name',
                  data_type: 'character varying',
                  constraints_type: {
                    is_not_null: true,
                    is_primary_key: false,
                    is_unique: false,
                  },
                },
              ],
              foreign_keys: [],
            },
          },
          // Then, create a table with a foreign key referencing part of the composite primary key
          {
            id: uuidv4(),
            table_name: 'referencing_table',
            schema: {
              columns: [
                {
                  column_name: 'id',
                  data_type: 'bigint',
                  constraints_type: {
                    is_not_null: true,
                    is_primary_key: true,
                    is_unique: false,
                  },
                },
                {
                  column_name: 'composite_key_id1',
                  data_type: 'bigint',
                  constraints_type: {
                    is_not_null: true,
                    is_primary_key: false,
                    is_unique: false,
                  },
                },
              ],
              foreign_keys: [
                {
                  column_names: ['composite_key_id1'],
                  referenced_table_name: 'composite_key_table',
                  referenced_column_names: ['id1'],
                  on_update: 'NO ACTION',
                  on_delete: 'NO ACTION',
                },
              ],
            },
          },
        ],
      };

      await expect(service.bulkImport(importData, '2.50.5.5.8', false)).rejects.toThrow(ConflictException);
      await expect(service.bulkImport(importData, '2.50.5.5.8', false)).rejects.toThrow(
        'Foreign key cannot be created as the referenced column is in the composite primary key.'
      );
    });
    it('should rollback changes on error during bulk import', async () => {
      const importData = {
        organization_id: organizationId,
        tooljet_version: '2.50.5.5.8',
        tooljet_database: [
          {
            id: 'valid-table-id',
            table_name: 'valid_table',
            schema: {
              columns: [
                {
                  column_name: 'id',
                  data_type: 'bigint',
                  constraints_type: {
                    is_not_null: true,
                    is_primary_key: true,
                    is_unique: false,
                  },
                },
              ],
              foreign_keys: [],
            },
          },
          {
            id: 'invalid-table-id',
            table_name: 'invalid_table',
            schema: {
              columns: [], // This will cause an error
              foreign_keys: [],
            },
          },
        ],
      } as ImportResourcesDto;

      await expect(service.bulkImport(importData, '2.50.5.5.8', false)).rejects.toThrow();

      // Verify that the valid table was not created due to rollback
      const validTable = await appManager.findOne(InternalTable, { tableName: 'valid_table' });
      expect(validTable).toBeUndefined();
    });
  });
});
