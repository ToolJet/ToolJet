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

export class AddSslConfigsToTable1768818758582 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const edition: TOOLJET_EDITIONS = getTooljetEdition() as TOOLJET_EDITIONS;
    const nestApp = await NestFactory.createApplicationContext(
      await AppModule.register({ IS_GET_CONTEXT: true })
    );
    const { EncryptionService } = await import(`${await getImportPath(true, edition)}/encryption/service`);
    const encryptionService = nestApp.get(EncryptionService);
    const entityManager = queryRunner.manager;

    const sslConfigSettings = [
      {
        value: 'false',
        key: INSTANCE_SYSTEM_SETTINGS.SSL_ENABLED,
        type: INSTANCE_SETTINGS_TYPE.SYSTEM,
        dataType: 'boolean',
        label: 'SSL Enabled',
      },
      {
        value: '',
        key: INSTANCE_SYSTEM_SETTINGS.SSL_EMAIL,
        type: INSTANCE_SETTINGS_TYPE.SYSTEM,
        dataType: 'text',
        label: 'SSL Email',
      },
      {
        value: 'false',
        key: INSTANCE_SYSTEM_SETTINGS.SSL_STAGING,
        type: INSTANCE_SETTINGS_TYPE.SYSTEM,
        dataType: 'boolean',
        label: 'SSL Staging',
      },
      {
        value: '',
        key: INSTANCE_SYSTEM_SETTINGS.SSL_DOMAIN,
        type: INSTANCE_SETTINGS_TYPE.SYSTEM,
        dataType: 'text',
        label: 'SSL Domain',
      },
      {
        value: await encryptionService.encryptColumnValue(
          INSTANCE_SETTINGS_ENCRYPTION_KEY,
          INSTANCE_SYSTEM_SETTINGS.SSL_FULLCHAIN_PEM,
          ''
        ),
        key: INSTANCE_SYSTEM_SETTINGS.SSL_FULLCHAIN_PEM,
        type: INSTANCE_SETTINGS_TYPE.SYSTEM,
        dataType: 'password',
        label: 'SSL Fullchain PEM',
      },
      {
        value: await encryptionService.encryptColumnValue(
          INSTANCE_SETTINGS_ENCRYPTION_KEY,
          INSTANCE_SYSTEM_SETTINGS.SSL_PRIVKEY_PEM,
          ''
        ),
        key: INSTANCE_SYSTEM_SETTINGS.SSL_PRIVKEY_PEM,
        type: INSTANCE_SETTINGS_TYPE.SYSTEM,
        dataType: 'password',
        label: 'SSL Private Key PEM',
      },
      {
        value: await encryptionService.encryptColumnValue(
          INSTANCE_SETTINGS_ENCRYPTION_KEY,
          INSTANCE_SYSTEM_SETTINGS.SSL_CERT_PEM,
          ''
        ),
        key: INSTANCE_SYSTEM_SETTINGS.SSL_CERT_PEM,
        type: INSTANCE_SETTINGS_TYPE.SYSTEM,
        dataType: 'password',
        label: 'SSL Certificate PEM',
      },
      {
        value: await encryptionService.encryptColumnValue(
          INSTANCE_SETTINGS_ENCRYPTION_KEY,
          INSTANCE_SYSTEM_SETTINGS.SSL_CHAIN_PEM,
          ''
        ),
        key: INSTANCE_SYSTEM_SETTINGS.SSL_CHAIN_PEM,
        type: INSTANCE_SETTINGS_TYPE.SYSTEM,
        dataType: 'password',
        label: 'SSL Chain PEM',
      },
      {
        value: '',
        key: INSTANCE_SYSTEM_SETTINGS.SSL_ACQUIRED_AT,
        type: INSTANCE_SETTINGS_TYPE.SYSTEM,
        dataType: 'text',
        label: 'SSL Acquired At',
      },
      {
        value: '',
        key: INSTANCE_SYSTEM_SETTINGS.SSL_EXPIRES_AT,
        type: INSTANCE_SETTINGS_TYPE.SYSTEM,
        dataType: 'text',
        label: 'SSL Expires At',
      },
    ];

    for (const setting of sslConfigSettings) {
      await entityManager.insert(InstanceSettings, setting);
    }

    await nestApp.close();
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM instance_settings WHERE key IN ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        INSTANCE_SYSTEM_SETTINGS.SSL_ENABLED,
        INSTANCE_SYSTEM_SETTINGS.SSL_EMAIL,
        INSTANCE_SYSTEM_SETTINGS.SSL_STAGING,
        INSTANCE_SYSTEM_SETTINGS.SSL_DOMAIN,
        INSTANCE_SYSTEM_SETTINGS.SSL_FULLCHAIN_PEM,
        INSTANCE_SYSTEM_SETTINGS.SSL_PRIVKEY_PEM,
        INSTANCE_SYSTEM_SETTINGS.SSL_CERT_PEM,
        INSTANCE_SYSTEM_SETTINGS.SSL_CHAIN_PEM,
        INSTANCE_SYSTEM_SETTINGS.SSL_ACQUIRED_AT,
        INSTANCE_SYSTEM_SETTINGS.SSL_EXPIRES_AT,
      ]
    );
  }
}
