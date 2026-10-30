import { MigrationInterface, QueryRunner } from 'typeorm';

export class PopulateManualConnectionTypeForOldPostgresDs1731283187529 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE data_source_options
      SET options = jsonb_set(
          COALESCE(options::jsonb, '{}'),
          '{connection_type}',
          '{"value": "manual", "encrypted": false}'::jsonb
      )
      WHERE data_source_id IN (
          SELECT ds.id
          FROM data_sources ds
          WHERE ds.kind = 'postgresql'
      )
      AND NOT EXISTS (
          SELECT 1
          FROM jsonb_object_keys(COALESCE(options::jsonb, '{}')) AS keys
          WHERE keys = 'connection_type'
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
