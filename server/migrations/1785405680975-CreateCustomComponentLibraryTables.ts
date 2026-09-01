import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

// Custom Component Library (v2) catalog tables. Bundle BYTES live in StorageService
// (filesystem/S3) — these tables hold metadata + storage paths only (DECISIONS-2026-07-30 #1/#5).
export class CreateCustomComponentLibraryTables1785405680975 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'custom_component_libraries',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'name', type: 'varchar', isNullable: false },
          { name: 'organization_id', type: 'uuid', isNullable: false },
          { name: 'correlation_id', type: 'uuid', isNullable: false, default: 'gen_random_uuid()' },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
          { name: 'updated_at', type: 'timestamptz', default: 'now()' },
        ],
        foreignKeys: [
          {
            columnNames: ['organization_id'],
            referencedTableName: 'organizations',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true
    );

    // One library name per workspace — enforced here, not in app code
    await queryRunner.createIndex(
      'custom_component_libraries',
      new TableIndex({
        name: 'IDX_ccl_organization_id_name',
        columnNames: ['organization_id', 'name'],
        isUnique: true,
      })
    );

    await queryRunner.createTable(
      new Table({
        name: 'custom_component_library_revisions',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'library_id', type: 'uuid', isNullable: false },
          { name: 'version', type: 'varchar', isNullable: false }, // 'v1', 'v2', ...
          { name: 'bundle_url', type: 'varchar', isNullable: false }, // StorageService path
          { name: 'css_url', type: 'varchar', isNullable: true },
          { name: 'manifest', type: 'jsonb', isNullable: false },
          { name: 'message', type: 'varchar', isNullable: true },
          // No updated_at on purpose: revisions are immutable — published once, never edited
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
        ],
        foreignKeys: [
          {
            columnNames: ['library_id'],
            referencedTableName: 'custom_component_libraries',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true
    );

    // Unique (library, version) doubles as the concurrent-publish race guard
    await queryRunner.createIndex(
      'custom_component_library_revisions',
      new TableIndex({
        name: 'IDX_cclr_library_id_version',
        columnNames: ['library_id', 'version'],
        isUnique: true,
      })
    );

    await queryRunner.createTable(
      new Table({
        name: 'custom_component_dev_bundles',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'library_id', type: 'uuid', isNullable: false },
          { name: 'user_id', type: 'uuid', isNullable: false },
          { name: 'bundle_url', type: 'varchar', isNullable: false },
          { name: 'css_url', type: 'varchar', isNullable: true },
          { name: 'manifest', type: 'jsonb', isNullable: false },
          { name: 'uploaded_at', type: 'timestamptz', default: 'now()' },
        ],
        foreignKeys: [
          {
            columnNames: ['library_id'],
            referencedTableName: 'custom_component_libraries',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true
    );

    // Per-developer dev track (DECISIONS-2026-07-30 #3): exactly one mutable slot per (library, dev)
    await queryRunner.createIndex(
      'custom_component_dev_bundles',
      new TableIndex({
        name: 'IDX_ccdb_library_id_user_id',
        columnNames: ['library_id', 'user_id'],
        isUnique: true,
      })
    );

  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('custom_component_dev_bundles', 'IDX_ccdb_library_id_user_id');
    await queryRunner.dropTable('custom_component_dev_bundles');
    await queryRunner.dropIndex('custom_component_library_revisions', 'IDX_cclr_library_id_version');
    await queryRunner.dropTable('custom_component_library_revisions');
    await queryRunner.dropIndex('custom_component_libraries', 'IDX_ccl_organization_id_name');
    await queryRunner.dropTable('custom_component_libraries');
  }
}
