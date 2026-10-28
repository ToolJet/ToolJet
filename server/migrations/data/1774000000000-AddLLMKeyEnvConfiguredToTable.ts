import { MigrationInterface, QueryRunner } from 'typeorm';
import { InstanceSettings } from '@entities/instance_settings.entity';
import { INSTANCE_SETTINGS_TYPE, INSTANCE_SYSTEM_SETTINGS } from '@modules/instance-settings/constants';

export class AddLLMKeyEnvConfiguredToTable1774000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;

    await entityManager.insert(InstanceSettings, {
      label: 'LLM Key ENV Configured',
      dataType: 'boolean',
      value: 'false',
      key: INSTANCE_SYSTEM_SETTINGS.LLM_KEY_ENV_CONFIGURED,
      type: INSTANCE_SETTINGS_TYPE.SYSTEM,
    });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
