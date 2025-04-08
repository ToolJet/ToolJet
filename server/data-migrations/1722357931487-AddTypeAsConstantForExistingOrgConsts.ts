import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTypeAsGlobalForExistingConstants1722357931487 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            UPDATE organization_constants
            SET type = 'Global'
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
