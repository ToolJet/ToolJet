import { MigrationInterface, QueryRunner } from 'typeorm';
import { shippedThemes } from '@modules/organization-themes/constants/shipped-themes';

/** Adds the colour themes ToolJet ships (constants/shipped-themes.ts) to every existing workspace, beside its basic
 *  "ToolJet" theme. New workspaces get them from createDefaultTheme. A name the workspace already uses is skipped,
 *  so a theme someone made with the same name is left alone. */
export class AddShippedThemesToOrganizations1791950000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const organizations: Array<{ id: string }> = await queryRunner.query(`SELECT id FROM organizations`);
    for (const org of organizations) {
      const existing: Array<{ name: string }> = await queryRunner.query(
        `SELECT name FROM organization_themes WHERE organization_id = $1`,
        [org.id]
      );
      const taken = new Set(existing.map((row) => row.name.toLowerCase()));
      for (const theme of shippedThemes) {
        if (taken.has(theme.name.toLowerCase())) continue;
        await queryRunner.query(
          `INSERT INTO organization_themes (name, organization_id, definition, is_default, is_basic, created_at, updated_at)
           VALUES ($1, $2, $3, false, false, now(), now())`,
          [theme.name, org.id, JSON.stringify(theme.definition)]
        );
      }
    }
  }

  public async down(): Promise<void> {}
}
