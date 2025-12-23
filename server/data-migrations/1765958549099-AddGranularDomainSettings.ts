import { MigrationInterface, QueryRunner } from 'typeorm';
import {
  INSTANCE_CONFIGS_DATA_TYPES,
  INSTANCE_SETTINGS_TYPE,
} from '@modules/instance-settings/constants';

export class AddGranularDomainSettings1765958549099 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
    const passwordAllowedKey = 'PASSWORD_ALLOWED_DOMAINS';
    const passwordRestrictedKey = 'PASSWORD_RESTRICTED_DOMAINS';

    await queryRunner.query(
      `
      INSERT INTO instance_settings (key, label, data_type, value, type)
      VALUES
        ($1, $2, $3, $4, $5),
        ($6, $7, $8, $9, $10)
      ON CONFLICT (key) DO NOTHING
      `,
      [
        passwordAllowedKey,
        'Password Allowed Domains',
        INSTANCE_CONFIGS_DATA_TYPES.TEXT,
        '',
        INSTANCE_SETTINGS_TYPE.SYSTEM,

        passwordRestrictedKey,
        'Password Restricted Domains',
        INSTANCE_CONFIGS_DATA_TYPES.TEXT,
        '',
        INSTANCE_SETTINGS_TYPE.SYSTEM,
      ],
    );
  }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM instance_settings WHERE key IN ('PASSWORD_ALLOWED_DOMAINS', 'PASSWORD_RESTRICTED_DOMAINS')`);
    }

}
