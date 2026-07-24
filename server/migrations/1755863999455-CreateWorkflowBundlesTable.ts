import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateWorkflowBundlesTable1755863999455 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'workflow_bundles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'app_version_id',
            type: 'uuid',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'dependencies',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'bundle_content',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'bundle_size',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'bundle_sha',
            type: 'varchar',
            length: '64',
            isNullable: true,
          },
          {
            name: 'generation_time_ms',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'error',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'none'",
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'workflow_bundles',
      new TableForeignKey({
        columnNames: ['app_version_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'app_versions',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createIndex(
      'workflow_bundles',
      new TableIndex({
        name: 'idx_bundle_status',
        columnNames: ['status'],
      })
    );

    await queryRunner.createIndex(
      'workflow_bundles',
      new TableIndex({
        name: 'idx_bundle_sha',
        columnNames: ['bundle_sha'],
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('workflow_bundles');
  }
}
