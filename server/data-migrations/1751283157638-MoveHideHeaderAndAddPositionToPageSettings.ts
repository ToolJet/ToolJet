import { MigrationInterface, QueryRunner } from 'typeorm';

export class MoveHideHeaderAndAddPositionToPageSettings1751283157638 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const appVersions = await queryRunner.manager.query(`
      SELECT id, page_settings, global_settings FROM app_versions
    `);

    for (const version of appVersions) {
      let pageSettings = version.page_settings;
      let globalSettings = version.global_settings;

      if (typeof pageSettings === 'string') {
        pageSettings = JSON.parse(pageSettings);
      }
      if (typeof globalSettings === 'string') {
        globalSettings = JSON.parse(globalSettings);
      }

      if (!pageSettings) {
        pageSettings = { properties: {} };
      }

      if (!pageSettings.properties) {
        pageSettings.properties = {};
      }

      if (!('position' in pageSettings.properties)) {
        pageSettings.properties.position = 'side';
      }

      if (globalSettings && 'hideHeader' in globalSettings) {
        pageSettings.properties.hideHeader = globalSettings.hideHeader;
        pageSettings.properties.hideLogo = globalSettings.hideHeader;
      }

      await queryRunner.manager.query(
        `UPDATE app_versions SET page_settings = $1, global_settings = $2 WHERE id = $3`,
        [JSON.stringify(pageSettings), JSON.stringify(globalSettings), version.id]
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
