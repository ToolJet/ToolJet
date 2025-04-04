import { EncryptionService } from '@services/encryption.service';
import { tooljetDbOrmconfig } from 'ormconfig';
import { OrganizationTjdbConfigurations } from 'src/entities/organization_tjdb_configurations.entity';
import { EntityManager, DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a custom tooljet database connection using a tenant user, for the respective workspace.
 *
 * NOTE: Make sure to destroy the initialized database connection.
 *
 * @param password - Tenant users password.
 * @param dbUser - Provide the role ID that has been created for the respective workspace with restricted access.
 * @param dbSchema - Each workspace will have its own schema. Provide the name of the schema associated with the respective workspace.
 *
 * @returns - Returns a custom Tooljet database connection once the initialization is complete, along with Entity manager.
 */
export async function createTooljetDatabaseConnection(
  password: string,
  dbUser: string,
  dbSchema: string
): Promise<{ tooljetDbTenantConnection: DataSource; tooljetDbTenantManager: EntityManager }> {
  const tooljetDbTenantConnection = new DataSource({
    ...tooljetDbOrmconfig,
    schema: dbSchema,
    username: dbUser,
    password: password,
    name: `${dbSchema}_${uuidv4()}`,
    extra: {
      ...tooljetDbOrmconfig.extra,
      idleTimeoutMillis: 10000,
      max: 2,
      allowExitOnIdle: true,
    },
  } as any);

  await tooljetDbTenantConnection.initialize();
  const tooljetDbTenantManager = tooljetDbTenantConnection.createEntityManager();
  return { tooljetDbTenantConnection, tooljetDbTenantManager };
}

export async function decryptTooljetDatabasePassword(password: string) {
  const encryptionService = new EncryptionService();
  const decryptedvalue = await encryptionService.decryptColumnValue(
    'organization_tjdb_configurations',
    'pg_password',
    password
  );
  return decryptedvalue;
}

export async function encryptTooljetDatabasePassword(password: string) {
  const encryptionService = new EncryptionService();
  const encryptedValue = await encryptionService.encryptColumnValue(
    'organization_tjdb_configurations',
    'pg_password',
    password
  );
  return encryptedValue;
}

export function findTenantSchema(organisationId: string): string {
  return `workspace_${organisationId}`;
}

export function concatSchemaAndTableName(schema: string, tableName: string) {
  return `${schema}` + '.' + `${tableName}`;
}

/**
 * Creates a new role for a tenant user that only allows them to log in to the database at the start.
 * The ROLE which is to be created will not have access to CREATE database.
 * After creating a new role, permission to connect to the database will be granted.
 *
 * @param tooljetDbTransactionManager - Transaction manager from Entity manager should be used
 * @param dbUser - name of the ROLE to be created for a workspace.
 * @param password - Enrypted password for the ROLE.
 * @param dbName - The database where the ROLE will be granted CONNECT access.
 */
export async function createNewTjdbRole(
  tooljetDbTransactionManager: EntityManager,
  dbUser: string,
  password: string,
  dbName: string
) {
  await tooljetDbTransactionManager.query(`CREATE ROLE "${dbUser}" WITH LOGIN NOCREATEDB PASSWORD '${password}'`);
  await tooljetDbTransactionManager.query(`GRANT CONNECT ON DATABASE "${dbName}" TO "${dbUser}"`);
}

/**
 * Creates a new 'SCHEMA' first, and then grants 'USAGE' privilege on 'SCHEMA' to the tenant role.
 *
 * @param tooljetDbTransactionManager
 * @param dbSchema - SCHEMA name for the new workspace.
 * @param dbUser - new ROLE which got created must be passed here.
 */
export async function createAndGrantSchemaPrivilege(
  tooljetDbTransactionManager: EntityManager,
  dbSchema: string,
  dbUser: string
) {
  await tooljetDbTransactionManager.query(`CREATE SCHEMA "${dbSchema}"`);
  await tooljetDbTransactionManager.query(`GRANT USAGE ON SCHEMA "${dbSchema}" TO "${dbUser}"`);
  await tooljetDbTransactionManager.query(`ALTER USER "${dbUser}" SET SEARCH_PATH TO "${dbSchema}"`);
}

/**
 * A function that grants 'SELECT' and 'USAGE' privileges to Sequences that are already present in the Workspace,
 *  and new Sequences that will be created to the TENANT ROLE.
 *
 * @param tooljetDbTransactionManager
 * @param dbSchema - SCHEMA name of the workspace.
 * @param dbUser - Tenant ROLE
 * @param adminUser - ToolJet database user, which is used to connect to database initially, Not the TENANT user.
 */
export async function grantSequencePrivilege(
  tooljetDbTransactionManager: EntityManager,
  dbSchema: string,
  dbUser: string,
  adminUser: string
) {
  // Access to Existing Sequence:
  await tooljetDbTransactionManager.query(
    `GRANT SELECT, USAGE ON ALL SEQUENCES IN SCHEMA "${dbSchema}" TO "${dbUser}"`
  );
  // Access to Future Sequence
  await tooljetDbTransactionManager.query(
    `ALTER DEFAULT PRIVILEGES FOR ROLE "${adminUser}" IN SCHEMA "${dbSchema}" GRANT USAGE, SELECT ON SEQUENCES TO "${dbUser}"`
  );
}

/**
 * A function that grants 'INSERT', 'SELECT', 'UPDATE', 'DELETE' privileges to 'Tables' that are already present in the Workspace,
 *  and new 'Tables' that will be created in future, to the TENANT ROLE.
 *
 * NOTE: In the statement " ALTER DEFAULT PRIVILEGES FOR ROLE "${adminUser}" " we passed a adminUser because, the user we pass here must be the owner of the SCHEMA.
 *
 * @param tooljetDbTransactionManager
 * @param dbSchema
 * @param dbUser
 * @param adminUser
 */
export async function createAndGrantTablePrivilege(
  tooljetDbTransactionManager: EntityManager,
  dbSchema: string,
  dbUser: string,
  adminUser: string
) {
  // EXISTING TABLES
  await tooljetDbTransactionManager.query(
    `GRANT INSERT, SELECT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "${dbSchema}" TO "${dbUser}"`
  );
  // NEW TABLES
  await tooljetDbTransactionManager.query(
    `ALTER DEFAULT PRIVILEGES FOR ROLE "${adminUser}" IN SCHEMA "${dbSchema}" GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO "${dbUser}"`
  );
}

export async function updatePasswordToOrganizationTable(
  entityManager: EntityManager,
  workspaceId: string,
  tjdbWorkspaceSchemaPassword: string,
  pgUser: string
) {
  await entityManager.insert(OrganizationTjdbConfigurations, {
    organizationId: workspaceId,
    pgUser: pgUser,
    pgPassword: tjdbWorkspaceSchemaPassword,
  });
}

export async function grantTenantRoleToTjdbAdminRole(
  tooljetDbTransactionManager: EntityManager,
  dbUser: string,
  adminUser: string
) {
  await tooljetDbTransactionManager.query(`GRANT "${dbUser}" TO "${adminUser}"`);
}

export async function syncTenantSchemaWithPostgrest(tooljetDbTransactionManager: EntityManager, tooljetDbUser: string) {
  await tooljetDbTransactionManager.query(`CREATE SCHEMA IF NOT EXISTS postgrest`);
  await tooljetDbTransactionManager.query(`GRANT USAGE ON SCHEMA postgrest to ${tooljetDbUser}`);
  await tooljetDbTransactionManager.query(`create or replace function postgrest.pre_config()
        returns void as $$
        select
            set_config('pgrst.db_schemas', string_agg(nspname, ','), true)
        from pg_namespace
        where nspname like 'workspace_%';
        $$ language sql;`);
  await tooljetDbTransactionManager.query("NOTIFY pgrst, 'reload schema'");
}

export async function revokeAccessToPublicSchema(dbName: string) {
  const tooljetDbConnection = new DataSource({
    ...tooljetDbOrmconfig,
    name: 'revokeAccessFromPublicSchemaMigration',
  } as any);

  await tooljetDbConnection.initialize();
  const tooljetDbQueryRunner = await tooljetDbConnection.createQueryRunner();

  await tooljetDbQueryRunner.query(`REVOKE ALL ON DATABASE "${dbName}" FROM PUBLIC;`);
  await tooljetDbQueryRunner.query(`REVOKE ALL ON SCHEMA public FROM PUBLIC;`);
  await tooljetDbQueryRunner.query(`REVOKE ALL ON SCHEMA information_schema FROM PUBLIC;`);
  await tooljetDbQueryRunner.query(`ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;`);

  await tooljetDbConnection.destroy();
}
/**
 * Helper function to modify error object, if error occured in tooljet database.
 * We are using 'PostgrestError' Class to customize tooljet database error, it requires KEY - 'details' from 'driverError'. In few scenarios the KEY is - 'detail' not 'details'.
 * To modify that we are using this helper function
 *
 * @param error - Pass the error object from tooljet database.
 * @returns - Modified error object
 */
export function modifyTjdbErrorObject(error) {
  if (error.detail) error['details'] = error.detail;
  return error;
}

/**
 * Validates the JSONB column value. We only allow valid JSON values to be added in the JSONB column.
 * @param jsonbColumnList - jsonb column list
 * @param inputValues - Values to be created or updated ( Object )
 * @returns - Column names with invalid JSON data.
 */
export function validateTjdbJSONBColumnInputs(jsonbColumnList: Array<string>, inputValues) {
  const body = { ...inputValues };
  const inValidValueColumnsList = [];

  Object.entries(inputValues).forEach(([key, value]) => {
    if (jsonbColumnList.includes(key)) {
      try {
        const parsedValue = typeof value === 'string' ? JSON.parse(value) : value;
        const isJson =
          typeof parsedValue === 'object' &&
          parsedValue !== null &&
          !Array.isArray(parsedValue) &&
          Object.prototype.toString.call(parsedValue) === '[object Object]';

        if (isJson || Array.isArray(parsedValue) || value === null) {
          body[key] = parsedValue;
        } else {
          inValidValueColumnsList.push(key);
        }
      } catch (error) {
        inValidValueColumnsList.push(key);
      }
    }
  });
  return { inValidValueColumnsList, updatedRequestBody: body };
}
