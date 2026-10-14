import { MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'ClearSalesforceUserTokensWithoutInstanceUrl1787800000000';

/**
 * Multi-user Salesforce connections need the user's instance_url to run queries. Earlier versions of
 * MoveOauthTokens and the OAuth connect flow saved only the access/refresh tokens, so these rows fail
 * every query with "Instance URL is missing from token data". The instance_url cannot be recovered,
 * so the rows are removed: affected users see the Connect prompt again and reconnecting stores it.
 */
export class ClearSalesforceUserTokensWithoutInstanceUrl1787800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const [, deletedCount] = await queryRunner.query(`
      DELETE FROM datasource_user_token_data dutd
      USING data_source_version_options dsvo
      JOIN data_source_versions dsv ON dsv.id = dsvo.data_source_version_id
      JOIN data_sources ds ON ds.id = dsv.data_source_id
      WHERE dutd.data_source_version_option_id = dsvo.id
        AND ds.kind = 'salesforce'
        AND dutd.user_id IS NOT NULL
        AND COALESCE(dutd.more_details->>'instance_url', '') = ''
    `);

    console.log(`${MIGRATION_NAME}: removed ${deletedCount ?? 0} Salesforce user token rows without instance_url.`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Removed rows could not run queries, so there is nothing to restore
  }
}
