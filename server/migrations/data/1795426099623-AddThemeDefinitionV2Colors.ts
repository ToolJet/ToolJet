import { QueryRunner } from 'typeorm';
import { DataMigration } from '../../src/migration-helpers/migration-mode';

const MIGRATION_NAME = 'AddThemeDefinitionV2Colors1795426099623';

type Pair = { light?: string; dark?: string };
type Definition = Record<string, unknown> & { version?: number; colors?: unknown };

// Frozen copy of the old-to-v2 colour conversion in packages/widget-definitions/src/theme.js (toV2), so later changes
// there do not change what this migration writes. The default border is v2's Strong; `disabled` tokens are dropped
// (nothing reads --cc-disabled-*).
const GROUPS = ['brand', 'text', 'surface', 'border', 'systemStatus'];
const RENAMED: Record<string, Record<string, string>> = { border: { default: 'strong' } };

const v2Colors = (definition: Definition): Record<string, Record<string, Pair>> => {
  const colors: Record<string, Record<string, Pair>> = {};
  GROUPS.forEach((group) => {
    const tokens = (definition[group] as { colors?: Record<string, Pair> } | undefined)?.colors;
    if (!tokens) return;
    colors[group] = {};
    Object.entries(tokens).forEach(([token, pair]) => {
      if (token !== 'disabled') colors[group][RENAMED[group]?.[token] ?? token] = pair;
    });
  });
  return colors;
};

/** Theme definition v2: gives every theme `version: 2` and `colors.<group>.<token>.{light, dark}` beside its old
 *  `<group>.colors` groups, which stay until a cleanup migration (old bundles and tooljet-mcp read them; every write
 *  keeps both shapes in step, organization-themes AGENTS.md). Only adds keys.
 *  - The column is json and the old theme loader depends on its key order (border.radius before border.colors), so
 *    rows are read as text, parsed here, and written back as json with the new keys appended.
 *  - A row saved while this runs is not overwritten: the update matches the text as read.
 *  - updated_at is left alone (the theme list sorts by it). The viewer-cache trigger on organization_themes still
 *    refreshes released apps once, with no visible change. */
export class AddThemeDefinitionV2Colors1795426099623 implements DataMigration {
  static readonly BATCH_SIZE = 500;

  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ count }] = await queryRunner.manager.query(`SELECT COUNT(*) AS count FROM organization_themes`);
    const total = Number(count);
    console.log(`${MIGRATION_NAME}: [START] Add v2 colours to theme definitions: ${total}`);

    let after: string | null = null;
    let seen = 0;
    for (;;) {
      const rows: Array<{ id: string; definition: string }> = await queryRunner.manager.query(
        `SELECT id, definition::text AS definition FROM organization_themes
          WHERE ($1::uuid IS NULL OR id > $1::uuid) ORDER BY id LIMIT $2`,
        [after, AddThemeDefinitionV2Colors1795426099623.BATCH_SIZE]
      );
      if (!rows.length) break;
      after = rows[rows.length - 1].id;
      seen += rows.length;

      const updates = rows.flatMap(({ id, definition: original }) => {
        const definition = JSON.parse(original) as Definition;
        if (definition?.version === 2 || definition?.colors) return [];
        return [{ id, original, definition: { ...definition, version: 2, colors: v2Colors(definition) } }];
      });
      if (updates.length) {
        await queryRunner.manager.query(
          `UPDATE organization_themes AS t
              SET definition = v.definition
             FROM json_to_recordset($1::json) AS v(id uuid, original text, definition json)
            WHERE t.id = v.id AND t.definition::text = v.original`,
          [JSON.stringify(updates)]
        );
      }
      console.log(`${MIGRATION_NAME}: [PROGRESS] ${seen}/${total} (${Math.round((seen / Math.max(total, 1)) * 100)}%)`);
    }
    console.log(`${MIGRATION_NAME}: [SUCCESS] Add v2 colours to theme definitions finished.`);
  }

  public async down(): Promise<void> {
    // Not reversed: the old groups were never changed, so old code reads them as before, and dropping `colors` would
    // lose colours only v2 has (On solid) saved since.
  }
}
