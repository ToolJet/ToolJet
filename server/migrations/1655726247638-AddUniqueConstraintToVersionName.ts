import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueConstraintToVersionName1655726247638 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {}

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
