import { MigrationInterface, QueryRunner } from 'typeorm';
import {
  INSTANCE_CONFIGS_DATA_TYPES,
  INSTANCE_SETTINGS_TYPE,
} from '@modules/instance-settings/constants';
import { INSTANCE_SYSTEM_SETTINGS } from '@modules/instance-settings/constants';

export class AddGranularDomainSettings1765958549099 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
      INSERT INTO instance_settings (key, label, data_type, value, type)
      VALUES
        (
          'PASSWORD_ALLOWED_DOMAINS',
          'Password Allowed Domains',
          '${INSTANCE_CONFIGS_DATA_TYPES.TEXT}',
          COALESCE(
            (
              SELECT value
              FROM instance_settings
              WHERE key = '${INSTANCE_SYSTEM_SETTINGS.ALLOWED_DOMAINS}'
              LIMIT 1
            ),
            ''
          ),
          '${INSTANCE_SETTINGS_TYPE.SYSTEM}'
        ),
        (
          'PASSWORD_RESTRICTED_DOMAINS',
          'Password Restricted Domains',
          '${INSTANCE_CONFIGS_DATA_TYPES.TEXT}',
          '',
          '${INSTANCE_SETTINGS_TYPE.SYSTEM}'
        )
      ON CONFLICT (key) DO NOTHING;
      `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
      DELETE FROM instance_settings
      WHERE key IN ('PASSWORD_ALLOWED_DOMAINS', 'PASSWORD_RESTRICTED_DOMAINS');
      `,
    );
  }
}
