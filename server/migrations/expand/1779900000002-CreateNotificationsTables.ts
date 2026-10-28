import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateNotificationsTables1779900000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
          CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error');
        END IF;
      END $$;
    `);

    await queryRunner.createTable(
      new Table({
        name: 'notifications',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'organization_id', type: 'uuid', isNullable: false },
          { name: 'type', type: 'notification_type', isNullable: false },
          { name: 'title', type: 'character varying', isNullable: false },
          { name: 'body', type: 'text', isNullable: true },
          { name: 'link', type: 'character varying', isNullable: true },
          { name: 'metadata', type: 'jsonb', isNullable: true },
          { name: 'created_at', type: 'timestamptz', default: 'now()', isNullable: false },
        ],
      }),
      true
    );
    await queryRunner.createIndex('notifications', new TableIndex({ name: 'idx_notifications_org', columnNames: ['organization_id'] }));
    await queryRunner.createIndex('notifications', new TableIndex({ name: 'idx_notifications_created_at', columnNames: ['created_at'] }));

    await queryRunner.createTable(
      new Table({
        name: 'notification_recipients',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'notification_id', type: 'uuid', isNullable: false },
          { name: 'user_id', type: 'uuid', isNullable: false },
          { name: 'read_at', type: 'timestamptz', isNullable: true },
          { name: 'created_at', type: 'timestamptz', default: 'now()', isNullable: false },
        ],
        uniques: [{ name: 'uq_recipient_notification_user', columnNames: ['notification_id', 'user_id'] }],
      }),
      true
    );
    await queryRunner.createForeignKey(
      'notification_recipients',
      new TableForeignKey({
        columnNames: ['notification_id'],
        referencedTableName: 'notifications',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );
    await queryRunner.createIndex(
      'notification_recipients',
      new TableIndex({ name: 'idx_recipient_user_created', columnNames: ['user_id', 'created_at'] })
    );
    // partial index for unread lookups — Table API has no WHERE clause
    await queryRunner.query(
      `CREATE INDEX "idx_recipient_unread" ON "notification_recipients" ("user_id") WHERE "read_at" IS NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_recipient_unread"`);
    await queryRunner.dropTable('notification_recipients', true);
    await queryRunner.dropTable('notifications', true);
    await queryRunner.query(`DROP TYPE IF EXISTS notification_type`);
  }
}
