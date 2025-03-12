import { tooljetDbOrmconfig } from 'ormconfig';
import { EntityManager, MigrationInterface, QueryRunner, DataSource } from 'typeorm';
import { Organization } from '@entities/organization.entity';
import { InternalTable } from '@entities/internal_table.entity';
import { MigrationProgress, processDataInBatches } from '@helpers/migration.helper';
import { getEnvVars } from 'scripts/database-config-utils';
import { EncryptionService } from '@modules/encryption/service';
import {
  createNewTjdbRole,
  createAndGrantSchemaPrivilege,
  grantSequencePrivilege,
  createAndGrantTablePrivilege,
  updatePasswordToOrganizationTable,
  syncTenantSchemaWithPostgrest,
  revokeAccessToPublicSchema,
  grantTenantRoleToTjdbAdminRole,
} from '@helpers/tooljet_db.helper';
const crypto = require('crypto');

export class MoveToolJetDatabaseTablesFromPublicToTenantSchema1721236971725 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const envData = getEnvVars();
    const batchSize = 100;
    const entityManager = queryRunner.manager;
    const tooljetDbConnection = new DataSource({
      ...tooljetDbOrmconfig,
      name: 'tooljetDbMigration',
      extra: {
        ...tooljetDbOrmconfig.extra,
        idleTimeoutMillis: 10000,
        allowExitOnIdle: true,
      },
    } as any);

    await tooljetDbConnection.initialize();
    const tooljetDbManager = tooljetDbConnection.createEntityManager();
    const totalWorkspaceCount = await entityManager.count(Organization);
    if (!totalWorkspaceCount) return;

    const migrationProgress = new MigrationProgress(
      'MoveToolJetDatabaseTablesFromPublicToTenantSchema1721236971725',
      totalWorkspaceCount
    );
    const tooljetDbUser = envData.TOOLJET_DB_USER;

    try {
      const dbName = envData.TOOLJET_DB;
      await revokeAccessToPublicSchema(dbName);

      await tooljetDbManager.transaction(async (tooljetDbTransactionManager) => {
        await processDataInBatches(
          entityManager,
          this.findWorkspaceDetails,
          async (entityManager: EntityManager, workspaceDetailList: Organization[]) => {
            await this.moveTjdbTablesToTenantSchema(
              tooljetDbTransactionManager,
              workspaceDetailList,
              migrationProgress,
              entityManager
            );
          },
          batchSize
        );

        await syncTenantSchemaWithPostgrest(tooljetDbTransactionManager, tooljetDbUser);
      });
      await tooljetDbManager.query("NOTIFY pgrst, 'reload schema'");
    } catch (error) {
      console.error(
        'Error during processing batches in MoveToolJetDatabaseTablesFromPublicToTenantSchema migration:',
        error
      );
      throw error;
    } finally {
      await tooljetDbConnection.destroy();
    }
  }

  private async findWorkspaceDetails(entityManager: EntityManager, skip: number, take: number) {
    return await entityManager.find(Organization, {
      take,
      skip,
    });
  }

  private async moveTjdbTablesToTenantSchema(
    tooljetDbTransactionManager: EntityManager,
    workspaceDetailList: Organization[],
    migrationProgress: MigrationProgress,
    entityManager: EntityManager
  ) {
    const envData = getEnvVars();
    const encryptionService = new EncryptionService();
    for (const workspaceDetail of workspaceDetailList) {
      const workspaceId = workspaceDetail.id;
      const dbUser = `user_${workspaceId}`;
      const dbPassword = crypto.randomBytes(8).toString('hex');
      const dbSchema = `workspace_${workspaceId}`;
      const dbName = envData.TOOLJET_DB;
      const tooljetDbAdminUser = envData.TOOLJET_DB_USER;

      await createNewTjdbRole(tooljetDbTransactionManager, dbUser, dbPassword, dbName);
      await createAndGrantSchemaPrivilege(tooljetDbTransactionManager, dbSchema, dbUser);
      const encryptedValue = await encryptionService.encryptColumnValue(
        'organization_tjdb_configurations',
        'pg_password',
        dbPassword
      );
      await updatePasswordToOrganizationTable(entityManager, workspaceId, encryptedValue, dbUser);

      const workspaceTableList = await entityManager.find(InternalTable, {
        where: { organizationId: workspaceId },
        select: ['id'],
      });

      if (workspaceTableList.length) {
        for (const workspaceTable of workspaceTableList) {
          const { id } = workspaceTable;
          tooljetDbTransactionManager.query(`ALTER TABLE "public"."${id}" SET SCHEMA "${dbSchema}"`);
        }
      }

      await grantSequencePrivilege(tooljetDbTransactionManager, dbSchema, dbUser, tooljetDbAdminUser);
      await createAndGrantTablePrivilege(tooljetDbTransactionManager, dbSchema, dbUser, tooljetDbAdminUser);
      await grantTenantRoleToTjdbAdminRole(tooljetDbTransactionManager, dbUser, tooljetDbAdminUser);

      migrationProgress.show();
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const envData = getEnvVars();
    const batchSize = 100;
    const entityManager = queryRunner.manager;
    const tooljetDbConnection = new DataSource({
      ...tooljetDbOrmconfig,
      name: 'provideAccessToPublicSchema',
      extra: {
        ...tooljetDbOrmconfig.extra,
        idleTimeoutMillis: 10000,
        allowExitOnIdle: true,
      },
    } as any);

    await tooljetDbConnection.initialize();
    const tooljetDbManager = await tooljetDbConnection.createEntityManager();
    const totalWorkspaceCount = await entityManager.count(Organization);
    if (!totalWorkspaceCount) return;

    const migrationProgress = new MigrationProgress(
      'FallbackOfMoveToolJetDatabaseTablesFromPublicToTenantSchema1721236971725',
      totalWorkspaceCount
    );

    try {
      await tooljetDbManager.transaction(async (tooljetDbTransactionManager) => {
        const dbName = envData.TOOLJET_DB;
        await this.provideAccessToPublicSchema(tooljetDbTransactionManager, dbName);

        await processDataInBatches(
          entityManager,
          this.findWorkspaceDetails,
          async (entityManager: EntityManager, workspaceDetailList: Organization[]) => {
            // Fallback logic
            await this.moveTjdbTablesToPublicSchema(
              tooljetDbTransactionManager,
              workspaceDetailList,
              migrationProgress,
              entityManager
            );
          },
          batchSize
        );
      });
    } catch (error) {
      console.error(
        'Error during processing batches in FallbackOfMoveToolJetDatabaseTablesFromPublicToTenantSchema1721236971725 migration:',
        error
      );
      throw error;
    } finally {
      await tooljetDbConnection.destroy();
    }
  }

  private async moveTjdbTablesToPublicSchema(
    tooljetDbTransactionManager: EntityManager,
    workspaceDetailList: Organization[],
    migrationProgress: MigrationProgress,
    entityManager: EntityManager
  ) {
    const envData = getEnvVars();
    for (const workspaceDetail of workspaceDetailList) {
      const workspaceId = workspaceDetail.id;
      const dbUser = `user_${workspaceId}`;
      const dbSchema = `workspace_${workspaceId}`;
      const dbSuperUser = envData.TOOLJET_DB_USER;

      const tableListInWorkspace = await entityManager.find(InternalTable, {
        where: { organizationId: workspaceId },
      });

      if (tableListInWorkspace.length) {
        for (const workspaceTable of tableListInWorkspace) {
          const { id } = workspaceTable;
          tooljetDbTransactionManager.query(`ALTER TABLE "${dbSchema}"."${id}" SET SCHEMA "public";`);
        }
      }
      await this.deleteTjdbTenantSchema(tooljetDbTransactionManager, dbSchema, dbUser);
      await this.deleteTjdbTenantUser(tooljetDbTransactionManager, dbUser, dbSuperUser);
      migrationProgress.show();
    }
  }

  private async deleteTjdbTenantUser(tooljetDbTransactionManager: EntityManager, dbUser: string, dbSuperUser: string) {
    await tooljetDbTransactionManager.query(`REASSIGN OWNED BY "${dbUser}" TO "${dbSuperUser}";`);
    await tooljetDbTransactionManager.query(`DROP OWNED BY "${dbUser}"`);
    await tooljetDbTransactionManager.query(`DROP ROLE "${dbUser}";`);
  }

  private async deleteTjdbTenantSchema(tooljetDbTransactionManager: EntityManager, dbSchema: string, dbUser: string) {
    await tooljetDbTransactionManager.query(`REVOKE USAGE ON SCHEMA "${dbSchema}" FROM "${dbUser}";`);
    await tooljetDbTransactionManager.query(`DROP SCHEMA "${dbSchema}" CASCADE;`);
  }

  private async provideAccessToPublicSchema(tooljetDbTransactionManager: EntityManager, dbName: string) {
    await tooljetDbTransactionManager.query(`GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO PUBLIC;`);
    await tooljetDbTransactionManager.query(`GRANT ALL PRIVILEGES ON SCHEMA public TO PUBLIC;`);
    await tooljetDbTransactionManager.query(`GRANT ALL PRIVILEGES ON SCHEMA information_schema TO PUBLIC;`);
    await tooljetDbTransactionManager.query(`ALTER DEFAULT PRIVILEGES GRANT EXECUTE ON FUNCTIONS TO PUBLIC;`);
  }
}
