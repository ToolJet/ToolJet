import { MigrationInterface, QueryRunner } from 'typeorm';
import { getTooljetEdition } from '@helpers/utils.helper';
import { TOOLJET_EDITIONS } from '@modules/app/constants';

const MIGRATION_NAME = 'BackfillCloudPlanPageLimitsAndPublicApp1790700000000';
const PAID_PLANS = ['starter', 'basicplus', 'pro', 'team'];
const PAGE_LIMIT = 20;

/**
 * Cloud per-org licenses are read from `organization_license.terms`, a snapshot of the plan constant taken when
 * the subscription was created or last renewed (organization-payments `UpdateOrInsertCloudLicense`). Changing
 * `*_PLAN_TERMS_CLOUD` only affects newly built rows, so existing paid orgs keep stale terms until their next
 * invoice. Align them now:
 *  - page and page-group limit: 20 for starter, basicplus, pro and team. Rows with no limit, an empty limit
 *    (unlimited, the old Team value) or a lower numeric limit (the old 5) are set to 20. A numeric limit above 20
 *    is a custom grant and is left alone.
 *  - public apps: Team only (`app.features.publicApp`). Rows created before the flag existed have no key, and rows
 *    written while it was named `appPublic` hold the wrong key; the getter only accepts `publicApp === true`.
 *
 * Only Cloud has per-org rows. Self-hosted licenses are signed keys with no stored terms to rewrite.
 * Free orgs have no row and read the constant live, so they need nothing.
 * Rows with a null `plan` fall back to `terms.plan.name`, the same fallback LicenseBase uses.
 */
export class BackfillCloudPlanPageLimitsAndPublicApp1790700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (getTooljetEdition() !== TOOLJET_EDITIONS.Cloud) {
      console.log(`${MIGRATION_NAME}: [SKIP] edition other than Cloud`);
      return;
    }

    const manager = queryRunner.manager;

    const [{ count }] = await manager.query(
      `SELECT COUNT(*)::int AS count FROM organization_license WHERE LOWER(COALESCE(plan, terms::jsonb #>> '{plan,name}')) = ANY($1::text[])`,
      [PAID_PLANS]
    );
    console.log(`${MIGRATION_NAME}: [START] backfilling terms for paid cloud licenses: ${count}`);

    const pageLimitResult = await manager.query(
      `
      UPDATE organization_license
      SET terms = (
            terms::jsonb || jsonb_build_object(
              'app', COALESCE(terms::jsonb -> 'app', '{}'::jsonb) || jsonb_build_object(
                'pages', COALESCE(terms::jsonb #> '{app,pages}', '{}'::jsonb) || jsonb_build_object(
                  'count', to_jsonb($2::int),
                  'groupCount', to_jsonb($2::int)
                )
              )
            )
          )::json,
          updated_at = now()
      WHERE LOWER(COALESCE(plan, terms::jsonb #>> '{plan,name}')) = ANY($1::text[])
        AND (
          jsonb_typeof(terms::jsonb #> '{app,pages,count}') IS DISTINCT FROM 'number'
          OR (terms::jsonb #>> '{app,pages,count}')::numeric < $2
          OR jsonb_typeof(terms::jsonb #> '{app,pages,groupCount}') IS DISTINCT FROM 'number'
          OR (terms::jsonb #>> '{app,pages,groupCount}')::numeric < $2
        )
      `,
      [PAID_PLANS, PAGE_LIMIT]
    );

    const publicAppResult = await manager.query(
      `
      UPDATE organization_license
      SET terms = (
            terms::jsonb || jsonb_build_object(
              'app', COALESCE(terms::jsonb -> 'app', '{}'::jsonb) || jsonb_build_object(
                'features', COALESCE(terms::jsonb #> '{app,features}', '{}'::jsonb) || jsonb_build_object(
                  'publicApp', true
                )
              )
            )
          )::json,
          updated_at = now()
      WHERE LOWER(COALESCE(plan, terms::jsonb #>> '{plan,name}')) = 'team'
        AND COALESCE(terms::jsonb #>> '{app,features,publicApp}', '') <> 'true'
      `
    );

    // pg returns [rows, rowCount] for UPDATE through TypeORM's query()
    console.log(`${MIGRATION_NAME}: [SUCCESS] page limits updated on ${pageLimitResult?.[1]} row(s)`);
    console.log(`${MIGRATION_NAME}: [SUCCESS] Team publicApp enabled on ${publicAppResult?.[1]} row(s)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Previous per-row values were not recorded, so this cannot be reversed.
  }
}
