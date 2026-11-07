import { InstanceSettings } from '@entities/instance_settings.entity';
import { INSTANCE_CONFIGS_DATA_TYPES } from '@modules/instance-settings/constants';
import { In, MigrationInterface, QueryRunner } from 'typeorm';
import { WHITE_LABELLING_SETTINGS } from '@helpers/migration.helper';
import { INSTANCE_SYSTEM_SETTINGS } from '@modules/instance-settings/constants';

export class InstanceSettingsDataTypeCorrection1722661249798 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;

    const keysToUpdate = [
      WHITE_LABELLING_SETTINGS.WHITE_LABEL_FAVICON,
      WHITE_LABELLING_SETTINGS.WHITE_LABEL_LOGO,
      WHITE_LABELLING_SETTINGS.WHITE_LABEL_TEXT,
      INSTANCE_SYSTEM_SETTINGS.ALLOWED_DOMAINS,
    ];

    await entityManager.update(
      InstanceSettings,
      { key: In(keysToUpdate) },
      { dataType: INSTANCE_CONFIGS_DATA_TYPES.TEXT }
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
