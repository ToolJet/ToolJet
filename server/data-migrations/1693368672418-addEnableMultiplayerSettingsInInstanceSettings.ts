import { InstanceSettings } from 'src/entities/instance_settings.entity';
import { INSTANCE_SETTINGS_TYPE, INSTANCE_USER_SETTINGS } from 'src/helpers/instance_settings.constants';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEnableMultiplayerSettingsInInstanceSettings1693368672418 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const enableMultiplayer = 'true';

    await entityManager.insert(InstanceSettings, {
      label: 'Multiplayer editing',
      labelKey: 'header.organization.menus.manageSSO.generalSettings.enableMultiplayerEditing',
      dataType: 'boolean',
      value: process.env?.ENABLE_MULTIPLAYER_EDITING || enableMultiplayer,
      key: INSTANCE_USER_SETTINGS.ENABLE_MULTIPLAYER_EDITING,
      type: INSTANCE_SETTINGS_TYPE.USER,
      helperText: 'Work collaboratively and edit applications in real-time with multi-player editing',
      helperTextKey: 'header.organization.menus.manageSSO.generalSettings.enableMultiplayerEditing',
    });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
