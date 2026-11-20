import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddPythonBundleColumns1767175667559 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add language column with default 'javascript'
    await queryRunner.addColumn(
      'workflow_bundles',
      new TableColumn({
        name: 'language',
        type: 'varchar',
        length: '20',
        default: "'javascript'",
        isNullable: false,
      })
    );

    // Add runtime_version column for semver (e.g., '3.11.0', '20.10.0')
    await queryRunner.addColumn(
      'workflow_bundles',
      new TableColumn({
        name: 'runtime_version',
        type: 'varchar',
        length: '20',
        isNullable: true,
      })
    );

    // Add bundle_binary column for Python tar.gz bundles (BYTEA)
    await queryRunner.addColumn(
      'workflow_bundles',
      new TableColumn({
        name: 'bundle_binary',
        type: 'bytea',
        isNullable: true,
      })
    );

    // Create index for language filtering
    await queryRunner.createIndex(
      'workflow_bundles',
      new TableIndex({
        name: 'idx_workflow_bundles_language',
        columnNames: ['language'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('workflow_bundles', 'idx_workflow_bundles_language');
    await queryRunner.dropColumn('workflow_bundles', 'bundle_binary');
    await queryRunner.dropColumn('workflow_bundles', 'runtime_version');
    await queryRunner.dropColumn('workflow_bundles', 'language');
  }
}
