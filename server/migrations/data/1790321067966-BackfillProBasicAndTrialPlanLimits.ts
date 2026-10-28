import { MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'BackfillProBasicAndTrialPlanLimits1790321067966';
const NEW_APPS_LIMIT = '10';
const NEW_DATABASE_LIMITS = JSON.stringify({ table: 10, row: 500 });

export class BackfillProBasicAndTrialPlanLimits1790321067966 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const [updatedRows]: [{ id: string }[], number] = await queryRunner.query(
      `
      UPDATE organization_license
      SET terms = jsonb_set(
        jsonb_set(terms::jsonb, '{apps}', $1::jsonb, true),
        '{database}', $2::jsonb, true
      )::json
      WHERE (plan IN ('pro', 'basicplus') OR license_type = 'trial')
        AND (
          terms::jsonb->'apps' IS DISTINCT FROM $1::jsonb
          OR terms::jsonb->'database' IS DISTINCT FROM $2::jsonb
        )
      RETURNING id
      `,
      [NEW_APPS_LIMIT, NEW_DATABASE_LIMITS]
    );

    console.log(
      `${MIGRATION_NAME}: [SUCCESS] Updated apps/table/row limits for ${updatedRows.length} pro/basic/trial organization(s)`
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No-op: previous per-org limits were not recorded before the update.
  }
}
