import { InstanceSettings } from '@entities/instance_settings.entity';
import { MigrationInterface, QueryRunner } from 'typeorm';
import {
  INSTANCE_SETTINGS_ENCRYPTION_KEY,
  INSTANCE_SETTINGS_TYPE,
  INSTANCE_SYSTEM_SETTINGS,
} from '@modules/instance-settings/constants';
import { NestFactory } from '@nestjs/core';
import { getImportPath, TOOLJET_EDITIONS } from '@modules/app/constants';
import { getTooljetEdition } from '@helpers/utils.helper';
import { AppModule } from '@modules/app/module';

export class addSMTPConfigsToTable1716551121164 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const edition: TOOLJET_EDITIONS = getTooljetEdition() as TOOLJET_EDITIONS;
    const nestApp = await NestFactory.createApplicationContext(await AppModule.register({ IS_GET_CONTEXT: true }));
    const { EncryptionService } = await import(`${await getImportPath(true, edition)}/encryption/service`);
    const encryptionService = nestApp.get(EncryptionService);
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
