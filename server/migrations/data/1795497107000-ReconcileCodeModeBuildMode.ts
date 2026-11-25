import { QueryRunner } from 'typeorm';
import { DataMigration } from '../../src/migration-helpers/migration-mode';

const MIGRATION_NAME = 'ReconcileCodeModeBuildMode1795497107000';
const BATCH_SIZE = 2000;

/**
 * Sets build_mode 'code' on visual apps that hold code: a code page root (a top-level pack or library component with
 * codePage set) or stored Code mode source. BackfillCodeModeBuildMode1792470000000 did the first half once, but the
 * server kept accepting code pages and code in visual apps after it ran. This release refuses both, and app security
 * now goes by build_mode alone, so every app that slipped in between is switched here.
 */
export class ReconcileCodeModeBuildMode1795497107000 implements DataMigration {
  private static isCodePage(propertiesText: string | null, componentId: string): boolean {
    let properties: { codePage?: { value?: unknown } } | null;
    try {
      properties = propertiesText ? JSON.parse(propertiesText) : null;
    } catch {
      throw new Error(`${MIGRATION_NAME}: Could not parse properties of component ${componentId}`);
    }
    const value = properties?.codePage?.value;
    return value === true || value === 'true' || value === '{{true}}';
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log(`${MIGRATION_NAME}: [START] Find visual apps with a code page or stored code`);
    const appIds = new Set<string>();

    const withSource: { app_id: string }[] = await queryRunner.query(
      `SELECT DISTINCT v.app_id
         FROM code_mode_sources s
         JOIN app_versions v ON v.id = s.app_version_id
         JOIN apps a ON a.id = v.app_id
        WHERE a.build_mode = 'visual'`
    );
    withSource.forEach((row) => appIds.add(row.app_id));

    // JSON operators decode every string, including unrelated code containing \u0000. Read only root pack and library
    // components of visual apps as text and parse them here, which leaves the stored content as it is.
    let lastId: string | null = null;
    while (true) {
      const candidates: Array<{ component_id: string; app_id: string; properties: string | null }> =
        await queryRunner.query(
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
        if (ReconcileCodeModeBuildMode1795497107000.isCodePage(candidate.properties, candidate.component_id)) {
          appIds.add(candidate.app_id);
        }
      }
      if (candidates.length < BATCH_SIZE) break;
      lastId = candidates[candidates.length - 1].component_id;
    }

    const apps = [...appIds].sort();
    const total = apps.length;
    console.log(`${MIGRATION_NAME}: [START] Set build mode to code for visual apps that hold code: ${total}`);
    let done = 0;
    for (let start = 0; start < total; start += BATCH_SIZE) {
      const ids = apps.slice(start, start + BATCH_SIZE);
      await queryRunner.query(
        `UPDATE apps SET build_mode = 'code' WHERE build_mode = 'visual' AND id = ANY($1::uuid[])`,
        [ids]
      );
      done += ids.length;
      console.log(`${MIGRATION_NAME}: [PROGRESS] ${done}/${total} (${((done / total) * 100).toFixed(1)}%)`);
    }
    console.log(`${MIGRATION_NAME}: [SUCCESS] Set build mode to code finished. Updated: ${done}`);
  }

  public async down(): Promise<void> {
    // Not reversible: a switched app can't be told apart from one created with build_mode 'code'.
  }
}
