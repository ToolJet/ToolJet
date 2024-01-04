import { dropForeignKey } from 'src/helpers/utils.helper';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropAppVersionIdInAppEnvironments1677820920004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await dropForeignKey('app_environments', 'app_version_id', queryRunner);
    await queryRunner.query('alter table app_environments alter column app_version_id drop not null');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
