import { MigrationInterface, QueryRunner } from 'typeorm';
import { EncryptionService } from '@modules/encryption/service';

const MIGRATION_NAME = 'EncryptLdapClientKeys1795589444000';
// Same table and column names as LoginConfigsUtilService.encryptSecret, so the app can decrypt what this writes.
const ENCRYPTION_TABLE = 'ssoConfigs';
const ENCRYPTION_COLUMN = 'client_key';
const SSL_CERTS_KEYS = ['sslCerts', 'ssl_certs'];

async function isEncrypted(encryption: EncryptionService, value: string): Promise<boolean> {
  try {
    await encryption.decryptColumnValue(ENCRYPTION_TABLE, ENCRYPTION_COLUMN, value);
    return true;
  } catch {
    return false; // Saved as plain text.
  }
}

export class EncryptLdapClientKeys1795589444000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const encryption = new EncryptionService();

    // Read as text and parse here: `json` columns can hold escapes that make ::jsonb fail.
    const rows: { id: string; configs: string }[] = await queryRunner.query(
      `SELECT id, configs::text AS configs FROM sso_configs WHERE sso = 'ldap'`
    );
    console.log(`${MIGRATION_NAME}: [START] LDAP configs to check: ${rows.length}`);

    let updated = 0;
    for (const [index, row] of rows.entries()) {
      const configs = JSON.parse(row.configs);
      let changed = false;

      for (const certsKey of SSL_CERTS_KEYS) {
        const certs = configs?.[certsKey];
        const clientKey = certs?.[ENCRYPTION_COLUMN];
        if (typeof clientKey !== 'string' || !clientKey || (await isEncrypted(encryption, clientKey))) continue;
        certs[ENCRYPTION_COLUMN] = await encryption.encryptColumnValue(ENCRYPTION_TABLE, ENCRYPTION_COLUMN, clientKey);
        changed = true;
      }

      if (changed) {
        await queryRunner.query(`UPDATE sso_configs SET configs = $1::json WHERE id = $2`, [
          JSON.stringify(configs),
          row.id,
        ]);
        updated++;
      }
      const done = index + 1;
      console.log(`${MIGRATION_NAME}: [PROGRESS] ${done}/${rows.length} (${Math.round((done / rows.length) * 100)}%)`);
    }
    console.log(`${MIGRATION_NAME}: [SUCCESS] LDAP client keys encrypted: ${updated}. Finished.`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Development and support-led recovery only: writes the keys back as plain text.
    const encryption = new EncryptionService();
    const rows: { id: string; configs: string }[] = await queryRunner.query(
      `SELECT id, configs::text AS configs FROM sso_configs WHERE sso = 'ldap'`
    );
    for (const row of rows) {
      const configs = JSON.parse(row.configs);
      let changed = false;
      for (const certsKey of SSL_CERTS_KEYS) {
        const certs = configs?.[certsKey];
        const clientKey = certs?.[ENCRYPTION_COLUMN];
        if (typeof clientKey !== 'string' || !clientKey || !(await isEncrypted(encryption, clientKey))) continue;
        certs[ENCRYPTION_COLUMN] = await encryption.decryptColumnValue(ENCRYPTION_TABLE, ENCRYPTION_COLUMN, clientKey);
        changed = true;
      }
      if (changed) {
        await queryRunner.query(`UPDATE sso_configs SET configs = $1::json WHERE id = $2`, [
          JSON.stringify(configs),
          row.id,
        ]);
      }
    }
  }
}
