import { MigrationInterface, QueryRunner } from 'typeorm';
import {
  INSTANCE_SETTINGS_ENCRYPTION_KEY,
  INSTANCE_SYSTEM_SETTINGS,
} from '@modules/instance-settings/constants';
import { NestFactory } from '@nestjs/core';
import { getImportPath, TOOLJET_EDITIONS } from '@modules/app/constants';
import { getTooljetEdition } from '@helpers/utils.helper';
import { AppModule } from '@modules/app/module';

export class CreateSslConfigurationTable1768818758582 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const edition: TOOLJET_EDITIONS = getTooljetEdition() as TOOLJET_EDITIONS;
    const nestApp = await NestFactory.createApplicationContext(
      await AppModule.register({ IS_GET_CONTEXT: true })
    );
    const { EncryptionService } = await import(`${await getImportPath(true, edition)}/encryption/service`);
    const encryptionService = nestApp.get(EncryptionService);

    const sslConfigKeys = [
      { key: INSTANCE_SYSTEM_SETTINGS.SSL_ENABLED, value: 'false' },
      { key: INSTANCE_SYSTEM_SETTINGS.SSL_EMAIL, value: '' },
      { key: INSTANCE_SYSTEM_SETTINGS.SSL_STAGING, value: 'false' },
      { key: INSTANCE_SYSTEM_SETTINGS.SSL_DOMAIN, value: '' },
      {
        key: INSTANCE_SYSTEM_SETTINGS.SSL_FULLCHAIN_PEM,
        value: await encryptionService.encryptColumnValue(
          INSTANCE_SETTINGS_ENCRYPTION_KEY,
          INSTANCE_SYSTEM_SETTINGS.SSL_FULLCHAIN_PEM,
          ''
        ),
      },
      {
        key: INSTANCE_SYSTEM_SETTINGS.SSL_PRIVKEY_PEM,
        value: await encryptionService.encryptColumnValue(
          INSTANCE_SETTINGS_ENCRYPTION_KEY,
          INSTANCE_SYSTEM_SETTINGS.SSL_PRIVKEY_PEM,
          ''
        ),
      },
      {
        key: INSTANCE_SYSTEM_SETTINGS.SSL_CERT_PEM,
        value: await encryptionService.encryptColumnValue(
          INSTANCE_SETTINGS_ENCRYPTION_KEY,
          INSTANCE_SYSTEM_SETTINGS.SSL_CERT_PEM,
          ''
        ),
      },
      {
        key: INSTANCE_SYSTEM_SETTINGS.SSL_CHAIN_PEM,
        value: await encryptionService.encryptColumnValue(
          INSTANCE_SETTINGS_ENCRYPTION_KEY,
          INSTANCE_SYSTEM_SETTINGS.SSL_CHAIN_PEM,
          ''
        ),
      },
      { key: INSTANCE_SYSTEM_SETTINGS.SSL_ACQUIRED_AT, value: '' },
      { key: INSTANCE_SYSTEM_SETTINGS.SSL_EXPIRES_AT, value: '' },
    ];

    for (const setting of sslConfigKeys) {
      await queryRunner.query(
        `INSERT INTO instance_settings (key, value) VALUES ($1, $2)`,
        [setting.key, setting.value]
      );
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
