import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { processDataInBatches } from '@helpers/migration.helper';
import { shippedThemes } from '@modules/organization-themes/constants/shipped-themes';

const MIGRATION_NAME = 'AddShippedThemesToOrganizations1791950000000';

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
    console.log(`${MIGRATION_NAME}: [START] Add ${shippedThemes.length} shipped themes to workspaces: ${count}`);
    if (count === 0 || shippedThemes.length === 0) {
      console.log(`${MIGRATION_NAME}: [SUCCESS] Add shipped themes finished. No workspaces to update.`);
      return;
    }

    const themes = JSON.stringify(shippedThemes.map(({ name, definition }) => ({ name, definition })));
    let done = 0;
    let inserted = 0;

    const fetchBatch = (manager: EntityManager, skip: number, take: number): Promise<Array<{ id: string }>> =>
      manager.query(`SELECT id FROM organizations ORDER BY id LIMIT $1 OFFSET $2`, [take, skip]);

    const processBatch = async (manager: EntityManager, organizations: Array<{ id: string }>) => {
      const added: unknown[] = await manager.query(
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
        RETURNING 1
        `,
        [organizations.map(({ id }) => id), themes]
      );
      done += organizations.length;
      inserted += added.length;
      console.log(`${MIGRATION_NAME}: [PROGRESS] ${done}/${count} (${((done / count) * 100).toFixed(1)}%)`);
    };

    await processDataInBatches(
      entityManager,
      fetchBatch,
      processBatch,
      AddShippedThemesToOrganizations1791950000000.BATCH_SIZE
    );
    console.log(`${MIGRATION_NAME}: [SUCCESS] Add shipped themes finished. Themes added: ${inserted}`);
  }

  public async down(): Promise<void> {
    // Not reversed: a workspace may have applied or edited these themes since they were added, and deleting them by
    // name could remove a theme an app uses.
  }
}
