import { MigrationInterface, QueryRunner, TableIndex, TableUnique } from 'typeorm';

export class DropWorkflowBundleAppVersionUniqueConstraint1767294000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('workflow_bundles');
    if (!table) return;

    // Drop the single-column unique constraint on app_version_id
    const uniqueConstraint = table.uniques.find(
      (uq) => uq.columnNames.length === 1 && uq.columnNames.includes('app_version_id')
    );
    if (uniqueConstraint) {
      await queryRunner.dropUniqueConstraint('workflow_bundles', uniqueConstraint);
    }

    // Drop the redundant single-column index on app_version_id
    // (the composite unique index on (app_version_id, language) covers lookups by app_version_id)
    const redundantIndex = table.indices.find((idx) => idx.name === 'idx_bundle_app_version_id');
    if (redundantIndex) {
      await queryRunner.dropIndex('workflow_bundles', redundantIndex);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-add the single-column unique constraint on app_version_id
    await queryRunner.createUniqueConstraint(
      'workflow_bundles',
      new TableUnique({
        columnNames: ['app_version_id'],
      })
    );

    // Re-add the single-column index on app_version_id
    await queryRunner.createIndex(
      'workflow_bundles',
      new TableIndex({
        name: 'idx_bundle_app_version_id',
        columnNames: ['app_version_id'],
      })
    );
  }
}
