import { InstanceSettings } from '@entities/instance_settings.entity';
import { INSTANCE_SETTINGS_TYPE, INSTANCE_SYSTEM_SETTINGS } from '@modules/instance-settings/constants';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAllowedDomainsInInstanceSettings1706012772483 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;

    await entityManager.insert(InstanceSettings, {
      label: 'Allowed Domains',
      labelKey: 'header.organization.menus.manageSSO.generalSettings.allowedDomains',
      dataType: 'string',
      value: process.env.SSO_ACCEPTED_DOMAINS || '',
      key: INSTANCE_SYSTEM_SETTINGS.ALLOWED_DOMAINS,
      type: INSTANCE_SETTINGS_TYPE.SYSTEM,
      helperText:
        'Support multiple domains. Enter domain names separated by comma. example: tooljet.com,tooljet.io,yourorganization.com',
      helperTextKey: 'header.organization.menus.manageSSO.generalSettings.allowedDomains',
      createdAt: new Date(),
    });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
