import { MigrationInterface, QueryRunner } from 'typeorm';
import { InstanceSettings } from '@entities/instance_settings.entity';
import { INSTANCE_SETTINGS_TYPE, INSTANCE_SYSTEM_SETTINGS } from '@modules/instance-settings/constants';

export class AddAutomaticSSOLoginInInstanceSettings1723636080272 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;

    await entityManager.insert(InstanceSettings, {
      label: 'Automatic SSO Login',
      labelKey: 'header.organization.menus.manageSSO.generalSettings.AutomaticSsoLogin',
      dataType: 'boolean',
      value: 'false',
      key: INSTANCE_SYSTEM_SETTINGS.AUTOMATIC_SSO_LOGIN,
      type: INSTANCE_SETTINGS_TYPE.SYSTEM,
      helperText: 'This will simulate the configured SSO login, bypassing the login screen in ToolJet',
      helperTextKey: 'header.organization.menus.manageSSO.generalSettings.AutomaticSsoLogin',
      createdAt: new Date(),
    });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
