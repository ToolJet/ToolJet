import { InstanceSettings } from '@entities/instance_settings.entity';
import { INSTANCE_SETTINGS_TYPE, INSTANCE_SYSTEM_SETTINGS } from '@modules/instance-settings/constants';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEnableWorkspaceLoginConfigInInstanceSettings1706012625969 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;

    await entityManager.insert(InstanceSettings, {
      label: 'Enable Workspace Login Configuration',
      labelKey: 'header.organization.menus.manageSSO.generalSettings.enableWorkspaceLoginConfiguration',
      dataType: 'boolean',
      value: 'true',
      key: INSTANCE_SYSTEM_SETTINGS.ENABLE_WORKSPACE_LOGIN_CONFIGURATION,
      type: INSTANCE_SETTINGS_TYPE.SYSTEM,
      helperText: 'Allow workspace admin to configure their workspace’s login differently',
      helperTextKey: 'header.organization.menus.manageSSO.generalSettings.enableWorkspaceLoginConfiguration',
      createdAt: new Date(),
    });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
