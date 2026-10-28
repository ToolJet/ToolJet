import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCustomPageType1771788082006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (queryRunner.connection.driver.options.type === "postgres") {
      await queryRunner.query(`
        ALTER TYPE "page_type_enum" ADD VALUE 'custom';
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
