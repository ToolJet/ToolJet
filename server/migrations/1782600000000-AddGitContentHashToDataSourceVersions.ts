import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Per-datasource change token for git-sync pull dedup. On pull, the datasource's
 * canonical content hash (sha256 of the sorted data-source.json) is compared
 * against this stored value; when they match and the DSV is already synced, the
 * expensive per-env options/credentials re-apply is skipped.
 *
 * Git-native successor to the dropped `meta_timestamp` column: the hash is
 * computed live from the actual file, not read from a `.meta` manifest.
 *
 * down() drops the column — matching this migration family's convention of not
 * reverting data on rollback.
 */
export class AddGitContentHashToDataSourceVersions1782600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE data_source_versions ADD COLUMN IF NOT EXISTS git_content_hash VARCHAR(64) DEFAULT NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE data_source_versions DROP COLUMN IF EXISTS git_content_hash`);
  }
}
