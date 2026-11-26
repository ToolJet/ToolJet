import { MigrationInterface, QueryRunner } from 'typeorm';

/** Usage analytics tables; created in every edition, written only by EE/Cloud. Rules: app-usage-analytics/AGENTS.md. */
export class CreateAppUsageAnalyticsTables1794700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS app_usage_daily (
        workspace_id   UUID        NOT NULL,
        app_id         UUID        NOT NULL,
        user_id        UUID        NOT NULL,
        day            DATE        NOT NULL,
        last_opened_at TIMESTAMPTZ NOT NULL,
        CONSTRAINT app_usage_daily_pkey PRIMARY KEY (app_id, user_id, day),
        CONSTRAINT fk_app_usage_daily_workspace FOREIGN KEY (workspace_id) REFERENCES organizations(id) ON DELETE CASCADE,
        CONSTRAINT fk_app_usage_daily_app FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE,
        CONSTRAINT fk_app_usage_daily_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) PARTITION BY RANGE (day)
    `);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS app_usage_daily_default PARTITION OF app_usage_daily DEFAULT`);

    // Current month and the next two. Names: app_usage_daily_pYYYYMM.
    await queryRunner.query(`
      DO $$
      DECLARE
        m DATE;
      BEGIN
        FOR i IN 0..2 LOOP
          m := (date_trunc('month', now() AT TIME ZONE 'UTC') + make_interval(months => i))::date;
          EXECUTE format(
            'CREATE TABLE IF NOT EXISTS %I PARTITION OF app_usage_daily FOR VALUES FROM (%L) TO (%L)',
            'app_usage_daily_p' || to_char(m, 'YYYYMM'), m, (m + interval '1 month')::date
          );
        END LOOP;
      END $$
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_app_usage_daily_workspace_day ON app_usage_daily (workspace_id, day)`
    );
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_app_usage_daily_app_day ON app_usage_daily (app_id, day)`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS app_user_first_seen (
        workspace_id    UUID        NOT NULL,
        app_id          UUID        NOT NULL,
        user_id         UUID        NOT NULL,
        first_opened_at TIMESTAMPTZ NOT NULL,
        last_opened_at  TIMESTAMPTZ NOT NULL,
        CONSTRAINT app_user_first_seen_pkey PRIMARY KEY (app_id, user_id),
        CONSTRAINT fk_app_user_first_seen_workspace FOREIGN KEY (workspace_id) REFERENCES organizations(id) ON DELETE CASCADE,
        CONSTRAINT fk_app_user_first_seen_app FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE,
        CONSTRAINT fk_app_user_first_seen_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_app_user_first_seen_app_last ON app_user_first_seen (app_id, last_opened_at DESC)`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_app_user_first_seen_workspace ON app_user_first_seen (workspace_id)`
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS workspace_user_first_seen (
        workspace_id    UUID        NOT NULL,
        user_id         UUID        NOT NULL,
        first_opened_at TIMESTAMPTZ NOT NULL,
        CONSTRAINT workspace_user_first_seen_pkey PRIMARY KEY (workspace_id, user_id),
        CONSTRAINT fk_workspace_user_first_seen_workspace FOREIGN KEY (workspace_id) REFERENCES organizations(id) ON DELETE CASCADE,
        CONSTRAINT fk_workspace_user_first_seen_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS workspace_user_first_seen`);
    await queryRunner.query(`DROP TABLE IF EXISTS app_user_first_seen`);
    // Drops every partition with it.
    await queryRunner.query(`DROP TABLE IF EXISTS app_usage_daily`);
  }
}
