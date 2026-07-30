import { MigrationInterface, QueryRunner, Table } from 'typeorm';

// CLI auth tokens — deliberately a NEW table, not user_personal_access_tokens: that table is
// embed-only (app-scoped, forced expiry, MD5) and reuse would weaken its invariants
// (DECISIONS-2026-07-30 #6). SHA-256 hash, tj_cli_ prefix, no expiry in v1.
export class CreateCliApiTokensTable1785405680976 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'cli_api_tokens',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'user_id', type: 'uuid', isNullable: false },
          { name: 'organization_id', type: 'uuid', isNullable: false },
          { name: 'name', type: 'varchar', isNullable: false }, // "Manish's MacBook"
          { name: 'token_hash', type: 'varchar', isNullable: false, isUnique: true }, // SHA-256, O(1) lookup
          // No expires_at on purpose: no token expiry in v1 (DECISIONS-2026-07-30, scope cuts)
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('cli_api_tokens');
  }
}
