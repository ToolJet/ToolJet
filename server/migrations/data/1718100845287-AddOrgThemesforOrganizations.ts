import { MigrationInterface, QueryRunner } from 'typeorm';

const TJDefaultTheme = {
  brand: {
    primary: {
      light: '#4368E3',
      dark: '#4A6DD9',
    },
    secondary: {
      light: '#6A727C',
      dark: '#CFD3D8',
    },
    tertiary: {
      light: '#1E823B',
      dark: '#318344',
    },
  },
};

export class AddOrgThemesforOrganizations1718100845287 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Retrieve all existing organizations
    const organizations = await queryRunner.query(`SELECT id FROM organizations`);

    // Insert the default theme for each organization
    for (const org of organizations) {
      await queryRunner.query(
        `
        INSERT INTO organization_themes (name, organization_id, definition, is_default, is_basic, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
        ['TJ default', org.id, TJDefaultTheme, true, true, new Date(), new Date()]
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
