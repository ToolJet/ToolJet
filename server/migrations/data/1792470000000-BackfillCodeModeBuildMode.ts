import { QueryRunner } from 'typeorm';
import { DataMigration } from '../../src/migration-helpers/migration-mode';

const MIGRATION_NAME = 'BackfillCodeModeBuildMode1792470000000';
const BATCH_SIZE = 2000;

/**
 * Sets build_mode 'code' on existing apps that have a component with a codePage property, then validates the
 * apps_build_mode_check that AddAppBuildMode1792450000000 added NOT VALID. VALIDATE CONSTRAINT blocks neither reads
 * nor writes.
 */
export class BackfillCodeModeBuildMode1792470000000 implements DataMigration {
  private static isCodePage(propertiesText: string, componentId: string): boolean {
    let properties: { codePage?: { value?: unknown } } | null;
    try {
      properties = JSON.parse(propertiesText);
    } catch {
      throw new Error(`${MIGRATION_NAME}: Could not parse properties of component ${componentId}`);
    }
    const value = properties?.codePage?.value;
    return value === true || value === 'true' || value === '{{true}}';
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const appIds = new Set<string>();
    let lastId: string | null = null;
    console.log(`${MIGRATION_NAME}: [START] Find apps with a code-page root`);
    // JSON operators decode every string, including unrelated code containing \u0000. Read only root pack/library
    // candidates as text and parse in JS, which supports null characters without changing the saved content.
    while (true) {
      const candidates: Array<{ component_id: string; app_id: string; properties: string }> = await queryRunner.query(
        `SELECT c.id AS component_id, v.app_id, c.properties::text AS properties
           FROM components c
           JOIN pages p ON p.id = c.page_id
           JOIN app_versions v ON v.id = p.app_version_id
           JOIN apps a ON a.id = v.app_id
          WHERE a.build_mode = 'visual'
            AND c.type IN ('LibraryComponent', 'PackComponent')
            AND (c.parent IS NULL OR c.parent = '')
            AND ($1::uuid IS NULL OR c.id > $1::uuid)
          ORDER BY c.id
          LIMIT $2`,
        [lastId, BATCH_SIZE]
      );
      for (const candidate of candidates) {
        if (BackfillCodeModeBuildMode1792470000000.isCodePage(candidate.properties, candidate.component_id)) {
          appIds.add(candidate.app_id);
        }
      }
      if (candidates.length < BATCH_SIZE) break;
      lastId = candidates[candidates.length - 1].component_id;
    }
    const apps = [...appIds].sort().map((id) => ({ id }));
    const total = apps.length;
    console.log(`${MIGRATION_NAME}: [START] Set build mode to code for apps with a code page: ${total}`);

    let done = 0;
    for (let start = 0; start < total; start += BATCH_SIZE) {
      const ids = apps.slice(start, start + BATCH_SIZE).map(({ id }) => id);
      await queryRunner.query(
        `UPDATE apps SET build_mode = 'code' WHERE build_mode = 'visual' AND id = ANY($1::uuid[])`,
        [ids]
      );
      done += ids.length;
      console.log(`${MIGRATION_NAME}: [PROGRESS] ${done}/${total} (${((done / total) * 100).toFixed(1)}%)`);
    }
    console.log(`${MIGRATION_NAME}: [SUCCESS] Set build mode to code finished. Updated: ${done}`);
  }

  public async beforeCommit(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE apps VALIDATE CONSTRAINT apps_build_mode_check');
  }

  public async down(): Promise<void> {
    // Not reversible: a backfilled app can't be told apart from one created with build_mode 'code'. A valid check
    // stays valid.
  }
}
