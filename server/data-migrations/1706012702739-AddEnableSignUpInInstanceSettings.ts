import { InstanceSettings } from '@entities/instance_settings.entity';
import { INSTANCE_SETTINGS_TYPE, INSTANCE_SYSTEM_SETTINGS } from '@modules/instance-settings/constants';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEnableSignUpInInstanceSettings1706012702739 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;

    await entityManager.insert(InstanceSettings, {
      label: 'Enable SignUp',
      labelKey: 'header.organization.menus.manageSSO.generalSettings.enableSignUp',
      dataType: 'boolean',
      value: String(process.env.DISABLE_SIGNUPS !== 'true'),
      key: INSTANCE_SYSTEM_SETTINGS.ENABLE_SIGNUP,
      type: INSTANCE_SETTINGS_TYPE.SYSTEM,
      helperText: 'Users will be able to sign up without being invited',
      helperTextKey: 'header.organization.menus.manageSSO.generalSettings.enableSignUp',
      createdAt: new Date(),
    });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
