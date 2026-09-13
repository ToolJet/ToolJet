import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@modules/app/module';
import { getTooljetEdition } from '@helpers/utils.helper';
import { getImportPath } from '@modules/app/constants';
import { TOOLJET_EDITIONS } from '@modules/app/constants';
import { dbTransactionWrap } from '@helpers/database.helper';

const BATCH_SIZE = 1000;

export class MoveOauthTokens1785950000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const edition: TOOLJET_EDITIONS = getTooljetEdition() as TOOLJET_EDITIONS;
    const nestApp = await NestFactory.createApplicationContext(await AppModule.register({ IS_GET_CONTEXT: true }));

    const { CredentialsService } = await import(
      `${await getImportPath(true, edition)}/encryption/services/credentials.service`
    );
    const { EncryptionService } = await import(`${await getImportPath(true, edition)}/encryption/service`);
    const credentialsService = nestApp.get(CredentialsService);
    const encryptionService = nestApp.get(EncryptionService);

    const manager = queryRunner.manager;
    let lastId: string | null = null;
    let totalProcessed = 0;
    let batchNum = 0;

    // Only kinds that ever go through an OAuth flow. Filtering by kind (not just by the shape
    // of the `access_token`/`tokenData` fields) matters: intercom's manifest has a manually-typed
    // `access_token` field (a personal access token, no OAuth involved) that is shaped identically
    // to an OAuth access_token ({credential_id, encrypted:true}) — without this filter, that field
    // gets swept up and mis-migrated into the OAuth token table.
    const OAUTH_CAPABLE_KINDS = [
      'restapi',
      'openapi',
      'graphql',
      'googlesheets',
      'googlesheetsv2',
      'slack',
      'zendesk',
      'servicenow',
      'salesforce',
      'googlecalendar',
      'snowflake',
      'microsoft_graph',
      'hubspot',
      'xero',
      'bigquery',
      'databricks',
      'asana',
      'gmail',
      'grpcv2',
      'quickbooks',
      'sharepoint',
    ];

    while (true) {
      // ── Fetch next batch via UUID cursor ──────────────────────────────────
      const batch: Array<{ id: string; options: Record<string, any> }> = await queryRunner.query(
        `
          SELECT dso.id, dso.options
          FROM   data_source_version_options dso
          JOIN   data_source_versions dsv ON dsv.id = dso.data_source_version_id
          JOIN   data_sources ds ON ds.id = dsv.data_source_id
          WHERE  ($1::uuid IS NULL OR dso.id > $1::uuid)
          AND    ds.kind = ANY($3::text[])
          AND    (
                   -- multi-auth ON: has tokenData array
                   (dso.options->'multiple_auth_enabled'->>'value')::boolean = true
                   AND dso.options->'tokenData'->>'value' IS NOT NULL

                   OR

                   -- multi-auth OFF: has credential_id on access_token
                   dso.options->'access_token'->>'credential_id' IS NOT NULL

                   OR

                   -- multi-auth OFF but stored as plaintext tokenData object instead of an
                   -- access_token.credential_id — restapi/graphql/openapi/servicenow never
                   -- implement accessDetailsFrom, so their OAuth connect always went through
                   -- the generic authorizeOauth2 branch, which stored the token as a plaintext
                   -- {key:'tokenData', value:{access_token,refresh_token}, encrypted:false}
                   -- regardless of multi-auth — the single-auth case was previously missed here.
                   (
                     COALESCE((dso.options->'multiple_auth_enabled'->>'value')::boolean, false) = false
                     AND jsonb_typeof(dso.options->'tokenData'->'value') = 'object'
                   )
                 )
          ORDER  BY dso.id
          LIMIT  $2
          `,
        [lastId, BATCH_SIZE, OAUTH_CAPABLE_KINDS]
      );

      if (!batch.length) break;
      batchNum++;

      for (const row of batch) {
        const options = row.options ?? {};
        const multiAuthEnabled = options?.multiple_auth_enabled?.value === true;
        const tokenDataValue = options?.tokenData?.value;

        const hasArrayTokenData = multiAuthEnabled && Array.isArray(tokenDataValue) && tokenDataValue.length > 0;
        const hasCredentialAccessToken = !multiAuthEnabled && options?.access_token?.credential_id != null;
        const hasPlaintextSingleAuthTokenData =
          !multiAuthEnabled &&
          tokenDataValue != null &&
          typeof tokenDataValue === 'object' &&
          !Array.isArray(tokenDataValue);

        // ── Skip rows with no token data worth migrating ───────────────────
        const hasTokenData = hasArrayTokenData || hasCredentialAccessToken || hasPlaintextSingleAuthTokenData;

        if (!hasTokenData) continue;

        await dbTransactionWrap(async (manager: EntityManager) => {
          const credentialIdsToDelete: string[] = [];

          if (hasArrayTokenData) {
            // ── Multi-auth ON: one row per user entry in tokenData ─────────
            // Tokens are plaintext in the JSON — encrypt and store directly
            const tokenDataArr: Array<{
              user_id: string;
              access_token: string;
              refresh_token: string;
            }> = options.tokenData.value;

            // Deduplicate by user_id — last entry wins for corrupt data
            const deduplicatedTokenData = tokenDataArr.reduce(
              (acc, entry) => {
                acc[entry.user_id] = entry;
                return acc;
              },
              {} as Record<string, (typeof tokenDataArr)[0]>
            );

            for (const tokenEntry of Object.values(deduplicatedTokenData)) {
              if (!tokenEntry.access_token && !tokenEntry.refresh_token) continue;

              const encryptedAccessToken = tokenEntry.access_token
                ? await encryptionService.encryptColumnValue('credentials', 'value', tokenEntry.access_token)
                : null;
              const encryptedRefreshToken = tokenEntry.refresh_token
                ? await encryptionService.encryptColumnValue('credentials', 'value', tokenEntry.refresh_token)
                : null;

              // INSERT OR REPLACE — if duplicate exists, delete and re-insert with latest token
              await manager.query(
                `
                DELETE FROM datasource_user_token_data
                WHERE  data_source_version_option_id = $1::uuid
                AND    user_id = $2::uuid
                `,
                [row.id, tokenEntry.user_id]
              );

              await manager.query(
                `
                INSERT INTO datasource_user_token_data
                  (id, user_id, data_source_version_option_id, auth_token, refresh_token, more_details, created_at, updated_at)
                VALUES
                  (gen_random_uuid(), $1::uuid, $2::uuid, $3, $4, '{}', now(), now())
                `,
                [tokenEntry.user_id, row.id, encryptedAccessToken, encryptedRefreshToken]
              );
            }

            delete options.tokenData;
          } else if (hasPlaintextSingleAuthTokenData) {
            // ── Multi-auth OFF, plaintext tokenData: restapi/graphql/openapi/servicenow ──
            // Tokens here were never encrypted at all (stored as a plain {access_token,
            // refresh_token} object with encrypted:false) — encrypt on the way into the new table.
            const tokenObj: { access_token?: string; refresh_token?: string } = tokenDataValue;
            const accessToken = tokenObj.access_token || null;
            const refreshToken = tokenObj.refresh_token || null;

            const encryptedAccessToken = accessToken
              ? await encryptionService.encryptColumnValue('credentials', 'value', accessToken)
              : null;
            const encryptedRefreshToken = refreshToken
              ? await encryptionService.encryptColumnValue('credentials', 'value', refreshToken)
              : null;

            await manager.query(
              `
              INSERT INTO datasource_user_token_data
                (id, user_id, data_source_version_option_id, auth_token, refresh_token, more_details, created_at, updated_at)
              VALUES
                (gen_random_uuid(), NULL, $1::uuid, $2, $3, '{}', now(), now())
              `,
              [row.id, encryptedAccessToken, encryptedRefreshToken]
            );

            delete options.tokenData;
          } else {
            // ── Multi-auth OFF: decrypt from credentials table, re-encrypt, store ──
            const accessTokenOption = options?.access_token;
            const refreshTokenOption = options?.refresh_token;

            let accessToken: string | null = null;
            let refreshToken: string | null = null;

            if (accessTokenOption?.credential_id) {
              accessToken = await credentialsService.getValue(accessTokenOption.credential_id, manager);
              credentialIdsToDelete.push(accessTokenOption.credential_id);
            }

            if (refreshTokenOption?.credential_id) {
              refreshToken = await credentialsService.getValue(refreshTokenOption.credential_id, manager);
              credentialIdsToDelete.push(refreshTokenOption.credential_id);
            }

            const encryptedAccessToken = accessToken
              ? await encryptionService.encryptColumnValue('credentials', 'value', accessToken)
              : null;
            const encryptedRefreshToken = refreshToken
              ? await encryptionService.encryptColumnValue('credentials', 'value', refreshToken)
              : null;

            await manager.query(
              `
              INSERT INTO datasource_user_token_data
                (id, user_id, data_source_version_option_id, auth_token, refresh_token, more_details, created_at, updated_at)
              VALUES
                (gen_random_uuid(), NULL, $1::uuid, $2, $3, '{}', now(), now())
              `,
              [row.id, encryptedAccessToken, encryptedRefreshToken]
            );

            // Clear inline token refs from options JSON
            if (options.access_token) options.access_token = { encrypted: false };
            if (options.refresh_token) options.refresh_token = { encrypted: false };
            delete options.token_data;

            // ── Delete source credential rows now that tokens are migrated ─
            if (credentialIdsToDelete.length) {
              await manager.query(
                `
                DELETE FROM credentials
                WHERE id = ANY($1::uuid[])
                `,
                [credentialIdsToDelete]
              );
            }
          }

          // ── Update options JSON (strip migrated token fields) ──────────────
          await manager.query(
            `
            UPDATE data_source_version_options
            SET    options    = $1::json,
                   updated_at = now()
            WHERE  id         = $2::uuid
            `,
            [JSON.stringify(options), row.id]
          );
        }, manager);

        totalProcessed++;
      }

      console.log(`Batch ${batchNum} done — processed ${totalProcessed} rows so far`);

      lastId = batch[batch.length - 1].id;
      if (batch.length < BATCH_SIZE) break;
    }

    console.log(`Migration complete. Total rows migrated: ${totalProcessed}`);
    await nestApp.close();
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Not reversible — credential rows have been deleted.
    // Restore from backup if rollback is needed.
    throw new Error('MoveOauthTokens is not reversible. Restore from backup.');
  }
}
