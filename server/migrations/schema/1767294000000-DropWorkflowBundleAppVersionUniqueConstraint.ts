import { MigrationInterface, QueryRunner, TableIndex, TableUnique } from 'typeorm';

export class DropWorkflowBundleAppVersionUniqueConstraint1767294000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('workflow_bundles');
    if (!table) return;

    const uniqueConstraint = table.uniques.find(
      (uq) => uq.columnNames.length === 1 && uq.columnNames.includes('app_version_id')
    );
    if (uniqueConstraint) {
      await queryRunner.dropUniqueConstraint('workflow_bundles', uniqueConstraint);
    }

    const redundantIndex = table.indices.find((idx) => idx.name === 'idx_bundle_app_version_id');
    if (redundantIndex) {
      await queryRunner.dropIndex('workflow_bundles', redundantIndex);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createUniqueConstraint(
      'workflow_bundles',
      new TableUnique({
        columnNames: ['app_version_id'],
      })
    );

    await queryRunner.createIndex(
      'workflow_bundles',
      new TableIndex({
        name: 'idx_bundle_app_version_id',
        columnNames: ['app_version_id'],
      })
    );
  }
}
