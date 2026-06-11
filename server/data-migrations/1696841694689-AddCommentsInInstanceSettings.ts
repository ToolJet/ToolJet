import { InstanceSettings } from '@entities/instance_settings.entity';
import { INSTANCE_SETTINGS_TYPE, INSTANCE_USER_SETTINGS } from '@modules/instance-settings/constants';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommentsInInstanceSettings1696841694689 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const comments = 'true';

    await entityManager.insert(InstanceSettings, {
      label: 'Comments',
      labelKey: 'header.organization.menus.manageSSO.generalSettings.comments',
      dataType: 'boolean',
      value: process.env?.COMMENT_FEATURE_ENABLE || comments,
      key: INSTANCE_USER_SETTINGS.ENABLE_COMMENTS,
      type: INSTANCE_SETTINGS_TYPE.USER,
      helperText: 'Collaborate with others by adding comments anywhere on the canvas',
      helperTextKey: 'header.organization.menus.manageSSO.generalSettings.comments',
      createdAt: new Date(),
    });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
