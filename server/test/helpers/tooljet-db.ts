import { INestApplication } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { TooljetDatabaseColumn, TooljetDatabaseForeignKey, TooljetDatabaseTable } from 'src/modules/tooljet-db/types';
import { Organization } from '@entities/organization.entity';
import { AppEnvironment } from '@entities/app_environments.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
import { TooljetDbTableOperationsService } from '@ee/tooljet-db/services/tooljet-db-table-operations.service';
import { createUser, ensureAppEnvironments, login, getDefaultDataSource, getTooljetDbDataSource } from 'test-helper';

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

/** Service interface for table operations - matches TooljetDbTableOperationsService.perform() */
interface TableOperationsService {
  perform(
    organizationId: string,
    action: string,
    params: Record<string, any>,
    environmentId: string | undefined,
    connectionManagers?: Record<string, EntityManager>
  ): Promise<any>;
}

export async function setupTestTables(
  appManager: EntityManager,
  tjdbManager: EntityManager,
  tooljetDbService: TableOperationsService,
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
  tooljetDbService: TableOperationsService,
  organizationId: string,
  params: { table_name: string; columns: TooljetDatabaseColumn[]; foreign_keys: TooljetDatabaseForeignKey[] }
) {
  await tooljetDbService.perform(organizationId, 'create_table', params, undefined, { appManager, tjdbManager });
}

export async function ensureWorkspaceSchema(orgId: string): Promise<boolean> {
  const tjds = getTooljetDbDataSource();
  if (!tjds) return false;
  try {
    await tjds.query(`CREATE SCHEMA IF NOT EXISTS "workspace_${orgId}"`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Drops a test-created tenant schema. Optional belt-and-suspenders cleanup for a spec that wants
 * its schema gone before the process exits, not just at the end of the run — the global
 * setup/teardown pair (reset-tooljet-db-schemas.ts) diff-cleans whatever's left regardless.
 */
export async function dropWorkspaceSchema(orgId: string): Promise<void> {
  const tjds = getTooljetDbDataSource();
  if (!tjds) return;
  await tjds.query(`DROP SCHEMA IF EXISTS "workspace_${orgId}" CASCADE`);
}

export async function ensureTenantRole(orgId: string): Promise<boolean> {
  const tjds = getTooljetDbDataSource();
  if (!tjds) return false;
  try {
    const [existing] = await tjds.query(`SELECT 1 FROM pg_roles WHERE rolname = $1`, [`user_${orgId}`]);
    if (!existing) await tjds.query(`CREATE ROLE "user_${orgId}"`);
    return true;
  } catch {
    return false;
  }
}

export interface TjdbWorkspace {
  organizationId: string;
  organization: Organization;
  tenantSchema: string;
  cookie: string[];
  environments: AppEnvironment[];
  productionEnv: AppEnvironment;
  branchId: string;
}

/**
 * Creates a user + workspace and provisions it as a real TJDB tenant (Postgres role + schema),
 * not just the app-level org row. Several TJDB code paths — raw SQL migration recording,
 * sql_execution/join_tables — open their own connection as the tenant role, which needs a real
 * login role and a matching config row that createUser() (unlike the real signup flow) never
 * provisions.
 */
export async function setUpTjdbWorkspace(
  app: INestApplication,
  { prefix, groups = ['admin', 'end-user'] }: { prefix: string; groups?: string[] }
): Promise<TjdbWorkspace> {
  const email = `${prefix}-${uuidv4()}@tooljet.io`;
  const { user, organization } = await createUser(app, { email, firstName: 'Tjdb', lastName: 'Test', groups });
  const organizationId = user.defaultOrganizationId;
  const tenantSchema = `workspace_${organizationId}`;
  const environments = await ensureAppEnvironments(app, organizationId);
  const productionEnv = environments.find((env) => env.name === 'production');

  await app
    .get(TooljetDbTableOperationsService)
    .createTooljetDbTenantSchemaAndRole(organizationId, getDefaultDataSource().manager);

  const branch = await getDefaultDataSource().manager.findOneOrFail(WorkspaceBranch, {
    where: { organizationId, isDefault: true },
  });

  const { tokenCookie } = await login(app, email);
  return {
    organizationId,
    organization,
    tenantSchema,
    cookie: tokenCookie,
    environments,
    productionEnv,
    branchId: branch.id,
  };
}

// createTooljetDbTenantSchemaAndRole provisions a cluster-level Postgres role + schema -
// withRealTransactions only rolls back the suite transaction, it never reclaims those. Every
// test that calls setUpTjdbWorkspace must drop them here, or CI leaks a role+schema per run.
export async function cleanupTjdbWorkspace(app: INestApplication, organizationId: string): Promise<void> {
  try {
    await app.get(TooljetDbTableOperationsService).deleteTooljetDbTenantSchemaAndRole(organizationId);
  } catch {
    // best-effort - a failed setup earlier in the test shouldn't mask the real failure
  }
}
