import { updateCurrentEnvironmentId } from '@helpers/migration.helper';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackFillCurrentEnvironmentId1686829426671 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    //back fill current_environment_id to production env id
    await updateCurrentEnvironmentId(queryRunner.manager, 'BackFillCurrentEnvironmentId1686829426671');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
