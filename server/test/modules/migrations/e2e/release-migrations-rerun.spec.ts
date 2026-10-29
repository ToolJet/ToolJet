/**
 * The release's migrations were re-dated past the async-upgrade cutoff after test databases had
 * already run them under their earlier timestamps, so those databases run every one a second time.
 * The test database is one of them: each `up()` below is that second run, inside a transaction that
 * is rolled back afterwards.
 *
 * @group platform
 */
import { INestApplication } from '@nestjs/common';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { initTestApp, closeTestApp, createAdmin, getDefaultDataSource, withRealTransactions } from 'test-helper';
import { GranularPermissions } from 'src/entities/granular_permissions.entity';
import { ResourceType } from 'src/modules/group-permissions/constants';
import { CreateFolderDataSourcesTable1793250000000 } from '../../../../migrations/1793250000000-CreateFolderDataSourcesTable';
import { AddDataSourceFolderGranularPermissions1793250000100 } from '../../../../migrations/1793250000100-AddDataSourceFolderGranularPermissions';
import { AddWorkflowsGitTreeShaColumn1793250000200 } from '../../../../migrations/1793250000200-AddWorkflowsGitTreeShaColumn';
import { TjdbRolloutSubstrateSchema1793250000300 } from '../../../../migrations/1793250000300-TjdbRolloutSubstrateSchema';
import { BackfillWorkflowPinPortability1793250000400 } from '../../../../data-migrations/1793250000400-BackfillWorkflowPinPortability';
import { AddWorkflowEnabledToAppVersions1793250000500 } from '../../../../migrations/1793250000500-AddWorkflowEnabledToAppVersions';
import { AddDataSourceFolderGranularPermissionsToExistingAdminAndBuilderGroups1793250000600 } from '../../../../data-migrations/1793250000600-AddDataSourceFolderGranularPermissionsToExistingAdminAndBuilderGroups';
import { SeedMissingAppEnvironments1793250000700 } from '../../../../data-migrations/1793250000700-SeedMissingAppEnvironments';
import { BackfillWorkflowEnabledOnAppVersions1793250000900 } from '../../../../data-migrations/1793250000900-BackfillWorkflowEnabledOnAppVersions';
import { FixWorkflowSlugTriggerSelfCollision1793250001000 } from '../../../../data-migrations/1793250001000-FixWorkflowSlugTriggerSelfCollision';

// Migration A and B need the ToolJet Database and EE; their second-run tests live in ee/test.
const MIGRATIONS: Array<new () => MigrationInterface> = [
  CreateFolderDataSourcesTable1793250000000,
  AddDataSourceFolderGranularPermissions1793250000100,
  AddWorkflowsGitTreeShaColumn1793250000200,
  TjdbRolloutSubstrateSchema1793250000300,
  BackfillWorkflowPinPortability1793250000400,
  AddWorkflowEnabledToAppVersions1793250000500,
  AddDataSourceFolderGranularPermissionsToExistingAdminAndBuilderGroups1793250000600,
  SeedMissingAppEnvironments1793250000700,
  BackfillWorkflowEnabledOnAppVersions1793250000900,
  FixWorkflowSlugTriggerSelfCollision1793250001000,
];

describe('Release migrations', () => {
  let app: INestApplication;

  beforeAll(async () => {
    ({ app } = await initTestApp());
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60_000);

  async function inRolledBackTransaction(fn: (queryRunner: QueryRunner) => Promise<void>): Promise<void> {
    const queryRunner = getDefaultDataSource().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await fn(queryRunner);
    } finally {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
    }
  }

  describe('on a second run', () => {
    it.each(MIGRATIONS.map((migration) => [migration.name, migration]))(
      'should succeed for %s',
      async (_name, Migration: new () => MigrationInterface) => {
        await withRealTransactions(() => inRolledBackTransaction((queryRunner) => new Migration().up(queryRunner)));
      },
      60_000
    );

    it('should keep data-source-folder create/delete flags an admin changed', async () => {
      await withRealTransactions(async () => {
        const { workspace } = await createAdmin(app, `release-migrations-rerun-${uuidv4()}@tooljet.io`);
        try {
          await inRolledBackTransaction(async (queryRunner) => {
            const [adminGroup] = await queryRunner.query(
              `SELECT id FROM permission_groups WHERE organization_id = $1 AND name = 'admin' AND type = 'default'`,
              [workspace.id]
            );
            // The state the first run leaves: the granular permission exists.
            const existing = await queryRunner.manager.count(GranularPermissions, {
              where: { groupId: adminGroup.id, type: ResourceType.DATA_SOURCE_FOLDER },
            });
            if (existing === 0) {
              await queryRunner.manager.save(
                queryRunner.manager.create(GranularPermissions, {
                  name: 'Data source folders',
                  type: ResourceType.DATA_SOURCE_FOLDER,
                  groupId: adminGroup.id,
                  isAll: true,
                })
              );
            }
            await queryRunner.query(
              `UPDATE permission_groups SET data_source_folder_create = false, data_source_folder_delete = false WHERE id = $1`,
              [adminGroup.id]
            );

            await new AddDataSourceFolderGranularPermissionsToExistingAdminAndBuilderGroups1793250000600().up(
              queryRunner
            );

            const [flags] = await queryRunner.query(
              `SELECT data_source_folder_create, data_source_folder_delete FROM permission_groups WHERE id = $1`,
              [adminGroup.id]
            );
            expect(flags).toEqual({ data_source_folder_create: false, data_source_folder_delete: false });
          });
        } finally {
          await getDefaultDataSource().query(`DELETE FROM organizations WHERE id = $1`, [workspace.id]);
        }
      });
    }, 60_000);
  });
});
