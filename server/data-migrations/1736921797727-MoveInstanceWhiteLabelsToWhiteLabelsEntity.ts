import { In, MigrationInterface, QueryRunner } from 'typeorm';
import { InstanceSettings } from '@entities/instance_settings.entity';
import { WhiteLabelling } from '@entities/white_labelling.entity';
import { WHITE_LABELLING_SETTINGS } from '@helpers/migration.helper';
export class MoveInstanceWhiteLabelsToWhiteLabelsEntity1736921797727 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;

    // Get all white label related settings
    const whiteLabelSettings = await entityManager.find(InstanceSettings, {
      where: {
        key: In([
          WHITE_LABELLING_SETTINGS.WHITE_LABEL_FAVICON,
          WHITE_LABELLING_SETTINGS.WHITE_LABEL_LOGO,
          WHITE_LABELLING_SETTINGS.WHITE_LABEL_TEXT,
        ]),
      },
    });

    // Create new white label records
    if (whiteLabelSettings.length > 0) {
      const whiteLabel = new WhiteLabelling();
      whiteLabelSettings.forEach((setting) => {
        switch (setting.key) {
          case WHITE_LABELLING_SETTINGS.WHITE_LABEL_FAVICON:
            whiteLabel.favicon = setting.value;
            break;
          case WHITE_LABELLING_SETTINGS.WHITE_LABEL_LOGO:
            whiteLabel.logo = setting.value;
            break;
          case WHITE_LABELLING_SETTINGS.WHITE_LABEL_TEXT:
            whiteLabel.text = setting.value;
            break;
        }
      });
      await entityManager.save(WhiteLabelling, whiteLabel);

      // Remove old settings
      await entityManager.delete(InstanceSettings, {
        key: In([
          WHITE_LABELLING_SETTINGS.WHITE_LABEL_FAVICON,
          WHITE_LABELLING_SETTINGS.WHITE_LABEL_LOGO,
          WHITE_LABELLING_SETTINGS.WHITE_LABEL_TEXT,
        ]),
      });
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
