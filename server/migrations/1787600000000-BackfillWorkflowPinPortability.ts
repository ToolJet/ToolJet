import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillWorkflowPinPortability1787600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // dq.kind isn't a DB column — runtime-only, mirrors dataSource.kind — so join data_sources instead.
    await queryRunner.query(`
      UPDATE data_queries dq
      SET options = jsonb_set(dq.options::jsonb, '{workflowId}', to_jsonb(a.co_relation_id::text))
      FROM apps a, data_sources ds
      WHERE ds.id = dq.data_source_id
        AND ds.kind = 'workflows'
        AND (dq.options::jsonb ->> 'workflowId') = a.id::text;
    `);

    // av.name IS NOT NULL required — to_jsonb(NULL) + strict jsonb_set would wipe the whole options column.
    await queryRunner.query(`
      UPDATE data_queries dq
      SET options = jsonb_set(dq.options::jsonb, '{workflowVersionId}', to_jsonb(av.name))
      FROM app_versions av, data_sources ds
      WHERE ds.id = dq.data_source_id
        AND ds.kind = 'workflows'
        AND (dq.options::jsonb ->> 'workflowVersionId') = av.id::text
        AND av.name IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE data_queries dq
      SET options = jsonb_set(dq.options::jsonb, '{workflowId}', to_jsonb(a.id::text))
      FROM apps a, data_sources ds
      WHERE ds.id = dq.data_source_id
        AND ds.kind = 'workflows'
        AND (dq.options::jsonb ->> 'workflowId') = a.co_relation_id::text;
    `);
  }
}
