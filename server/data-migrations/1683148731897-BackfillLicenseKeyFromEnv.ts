import { InstanceSettings } from '@entities/instance_settings.entity';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillLicenseKeyFromEnv1683148731897 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const licenseKey = process.env.LICENSE_KEY || '';

    await entityManager.insert(InstanceSettings, {
      label: 'License Key',
      labelKey: 'header.organization.menus.manageSSO.generalSettings.licenseKey',
      dataType: 'text_area',
      value: licenseKey,
      key: 'LICENSE_KEY',
      type: 'system',
      createdAt: new Date(),
    });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
