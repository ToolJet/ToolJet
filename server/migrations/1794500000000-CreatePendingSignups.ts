import { MigrationInterface, QueryRunner } from 'typeorm';

// Holds a self-serve signup until its email link is clicked, so the user and workspace rows are only
// created for a verified address. One row per email; a newer signup replaces the older row. Rows
// expire after 24 h and a nightly job deletes them.
export class CreatePendingSignups1794500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS pending_signups (
        token_hash varchar(64) PRIMARY KEY,
        email varchar(255) NOT NULL UNIQUE,
        name varchar(255),
        password_hash varchar(255),
        redirect_to text,
        expires_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_pending_signups_expires_at ON pending_signups (expires_at)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS pending_signups`);
  }
}
