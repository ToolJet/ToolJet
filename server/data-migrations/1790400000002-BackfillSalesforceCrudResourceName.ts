import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The Salesforce plugin used to ignore `resource_name` and always ran CRUD queries on Account.
 * The field is now honoured, so every existing CRUD query is set to Account explicitly to keep
 * returning exactly what it returned before. Runs once; values users set afterwards are not touched.
 * (Blank values also fall back to Account inside the plugin, for queries created or imported later.)
 */
export class BackfillSalesforceCrudResourceName1790400000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const [{ count }] = await queryRunner.query(`
      SELECT COUNT(*)::int AS count
      FROM data_queries dq
      JOIN data_sources ds ON ds.id = dq.data_source_id
      WHERE ds.kind = 'salesforce'
        AND dq."options"::jsonb->>'operation' = 'crud'
        AND COALESCE(TRIM(dq."options"::jsonb->>'resource_name'), '') NOT IN ('', 'Account')
    `);
    if (count > 0) {
      console.log(`Salesforce CRUD queries with a non-Account resource_name being reset to Account: ${count}`);
    }

    await queryRunner.query(`
      UPDATE data_queries dq
      SET "options" = (dq."options"::jsonb || jsonb_build_object('resource_name', 'Account'))::json
      FROM data_sources ds
      WHERE ds.id = dq.data_source_id
        AND ds.kind = 'salesforce'
        AND dq."options"::jsonb->>'operation' = 'crud'
        AND COALESCE(dq."options"::jsonb->>'resource_name', '') <> 'Account'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
