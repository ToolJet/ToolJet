import { InstanceSettings } from '@entities/instance_settings.entity';
import { INSTANCE_SETTINGS_TYPE, INSTANCE_USER_SETTINGS } from '@modules/instance-settings/constants';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMfaEnabledInInstanceSettings1784073600001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;

    await entityManager.insert(InstanceSettings, {
      label: 'Two-factor authentication',
      labelKey: 'header.organization.menus.manageSSO.generalSettings.enableMfa',
      dataType: 'boolean',
      value: 'false',
      key: INSTANCE_USER_SETTINGS.MFA_ENABLED,
      type: INSTANCE_SETTINGS_TYPE.USER,
      helperText: 'Require users to verify their identity with an authenticator app when logging in',
      helperTextKey: 'header.organization.menus.manageSSO.generalSettings.enableMfa',
      createdAt: new Date(),
    });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
