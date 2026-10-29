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
import {
  initTestApp,
  closeTestApp,
  createAdmin,
  createApplication,
  createApplicationVersion,
  ensureAppEnvironments,
  getDefaultDataSource,
  resolveOrSeedDefaultBranch,
  withRealTransactions,
} from 'test-helper';
import { GranularPermissions } from 'src/entities/granular_permissions.entity';
import { ResourceType } from 'src/modules/group-permissions/constants';
import { CreateFolderDataSourcesTable1793250000000 } from '../../../../migrations/1793250000000-CreateFolderDataSourcesTable';
import { AddDataSourceFolderGranularPermissions1793250000100 } from '../../../../migrations/1793250000100-AddDataSourceFolderGranularPermissions';
import { AddWorkflowsGitTreeShaColumn1793250000200 } from '../../../../migrations/1793250000200-AddWorkflowsGitTreeShaColumn';
import { TjdbRolloutSubstrateSchema1793250000300 } from '../../../../migrations/1793250000300-TjdbRolloutSubstrateSchema';
import { BackfillWorkflowPinPortability1793250000400 } from '../../../../migrations/1793250000400-BackfillWorkflowPinPortability';
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

    it('should keep a feature-branch webhook toggle when the workflow_enabled backfill runs again', async () => {
      await withRealTransactions(async () => {
        const { workflow, defaultDraft, featureDraft, workspaceId } = await seedWorkflow();
        try {
          await inRolledBackTransaction(async (queryRunner) => {
            await new AddWorkflowEnabledToAppVersions1793250000500().up(queryRunner);
            await queryRunner.query(`UPDATE apps SET workflow_enabled = true WHERE id = $1`, [workflow.id]);
            await queryRunner.query(`UPDATE app_versions SET workflow_enabled = true WHERE id = $1`, [defaultDraft.id]);
            await queryRunner.query(`UPDATE app_versions SET workflow_enabled = false WHERE id = $1`, [featureDraft.id]);

            await new BackfillWorkflowEnabledOnAppVersions1793250000900().up(queryRunner);

            expect(await workflowEnabledOf(queryRunner, 'app_versions', featureDraft.id)).toBe(false);
          });
        } finally {
          await getDefaultDataSource().query(`DELETE FROM organizations WHERE id = $1`, [workspaceId]);
        }
      });
    }, 60_000);
  });

  // The previous release runs on this schema after a rollback, and reads what it always read.
  describe('for the previous release', () => {
    it('should copy configurations written on the relation sharing the table id to internal_tables, and only that one', async () => {
      await withRealTransactions(async () => {
        const { workspace } = await createAdmin(app, `release-migrations-mirror-${uuidv4()}@tooljet.io`);
        try {
          const environments = await ensureAppEnvironments(app, workspace.id);
          const byPriority = [...environments].sort((a, b) => a.priority - b.priority);
          const branch = await resolveOrSeedDefaultBranch(workspace.id);

          await inRolledBackTransaction(async (queryRunner) => {
            await new TjdbRolloutSubstrateSchema1793250000300().up(queryRunner);
            const tableId = uuidv4();
            await queryRunner.query(
              `INSERT INTO internal_tables (id, organization_id, table_name, co_relation_id) VALUES ($1, $2, 'orders', $3)`,
              [tableId, workspace.id, uuidv4()]
            );
            const configurationsOf = async () =>
              (await queryRunner.query(`SELECT configurations FROM internal_tables WHERE id = $1`, [tableId]))[0]
                .configurations;
            const insertRelation = (id: string, environmentId: string, configurations: object | null) =>
              queryRunner.query(
                `INSERT INTO internal_table_relations (id, internal_table_id, environment_id, branch_id, configurations)
                 VALUES ($1, $2, $3, $4, $5)`,
                [id, tableId, environmentId, branch.id, configurations]
              );
            const created = await configurationsOf();

            // create_table inserts the relation before it has configurations; internal_tables' column is NOT NULL.
            await insertRelation(tableId, byPriority[0].id, null);
            expect(await configurationsOf()).toEqual(created);

            await queryRunner.query(`UPDATE internal_table_relations SET configurations = $1 WHERE id = $2`, [
              { columns: { column_names: { id: 'a' } } },
              tableId,
            ]);
            expect(await configurationsOf()).toEqual({ columns: { column_names: { id: 'a' } } });

            await queryRunner.query(`UPDATE internal_table_relations SET configurations = $1 WHERE id = $2`, [
              { columns: { column_names: { id: 'a', name: 'b' } } },
              tableId,
            ]);
            expect(await configurationsOf()).toEqual({ columns: { column_names: { id: 'a', name: 'b' } } });

            await insertRelation(uuidv4(), byPriority[byPriority.length - 1].id, { columns: { column_names: {} } });
            expect(await configurationsOf()).toEqual({ columns: { column_names: { id: 'a', name: 'b' } } });
          });
        } finally {
          await getDefaultDataSource().query(`DELETE FROM organizations WHERE id = $1`, [workspace.id]);
        }
      });
    }, 60_000);

    it('should copy a default-branch webhook toggle to apps.workflow_enabled, and not a feature-branch one', async () => {
      await withRealTransactions(async () => {
        const { workflow, defaultDraft, featureDraft, workspaceId } = await seedWorkflow();
        try {
          await inRolledBackTransaction(async (queryRunner) => {
            await new AddWorkflowEnabledToAppVersions1793250000500().up(queryRunner);

            await queryRunner.query(`UPDATE app_versions SET workflow_enabled = true WHERE id = $1`, [defaultDraft.id]);
            expect(await workflowEnabledOf(queryRunner, 'apps', workflow.id)).toBe(true);

            await queryRunner.query(`UPDATE app_versions SET workflow_enabled = false WHERE id = $1`, [featureDraft.id]);
            expect(await workflowEnabledOf(queryRunner, 'apps', workflow.id)).toBe(true);
          });
        } finally {
          await getDefaultDataSource().query(`DELETE FROM organizations WHERE id = $1`, [workspaceId]);
        }
      });
    }, 60_000);

    it('should leave app_versions.workflow_enabled nullable with no default, so readers fall back to the app', async () => {
      await withRealTransactions(() =>
        inRolledBackTransaction(async (queryRunner) => {
          await new AddWorkflowEnabledToAppVersions1793250000500().up(queryRunner);
          const [column] = await queryRunner.query(
            `SELECT is_nullable, column_default FROM information_schema.columns
             WHERE table_name = 'app_versions' AND column_name = 'workflow_enabled'`
          );
          expect(column).toEqual({ is_nullable: 'YES', column_default: null });
        })
      );
    }, 60_000);
  });

  /** A workflow with a DRAFT on the default branch and a branch row on a feature branch. Commits for real. */
  async function seedWorkflow() {
    const { user, workspace } = await createAdmin(app, `release-migrations-workflow-${uuidv4()}@tooljet.io`);
    const workflow = await createApplication(app, {
      name: `wf-${uuidv4()}`,
      user: { ...user, organizationId: workspace.id } as any,
      type: 'workflow',
    });
    const defaultDraft = await createApplicationVersion(app, { ...workflow, organizationId: workspace.id } as any);
    const featureDraft = await createApplicationVersion(app, { ...workflow, organizationId: workspace.id } as any, {
      name: 'feature',
    });
    const [featureBranch] = await getDefaultDataSource().query(
      `INSERT INTO organization_git_sync_branches (organization_id, branch_name, is_default) VALUES ($1, $2, false) RETURNING id`,
      [workspace.id, `feature-${uuidv4()}`]
    );
    await getDefaultDataSource().query(`UPDATE app_versions SET branch_id = $1, version_type = 'branch' WHERE id = $2`, [
      featureBranch.id,
      featureDraft.id,
    ]);
    return { workflow, defaultDraft, featureDraft, workspaceId: workspace.id };
  }

  async function workflowEnabledOf(queryRunner: QueryRunner, table: 'apps' | 'app_versions', id: string) {
    const [row] = await queryRunner.query(`SELECT workflow_enabled FROM ${table} WHERE id = $1`, [id]);
    return row.workflow_enabled;
  }
});
