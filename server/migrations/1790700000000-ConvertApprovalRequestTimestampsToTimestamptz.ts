import { MigrationInterface, QueryRunner } from 'typeorm';

// The implicit cast reads existing values in the session zone, the zone now() wrote them in.
export class ConvertApprovalRequestTimestampsToTimestamptz1790700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE workflow_approval_requests
        ALTER COLUMN created_at TYPE timestamptz,
        ALTER COLUMN updated_at TYPE timestamptz
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE workflow_approval_requests
        ALTER COLUMN created_at TYPE timestamp,
        ALTER COLUMN updated_at TYPE timestamp
    `);
  }
}
