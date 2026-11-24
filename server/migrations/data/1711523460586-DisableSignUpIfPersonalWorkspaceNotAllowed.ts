import { MigrationInterface, QueryRunner } from 'typeorm';
import { InstanceSettings } from '@entities/instance_settings.entity';
import { INSTANCE_SYSTEM_SETTINGS, INSTANCE_USER_SETTINGS } from '@modules/instance-settings/constants';

export class DisableSignUpIfPersonalWorkspaceNotAllowed1711523460586 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;

    // Fetch the 'enable_sign_up' setting
    const enableSignUpSetting = await entityManager.findOne(InstanceSettings, {
      where: { key: INSTANCE_SYSTEM_SETTINGS.ENABLE_SIGNUP },
    });

    if (enableSignUpSetting && enableSignUpSetting.value === 'true') {
      const allowPersonalWorkspaceSetting = await entityManager.findOne(InstanceSettings, {
        where: { key: INSTANCE_USER_SETTINGS.ALLOW_PERSONAL_WORKSPACE },
      });

      // If allow personal workspace doesn't exist or is turned off, set enable sign up as false
      if (allowPersonalWorkspaceSetting.value !== 'true') {
        enableSignUpSetting.value = 'false';
        await entityManager.save(InstanceSettings, enableSignUpSetting);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
