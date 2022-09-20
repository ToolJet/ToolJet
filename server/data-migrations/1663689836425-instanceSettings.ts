import { InstanceSettings } from 'src/entities/instance_settings.entity';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class instanceSettings1663689836425 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const InstanceSettingsRepository = entityManager.getRepository(InstanceSettings);

    const settings = [
      {
        key: 'ALLOW_PERSONAL_WORKSPACE',
        value: 'true',
      },
      {
        key: 'ALLOW_PLUGIN_INTEGRATION',
        value: 'true',
      },
    ];

    const entries = settings.map((setting) => InstanceSettingsRepository.create(setting));
    await InstanceSettingsRepository.save(entries);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
