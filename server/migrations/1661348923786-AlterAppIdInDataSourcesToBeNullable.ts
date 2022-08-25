import {MigrationInterface, QueryRunner} from "typeorm";

export class AlterAppIdInDataSourcesToBeNullable1661348923786 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(
        'ALTER TABLE data_sources ALTER COLUMN app_id DROP NOT NULL;'
      )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(
        'ALTER TABLE data_sources ALTER COLUMN app_id SET NOT NULL;'
      )
    }

}
