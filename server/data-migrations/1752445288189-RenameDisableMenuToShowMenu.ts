import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameDisableMenuToShowMenu1752445288189 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const appVersions = await queryRunner.manager.query(`
      SELECT id, page_settings FROM app_versions
    `);

    for (const version of appVersions) {
      let pageSettings = version.page_settings;

      if (typeof pageSettings === 'string') {
        pageSettings = JSON.parse(pageSettings);
      }

      if (!pageSettings) {
        pageSettings = { properties: {} };
      }
      if (!pageSettings.properties) {
        pageSettings.properties = {};
      }

      if ('disableMenu' in pageSettings.properties) {
        pageSettings.properties.showMenu = {
          ...pageSettings.properties.disableMenu,
          value: !pageSettings.properties.disableMenu,
        };
        delete pageSettings.properties.disableMenu;
      }

      await queryRunner.manager.query(`UPDATE app_versions SET page_settings = $1 WHERE id = $2`, [
        JSON.stringify(pageSettings),
        version.id,
      ]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
