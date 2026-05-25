import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRemoteUpdatedAtToAppVersions1779600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'app_versions',
      new TableColumn({
        name: 'remote_updated_at',
        type: 'timestamp',
        isNullable: true,
        default: null,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('app_versions', 'remote_updated_at');
  }
}
