import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class ConvertHiddenFieldInPagesToJson1717131062890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.startTransaction();
    try {
      const pagesWitHiddenTrue = await queryRunner.query(`SELECT id, hidden FROM pages WHERE hidden = 'true'`);
      const pagesWithHiddenFalse = await queryRunner.query(`SELECT id, hidden FROM pages WHERE hidden = 'false'`);
      const idsToUpdate = pagesWitHiddenTrue.map((page) => page.id);
      const idsToUpdateFalse = pagesWithHiddenFalse.map((page) => page.id);
      await queryRunner.changeColumn(
        'pages',
        'hidden',
        new TableColumn({
          name: 'hidden',
          type: 'json',
          isNullable: true,
        })
      );
      if (idsToUpdate.length > 0) {
        const quotedIds = idsToUpdate.map((id) => `'${id}'`).join(',');
        await queryRunner.query(
          `UPDATE pages SET hidden = '{"fxActive": true, "value": "{{true}}"}' WHERE id IN (${quotedIds})`
        );
      }
      if (idsToUpdateFalse.length > 0) {
        const quotedIds = idsToUpdateFalse.map((id) => `'${id}'`).join(',');
        await queryRunner.query(
          `UPDATE pages SET hidden = '{"fxActive": false, "value": "{{false}}"}' WHERE id IN (${quotedIds})`
        );
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    }
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.startTransaction();
    try {
      const pagesWithHiddenTrue = await queryRunner.query(
        `SELECT id, hidden FROM pages WHERE hidden::json->>'value' = '{{true}}' or hidden::json->>'value' = 'true'`
      );
      const pagesWithHiddenFalse = await queryRunner.query(
        `SELECT id, hidden FROM pages WHERE hidden::json->>'value' = '{{false}}' or hidden::json->>'value' = 'false'`
      );
      const idsToUpdate = pagesWithHiddenTrue.map((page) => page.id);
      const idsToUpdateFalse = pagesWithHiddenFalse.map((page) => page.id);

      await queryRunner.changeColumn(
        'pages',
        'hidden',
        new TableColumn({
          name: 'hidden',
          type: 'boolean',
          isNullable: true,
        })
      );
      if (idsToUpdate.length > 0) {
        const quotedIds = idsToUpdate.map((id) => `'${id}'`).join(',');
        await queryRunner.query(`UPDATE pages SET hidden = 'true' WHERE id IN (${quotedIds})`);
      }
      if (idsToUpdateFalse.length > 0) {
        const quotedIds = idsToUpdateFalse.map((id) => `'${id}'`).join(',');
        await queryRunner.query(`UPDATE pages SET hidden = 'false' WHERE id IN (${quotedIds})`);
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    }
  }
}
