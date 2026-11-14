import { MigrationInterface, QueryRunner } from 'typeorm';

// migration-lint: allow-destructive down drops only the new table
// Component bundle bytes live in the database, so they survive a new container on hosts with no persistent volume.
export class CreateCustomComponentBundleFiles1793500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS custom_component_bundle_files (
        path text PRIMARY KEY,
        data bytea NOT NULL,
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS custom_component_bundle_files');
  }
}
