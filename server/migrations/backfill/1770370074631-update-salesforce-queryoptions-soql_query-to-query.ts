import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSalesforceQueryoptionsSoqlQueryToQuery1770370074631 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        UPDATE data_queries
        SET "options" = (
            CASE 
                WHEN "options"::jsonb ? 'query' THEN
                    ("options"::jsonb - 'query' || jsonb_build_object('soql_query', "options"::jsonb->'query'))::json
                ELSE
                    "options"
            END
        )
        FROM data_sources ds
        WHERE ds.id = data_source_id 
        AND ds.kind = 'salesforce'
        AND "options"::jsonb ? 'query';`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
