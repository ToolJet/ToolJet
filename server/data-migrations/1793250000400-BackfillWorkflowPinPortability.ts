import { MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'BackfillWorkflowPinPortability1793250000400';

export class BackfillWorkflowPinPortability1793250000400 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log(`${MIGRATION_NAME}: [START] Backfilling workflow pins`);

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
    // A draft's name has no tag on other instances, so draft pins become the default-branch draft sentinel.
    await queryRunner.query(`
      UPDATE data_queries dq
      SET options = jsonb_set(
        dq.options::jsonb,
        '{workflowVersionId}',
        to_jsonb(CASE WHEN av.status = 'DRAFT' AND av.version_type = 'version' THEN '__default_branch_draft__' ELSE av.name END)
      )
      FROM app_versions av, data_sources ds
      WHERE ds.id = dq.data_source_id
        AND ds.kind = 'workflows'
        AND (dq.options::jsonb ->> 'workflowVersionId') = av.id::text
        AND av.name IS NOT NULL;
    `);

    console.log(`${MIGRATION_NAME}: [SUCCESS] Workflow pin backfill finished.`);
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
