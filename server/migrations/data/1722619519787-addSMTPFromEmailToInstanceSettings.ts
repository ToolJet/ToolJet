import { InstanceSettings } from '@entities/instance_settings.entity';
import { INSTANCE_SETTINGS_TYPE, INSTANCE_SYSTEM_SETTINGS } from '@modules/instance-settings/constants';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSMTPFromEmailToInstanceSettings1722619519787 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;

    const smtpConfigSettings = {
      value: process.env?.DEFAULT_FROM_EMAIL || 'hello@tooljet.io',
      key: INSTANCE_SYSTEM_SETTINGS.SMTP_FROM_EMAIL,
      type: INSTANCE_SETTINGS_TYPE.SYSTEM,
      dataType: 'text',
      label: 'default from email',
    };
    await entityManager.insert(InstanceSettings, smtpConfigSettings);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
