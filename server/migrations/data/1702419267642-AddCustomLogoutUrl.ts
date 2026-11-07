import { InstanceSettings } from '@entities/instance_settings.entity';
import { INSTANCE_SETTINGS_TYPE } from '@modules/instance-settings/constants';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomLogoutUrl1702419267642 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const customLogoutUrlSetting = {
      value: '',
      key: 'CUSTOM_LOGOUT_URL',
      label: 'CUSTOM_LOGOUT_URL',
      labelKey: 'header.organization.menus.instanceLogout.customLogoutUrl.label',
      dataType: 'text',
      helperText: 'Set a personalized logout URL for users logging out of this instance.',
      helper_text_key: 'header.organization.menus.instanceLogout.customLogoutUrl.helperText',
      type: INSTANCE_SETTINGS_TYPE.SYSTEM,
    };
    await entityManager.insert(InstanceSettings, customLogoutUrlSetting);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {}
}
