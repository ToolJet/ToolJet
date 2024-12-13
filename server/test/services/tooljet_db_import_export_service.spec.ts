import { BadRequestException, ConflictException, INestApplication, NotFoundException } from '@nestjs/common';
import { EntityManager, DataSource } from 'typeorm';
import { TooljetDbImportExportService } from '@services/tooljet_db_import_export_service';
import { TooljetDbService } from '@services/tooljet_db.service';
import { setupTestTables } from '../tooljet-db-test.helper';
import { InternalTable } from '@entities/internal_table.entity';
import { getDataSourceToken } from '@nestjs/typeorm';
import { ValidateTooljetDatabaseConstraint } from '@dto/validators/tooljet-database.validator';
import { v4 as uuidv4 } from 'uuid';
import { ImportResourcesDto } from '@dto/import-resources.dto';
import { createNestAppInstanceWithServiceMocks } from '../test.helper';
import { createOrganization, createUser, clearDB } from '../common.helper';
import { LICENSE_FIELD, LICENSE_LIMIT } from '@ee/licensing/helper';
import { USER_ROLE } from '@modules/user_resource_permissions/constants/group-permissions.constant';
import { Organization } from '@entities/organization.entity';

describe('TooljetDbImportExportService', () => {
  let app: INestApplication;
  let appManager: EntityManager;
  let tjDbManager: EntityManager;
  let service: TooljetDbImportExportService;
  let tooljetDbService: TooljetDbService;
  let organization: Organization;
  let organizationId: string;
  let usersTableId: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let ordersTableId: string;
  let licenseServiceMock;

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

    const defaultDataSource = app.get<DataSource>(getDataSourceToken('default'));
    const tooljetDbDataSource = app.get<DataSource>(getDataSourceToken('tooljetDb'));

    appManager = defaultDataSource.manager;
    tjDbManager = tooljetDbDataSource.manager;

    service = app.get<TooljetDbImportExportService>(TooljetDbImportExportService);
    tooljetDbService = app.get<TooljetDbService>(TooljetDbService);
  });

  beforeEach(async () => {
    await clearDB(app);

    organization = await createOrganization(app, { name: 'Test Organization', slug: 'test-org' });
    const adminUserParams = {
      email: 'admin@tooljet.io',
      firstName: 'Admin',
      lastName: 'User',
      password: 'password',
      status: 'active',
    };
    await createUser(app, adminUserParams, organization.id, USER_ROLE.ADMIN);
    organizationId = organization.id;

    await setupTestTables(appManager, tjDbManager, tooljetDbService, organizationId);
    const usersTable = await appManager.findOneOrFail(InternalTable, {
      where: { organizationId, tableName: 'users' },
    });
    usersTableId = usersTable.id;
    const ordersTable = await appManager.findOneOrFail(InternalTable, {
      where: { organizationId, tableName: 'orders' },
    });
    ordersTableId = ordersTable.id;
  });

  afterAll(async () => {
    await app.close();
    await clearDB(app);
  });

  describe('.export', () => {
    it('should export ToolJet DB table schema', async () => {
      const exportResult = await service.export(organizationId, { table_id: usersTableId }, []);

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
              configurations: {},
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
              configurations: {},
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
              configurations: {},
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

      expect(exportResult).toEqual(expect.objectContaining(expectedStructure));

      const validator = new ValidateTooljetDatabaseConstraint();
      const isValid = validator.validate(exportResult, null);
      expect(isValid).toBe(true);
    });

    it('should throw NotFoundException for non-existent table', async () => {
      await expect(
        service.export(
          organizationId,
          {
            table_id: uuidv4(),
          },
          []
        )
      ).rejects.toThrow(NotFoundException);
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
        id: expect.stringMatching(/^[0-9a-f-]{36}$/),
        table_name: 'imported_users',
      };

      expect(importResult).toEqual(expect.objectContaining(expectedStructure));

      const importedTable = await appManager.findOne(InternalTable, {
        where: { id: importResult.id },
      });
      expect(importedTable).toBeDefined();
      expect(importedTable.tableName).toBe('imported_users');
    });

    it('should create table with timestamp attached name when same name exists', async () => {
      const importData = {
        id: uuidv4(),
        table_name: 'users', // Same as existing table
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
      expect(importResult.table_name).toMatch(/^users_/);
    });

    it('should not import new table cloning when table with same id and columns subset exist', async () => {
      const existingTable = await appManager.findOne(InternalTable, { where: { organizationId, tableName: 'users' } });
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
      expect(result.table_name).toBe(existingTable.tableName);
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

    it('should append a timestamp to the table name if the same name already exists', async () => {
      const importData = {
        id: uuidv4(),
        table_name: 'users', // same name as an existing table
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

      const result = await service.import(organizationId, importData);
      expect(result.table_name).toMatch(/^users_\d{13,}$/);
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

      const productsTable = await appManager.findOne(InternalTable, {
        where: { tableName: 'products' },
      });
      const ordersTable = await appManager.findOne(InternalTable, {
        where: { tableName: 'orders' },
      });

      expect(productsTable).toBeDefined();
      expect(ordersTable).toBeDefined();

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

      const validTable = await appManager.findOne(InternalTable, { where: { tableName: 'valid_table' } });
      expect(validTable).toBeNull();
    });
  });
});
