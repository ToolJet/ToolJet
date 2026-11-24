import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Nullable columns for human-in-the-loop runs, the executions dashboard and named schedules.
 * Columns only: AddWorkflowRunHistoryKeysAndIndexes1793500000200 fills rows and adds the keys and indexes
 * in the data phase. IF NOT EXISTS: a database that ran the earlier development migrations has them.
 */
export class AddWorkflowRunHistoryColumns1793500000100 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE workflow_executions
        ADD COLUMN IF NOT EXISTS parent_execution_id uuid,
        ADD COLUMN IF NOT EXISTS parent_node_id uuid,
        ADD COLUMN IF NOT EXISTS schedule_id uuid,
        ADD COLUMN IF NOT EXISTS environment_id uuid,
        ADD COLUMN IF NOT EXISTS organization_id uuid,
        ADD COLUMN IF NOT EXISTS app_id uuid,
        ADD COLUMN IF NOT EXISTS trigger_type varchar,
        ADD COLUMN IF NOT EXISTS started_at timestamptz,
        ADD COLUMN IF NOT EXISTS finished_at timestamptz,
        ADD COLUMN IF NOT EXISTS trigger_source_app_id uuid
    `);
    await queryRunner.query(`ALTER TABLE workflow_execution_nodes ADD COLUMN IF NOT EXISTS input_state text`);
    // app_id stays nullable: the previous release inserts schedules without it while async mode runs it on
    // this schema. Set NOT NULL in a later release's cleanup.
    await queryRunner.query(`
      ALTER TABLE workflow_schedules
        ADD COLUMN IF NOT EXISTS name varchar(100),
        ADD COLUMN IF NOT EXISTS app_id uuid,
        ADD COLUMN IF NOT EXISTS params jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE workflow_schedules DROP COLUMN IF EXISTS params, DROP COLUMN IF EXISTS app_id, DROP COLUMN IF EXISTS name`);
    await queryRunner.query(`ALTER TABLE workflow_execution_nodes DROP COLUMN IF EXISTS input_state`);
    await queryRunner.query(`
      ALTER TABLE workflow_executions
        DROP COLUMN IF EXISTS trigger_source_app_id,
        DROP COLUMN IF EXISTS finished_at,
        DROP COLUMN IF EXISTS started_at,
        DROP COLUMN IF EXISTS trigger_type,
        DROP COLUMN IF EXISTS app_id,
        DROP COLUMN IF EXISTS organization_id,
        DROP COLUMN IF EXISTS environment_id,
        DROP COLUMN IF EXISTS schedule_id,
        DROP COLUMN IF EXISTS parent_node_id,
        DROP COLUMN IF EXISTS parent_execution_id
    `);
  }
}
