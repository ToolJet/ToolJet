import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrateHiddenValueFromBooleanToJson1750659565297 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {

    await queryRunner.query(`ALTER TABLE pages RENAME COLUMN hidden TO hidden_old`);

    await queryRunner.query(`ALTER TABLE pages ADD COLUMN hidden jsonb`);

    const pages = await queryRunner.query(`SELECT id, hidden_old FROM pages`);
    for (const page of pages) {
      const newValue = {
          value: `{{${page.hidden_old}}}`,
          fxActive: false,
      };

      await queryRunner.query(
        `UPDATE pages SET hidden = $1 WHERE id = $2`,
        [JSON.stringify(newValue), page.id]
      );
    }

    await queryRunner.query(`ALTER TABLE pages DROP COLUMN hidden_old`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
