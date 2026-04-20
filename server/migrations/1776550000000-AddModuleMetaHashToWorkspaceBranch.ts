import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add module_meta_hash column to organization_git_sync_branches.
 *
 * Mirrors the existing app_meta_hash / data_source_meta_hash Tier-1 skip caches
 * — pullModules will short-circuit when the cloned moduleMeta.json hash matches
 * the cached value for the branch.
 */
export class AddModuleMetaHashToWorkspaceBranch1776550000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE organization_git_sync_branches
      ADD COLUMN IF NOT EXISTS module_meta_hash VARCHAR(64) DEFAULT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE organization_git_sync_branches
      DROP COLUMN IF EXISTS module_meta_hash;
    `);
  }
}
