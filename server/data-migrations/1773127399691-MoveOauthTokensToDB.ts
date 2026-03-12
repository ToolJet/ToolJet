import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@modules/app/module';
import { getTooljetEdition } from '@helpers/utils.helper';
import { getImportPath } from '@modules/app/constants';
import { TOOLJET_EDITIONS } from '@modules/app/constants';
import { dbTransactionWrap } from '@helpers/database.helper';

const BATCH_SIZE = 1000;

export class MoveOauthTokensToDB1773127399691 implements MigrationInterface {
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

    while (true) {
      // ── Fetch next batch via UUID cursor ──────────────────────────────────
      const batch: Array<{ id: string; options: Record<string, any> }> = await queryRunner.query(
        `
          SELECT id, options
          FROM   data_source_options
          WHERE  ($1::uuid IS NULL OR id > $1::uuid)
          AND    (
                   -- multi-auth ON: has tokenData array
                   (options->'multiple_auth_enabled'->>'value')::boolean = true
                   AND options->'tokenData'->>'value' IS NOT NULL

                   OR

                   -- multi-auth OFF: has credential_id on access_token
                   (options->'multiple_auth_enabled'->>'value')::boolean = false
                   AND options->'access_token'->>'credential_id' IS NOT NULL
                 )
          ORDER  BY id
          LIMIT  $2
          `,
        [lastId, BATCH_SIZE]
      );

      if (!batch.length) break;
      batchNum++;

      for (const row of batch) {
        const options = row.options ?? {};
        const multiAuthEnabled = options?.multiple_auth_enabled?.value === true;
        console.log('options', options.multiple_auth_enabled, multiAuthEnabled);
        console.log(options?.tokenData, 'tokenData');

        // ── Skip rows with no token data worth migrating ───────────────────
        const hasTokenData = multiAuthEnabled
          ? Array.isArray(options?.tokenData?.value) && options.tokenData.value.length > 0
          : options?.access_token?.credential_id != null;

        if (!hasTokenData) continue;

        await dbTransactionWrap(async (manager: EntityManager) => {
          const credentialIdsToDelete: string[] = [];

          if (multiAuthEnabled) {
            // ── Multi-auth ON: one row per user entry in tokenData ─────────
            // Tokens are plaintext in the JSON — encrypt and store directly
            const tokenDataArr: Array<{
              user_id: string;
              access_token: string;
              refresh_token: string;
            }> = options.tokenData.value;

            for (const tokenEntry of tokenDataArr) {
              if (!tokenEntry.access_token && !tokenEntry.refresh_token) continue;

              const encryptedAccessToken = tokenEntry.access_token
                ? await encryptionService.encryptColumnValue('credentials', 'value', tokenEntry.access_token)
                : null;
              const encryptedRefreshToken = tokenEntry.refresh_token
                ? await encryptionService.encryptColumnValue('credentials', 'value', tokenEntry.refresh_token)
                : null;

              await manager.query(
                `
                INSERT INTO datasource_user_token_data
                  (id, user_id, data_source_option_id, auth_token, refresh_token, more_details, created_at, updated_at)
                VALUES
                  (gen_random_uuid(), $1::uuid, $2::uuid, $3, $4, '{}', now(), now())
                `,
                [tokenEntry.user_id, row.id, encryptedAccessToken, encryptedRefreshToken]
              );
            }

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
                (id, user_id, data_source_option_id, auth_token, refresh_token, more_details, created_at, updated_at)
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
            UPDATE data_source_options
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
    throw new Error('MigrateDatasourceTokenData is not reversible. Restore from backup.');
  }
}
