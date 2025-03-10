import { EntityManager } from 'typeorm';
import { TooljetDbTableOperationsService } from '@modules/tooljet-db/services/tooljet-db-table-operations.service';
import { InternalTable } from '@entities/internal_table.entity';
import { TooljetDatabaseColumn, TooljetDatabaseForeignKey, TooljetDatabaseTable } from '@modules/tooljet-db/types';

const mockTableSchemas: Array<TooljetDatabaseTable> = [
  {
    id: 'user_table_uuid',
    table_name: 'users',
    schema: {
      columns: [
        {
          column_name: 'id',
          data_type: 'integer',
          column_default: "nextval('users_id_seq'::regclass)",
          character_maximum_length: null,
          numeric_precision: 32,
          constraints_type: {
            is_not_null: true,
            is_primary_key: true,
            is_unique: true,
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
  },
  {
    id: 'orders_table_uuid',
    table_name: 'orders',
    schema: {
      columns: [
        {
          column_name: 'id',
          data_type: 'integer',
          column_default: "nextval('orders_id_seq'::regclass)",
          character_maximum_length: null,
          numeric_precision: 32,
          constraints_type: {
            is_not_null: true,
            is_primary_key: true,
            is_unique: true,
          },
          keytype: 'PRIMARY KEY',
        },
        {
          column_name: 'user_id',
          data_type: 'integer',
          column_default: null,
          character_maximum_length: null,
          numeric_precision: 32,
          constraints_type: {
            is_not_null: true,
            is_primary_key: false,
            is_unique: false,
          },
          keytype: '',
        },
        {
          column_name: 'total',
          data_type: 'double precision',
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
      ],
      foreign_keys: [
        {
          referenced_table_name: 'users',
          constraint_name: 'fk_orders_user_id',
          column_names: ['user_id'],
          referenced_column_names: ['id'],
          on_update: 'NO ACTION',
          on_delete: 'CASCADE',
          referenced_table_id: 'user_table_id',
        },
      ],
    },
  },
];

export async function setupTestTables(
  appManager: EntityManager,
  tjdbManager: EntityManager,
  tooljetDbService: TooljetDbTableOperationsService,
  organizationId: string,
  tableSchemas: Array<TooljetDatabaseTable> = mockTableSchemas
): Promise<void> {
  const createTableParams = tableSchemas.map((table) => ({ ...table.schema, table_name: table.table_name }));

  for (const params of createTableParams) {
    await createTable(appManager, tjdbManager, tooljetDbService, organizationId, params);
  }

  // Wait for the tables to be created and postgrest to reload the schema
  // when running tests in record mode
  if (process.env.POLLY_MODE === 'record') {
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

async function createTable(
  appManager: EntityManager,
  tjdbManager: EntityManager,
  tooljetDbService: TooljetDbTableOperationsService,
  organizationId: string,
  params: { table_name: string; columns: TooljetDatabaseColumn[]; foreign_keys: TooljetDatabaseForeignKey[] }
) {
  await tooljetDbService.perform(organizationId, 'create_table', params, { appManager, tjdbManager });
}

export async function dropTable(
  appManager: EntityManager,
  tjdbManager: EntityManager,
  tooljetDbService: TooljetDbTableOperationsService,
  organizationId: string,
  tableName: string
) {
  await tooljetDbService.perform(organizationId, 'drop_table', { table_name: tableName }, { appManager, tjdbManager });

  await appManager.delete(InternalTable, { organizationId, tableName });
}
