import { InstanceSettings } from '@entities/instance_settings.entity';
import {
  INSTANCE_CONFIGS_DATA_TYPES,
  INSTANCE_SETTINGS_TYPE,
  INSTANCE_SYSTEM_SETTINGS,
} from '@modules/instance-settings/constants';
import { MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'AddSsrfProtectionInstanceSettings1790600000000';

export const SSRF_INSTANCE_SETTINGS_ROWS = [
  {
    key: INSTANCE_SYSTEM_SETTINGS.SSRF_PROTECTION_ENABLED,
    label: 'SSRF protection',
    labelKey: 'header.organization.menus.manageSSO.generalSettings.ssrfProtection',
    dataType: INSTANCE_CONFIGS_DATA_TYPES.BOOLEAN,
    value: 'true',
    helperText: 'Block data source requests to private, loopback and cloud metadata addresses',
    helperTextKey: 'header.organization.menus.manageSSO.generalSettings.ssrfProtection',
  },
  {
    key: INSTANCE_SYSTEM_SETTINGS.SSRF_ALLOWED_ADDRESSES,
    label: 'SSRF allowed addresses',
    labelKey: 'header.organization.menus.manageSSO.generalSettings.ssrfAllowedAddresses',
    dataType: INSTANCE_CONFIGS_DATA_TYPES.TEXT,
    value: '[]',
    helperText: 'JSON array of hostnames, IPs or CIDR ranges exempt from SSRF protection',
    helperTextKey: 'header.organization.menus.manageSSO.generalSettings.ssrfAllowedAddresses',
  },
  {
    key: INSTANCE_SYSTEM_SETTINGS.SSRF_UPGRADE_NOTICE_DISMISSED,
    label: 'SSRF upgrade notice dismissed',
    labelKey: 'header.organization.menus.manageSSO.generalSettings.ssrfUpgradeNoticeDismissed',
    dataType: INSTANCE_CONFIGS_DATA_TYPES.BOOLEAN,
    value: 'false',
    helperText: 'Whether the super admin has dismissed the SSRF protection upgrade notice',
    helperTextKey: 'header.organization.menus.manageSSO.generalSettings.ssrfUpgradeNoticeDismissed',
  },
];

export class AddSsrfProtectionInstanceSettings1790600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const total = SSRF_INSTANCE_SETTINGS_ROWS.length;
    console.log(`${MIGRATION_NAME}: [START] SSRF instance settings to add: ${total}`);

    let inserted = 0;
    for (const [index, row] of SSRF_INSTANCE_SETTINGS_ROWS.entries()) {
      // Insert only where the key is missing, so a re-run never overwrites an admin's choice.
      const existing = await entityManager.findOne(InstanceSettings, { where: { key: row.key } });
      if (!existing) {
        await entityManager.insert(InstanceSettings, {
          ...row,
          type: INSTANCE_SETTINGS_TYPE.SYSTEM,
          createdAt: new Date(),
        });
        inserted++;
      }
      console.log(`${MIGRATION_NAME}: [PROGRESS] ${index + 1}/${total} (${Math.round(((index + 1) / total) * 100)}%)`);
    }

    console.log(`${MIGRATION_NAME}: [SUCCESS] Adding SSRF instance settings finished. Inserted: ${inserted}`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
