import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { MigrationProgress, processDataInBatches } from '@helpers/migration.helper';
import { shippedThemes } from '@modules/organization-themes/constants/shipped-themes';

/**
 * Adds the colour themes ToolJet ships (constants/shipped-themes.ts) to every existing workspace, beside its basic
 * "ToolJet" theme. New workspaces get them from createDefaultTheme.
 *
 * Workspaces are read in batches by id, and each batch gets all its themes from one INSERT ... SELECT, so the cost is
 * one statement per batch however many workspaces there are. A name the workspace already uses (in any case) is
 * skipped, so a theme someone made with the same name is left alone, and running it again adds nothing.
 */
export class AddShippedThemesToOrganizations1791950000000 implements MigrationInterface {
  static readonly BATCH_SIZE = 500;

  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const [{ count }] = await entityManager.query(`SELECT COUNT(*)::int AS count FROM organizations`);
    if (count === 0 || shippedThemes.length === 0) {
      console.log('AddShippedThemesToOrganizations1791950000000: no workspaces to update.');
      return;
    }

    const themes = JSON.stringify(shippedThemes.map(({ name, definition }) => ({ name, definition })));
    const migrationProgress = new MigrationProgress(
      'AddShippedThemesToOrganizations1791950000000',
      Math.ceil(count / AddShippedThemesToOrganizations1791950000000.BATCH_SIZE)
    );

    const fetchBatch = (manager: EntityManager, skip: number, take: number): Promise<Array<{ id: string }>> =>
      manager.query(`SELECT id FROM organizations ORDER BY id LIMIT $1 OFFSET $2`, [take, skip]);

    const processBatch = async (manager: EntityManager, organizations: Array<{ id: string }>) => {
      await manager.query(
        `
        INSERT INTO organization_themes (name, organization_id, definition, is_default, is_basic, created_at, updated_at)
        SELECT t.name, o.id, t.definition::json, false, false, now(), now()
        FROM unnest($1::uuid[]) AS o(id)
        CROSS JOIN jsonb_to_recordset($2::jsonb) AS t(name text, definition jsonb)
        WHERE NOT EXISTS (
          SELECT 1 FROM organization_themes ot
          WHERE ot.organization_id = o.id AND lower(ot.name) = lower(t.name)
        )
        ON CONFLICT DO NOTHING
        `,
        [organizations.map(({ id }) => id), themes]
      );
      migrationProgress.show();
    };

    await processDataInBatches(
      entityManager,
      fetchBatch,
      processBatch,
      AddShippedThemesToOrganizations1791950000000.BATCH_SIZE
    );
  }

  public async down(): Promise<void> {}
}
