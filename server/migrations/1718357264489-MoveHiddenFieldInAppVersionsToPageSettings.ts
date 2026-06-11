import { MigrationInterface, QueryRunner } from 'typeorm';

export class MoveHiddenFieldInAppVersionsToPageSettings1718357264489 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.startTransaction();
    try {
      const pagesWitHiddenTrue = await queryRunner.query(
        `SELECT id, show_viewer_navigation FROM app_versions WHERE show_viewer_navigation = 'true'`
      );
      const pagesWithHiddenFalse = await queryRunner.query(
        `SELECT id, show_viewer_navigation FROM app_versions WHERE show_viewer_navigation = 'false'`
      );
      const idsToUpdate = pagesWitHiddenTrue.map((page) => page.id);
      const idsToUpdateFalse = pagesWithHiddenFalse.map((page) => page.id);

      if (idsToUpdate.length > 0) {
        const quotedIds = idsToUpdate.map((id) => `'${id}'`).join(',');
        await queryRunner.query(
          `UPDATE app_versions SET page_settings = '{"properties": {"disableMenu": {"value": "{{false}}", "fxActive": false}}}' WHERE id IN (${quotedIds})`
        );
      }
      if (idsToUpdateFalse.length > 0) {
        const quotedIds = idsToUpdateFalse.map((id) => `'${id}'`).join(',');
        await queryRunner.query(
          `UPDATE app_versions SET page_settings = '{"properties": {"disableMenu": {"value": "{{true}}", "fxActive": false}}}' WHERE id IN (${quotedIds})`
        );
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    }
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    return Promise.resolve();
  }
}
