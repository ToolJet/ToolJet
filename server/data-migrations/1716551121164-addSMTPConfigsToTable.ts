import { InstanceSettings } from '@entities/instance_settings.entity';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { EncryptionService } from '@modules/encryption/service';
import {
  INSTANCE_SETTINGS_ENCRYPTION_KEY,
  INSTANCE_SETTINGS_TYPE,
  INSTANCE_SYSTEM_SETTINGS,
} from '@modules/instance-settings/constants';

export class addSMTPConfigsToTable1716551121164 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const encryptionService = new EncryptionService();
    const entityManager = queryRunner.manager;

    const smtpConfigSettings = [
      {
        value: process.env?.SMTP_DOMAIN ? 'true' : 'false',
        key: INSTANCE_SYSTEM_SETTINGS.SMTP_ENABLED,
        type: INSTANCE_SETTINGS_TYPE.SYSTEM,
        dataType: 'boolean',
        label: 'SMTP ENABLED',
      },
      {
        value: process.env?.SMTP_DOMAIN || '',
        key: INSTANCE_SYSTEM_SETTINGS.SMTP_DOMAIN,
        type: INSTANCE_SETTINGS_TYPE.SYSTEM,
        dataType: 'text',
        label: 'Host',
      },
      {
        value: process.env?.SMTP_PORT || '',
        key: INSTANCE_SYSTEM_SETTINGS.SMTP_PORT,
        type: INSTANCE_SETTINGS_TYPE.SYSTEM,
        dataType: 'text',
        label: 'Port',
      },
      {
        value: process.env?.SMTP_USERNAME || '',
        key: INSTANCE_SYSTEM_SETTINGS.SMTP_USERNAME,
        type: INSTANCE_SETTINGS_TYPE.SYSTEM,
        dataType: 'text',
        label: 'User',
      },
      {
        value: await encryptionService.encryptColumnValue(
          INSTANCE_SETTINGS_ENCRYPTION_KEY,
          INSTANCE_SYSTEM_SETTINGS.SMTP_PASSWORD,
          process.env?.SMTP_PASSWORD || ''
        ),
        key: INSTANCE_SYSTEM_SETTINGS.SMTP_PASSWORD,
        type: INSTANCE_SETTINGS_TYPE.SYSTEM,
        dataType: 'password',
        label: 'Password',
      },
    ];

    for (const setting of smtpConfigSettings) {
      await entityManager.insert(InstanceSettings, setting);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
