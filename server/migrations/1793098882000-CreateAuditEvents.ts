import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditEvents1793098882000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS audit_events (
        id              uuid         NOT NULL,
        created_at      timestamptz  NOT NULL,
        action          varchar(100) NOT NULL,
        outcome         varchar(10)  NOT NULL CHECK (outcome IN ('success', 'denied')),
        workspace_id    uuid,
        actor_type      varchar(10)  NOT NULL CHECK (actor_type IN ('user', 'pat', 'api_key')),
        actor_user_id   uuid,
        actor_token_id  uuid,
        actor           jsonb        NOT NULL,
        target_type     varchar(50)  NOT NULL,
        target_id       varchar(255),
        target          jsonb        NOT NULL,
        changes         jsonb,
        bulk            boolean      NOT NULL DEFAULT false,
        metadata        jsonb,
        request_id      varchar(64)  NOT NULL,
        schema_version  smallint     NOT NULL DEFAULT 1,
        PRIMARY KEY (id, created_at)
      )
    `);

    // Migrations run in one transaction, so no CONCURRENTLY; the table is new and empty.
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS audit_events_workspace_time_idx ON audit_events (workspace_id, created_at DESC, id)`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS audit_events_actor_time_idx ON audit_events (actor_user_id, created_at DESC)`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS audit_events_target_time_idx ON audit_events (target_type, target_id, created_at DESC)`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS audit_events_action_time_idx ON audit_events (action, created_at DESC)`
    );
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS audit_events_request_idx ON audit_events (request_id)`);

    // Append-only: rows can never be updated, and only the retention job may delete them
    // (it sets tooljet.audit_retention = 'on' for its own transaction).
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION audit_events_append_only() RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'DELETE' AND current_setting('tooljet.audit_retention', true) = 'on' THEN
          RETURN OLD;
        END IF;
        RAISE EXCEPTION 'audit_events is append-only (% is not allowed)', TG_OP;
      END;
      $$ LANGUAGE plpgsql
    `);
    await queryRunner.query(`DROP TRIGGER IF EXISTS audit_events_append_only_trigger ON audit_events`);
    await queryRunner.query(`
      CREATE TRIGGER audit_events_append_only_trigger
      BEFORE UPDATE OR DELETE ON audit_events
      FOR EACH ROW EXECUTE FUNCTION audit_events_append_only()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS audit_events_append_only_trigger ON audit_events`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS audit_events_append_only()`);
    await queryRunner.query(`DROP TABLE IF EXISTS audit_events`);
  }
}
