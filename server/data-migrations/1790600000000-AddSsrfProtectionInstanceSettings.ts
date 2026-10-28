import { MigrationInterface, QueryRunner } from 'typeorm';

const MIGRATION_NAME = 'AddSsrfProtectionInstanceSettings1790600000000';

// Literal keys and values on purpose: migrations stay self-contained (no entity or constants imports).
const SSRF_INSTANCE_SETTINGS_ROWS = [
  {
    key: 'SSRF_PROTECTION_ENABLED',
    label: 'SSRF protection',
    labelKey: 'header.organization.menus.manageSSO.generalSettings.ssrfProtection',
    dataType: 'boolean',
    // Unset until a super admin chooses: on by default, off in dev mode (see isSSRFProtectionEnabledSetting).
    // Existing setups get an explicit value in up(), so upgrading never changes whether protection is on.
    value: '',
    helperText: 'Block data source requests to private, loopback and cloud metadata addresses',
    helperTextKey: 'header.organization.menus.manageSSO.generalSettings.ssrfProtection',
  },
  {
    key: 'SSRF_ALLOWED_ADDRESSES',
    label: 'SSRF allowed addresses',
    labelKey: 'header.organization.menus.manageSSO.generalSettings.ssrfAllowedAddresses',
    dataType: 'text',
    value: '[]',
    helperText: 'JSON array of hostnames, IPs or CIDR ranges exempt from SSRF protection',
    helperTextKey: 'header.organization.menus.manageSSO.generalSettings.ssrfAllowedAddresses',
  },
  {
    key: 'SSRF_UPGRADE_NOTICE_DISMISSED',
    label: 'SSRF upgrade notice dismissed',
    labelKey: 'header.organization.menus.manageSSO.generalSettings.ssrfUpgradeNoticeDismissed',
    dataType: 'boolean',
    value: 'false',
    helperText: 'Whether the super admin has dismissed the SSRF protection upgrade notice',
    helperTextKey: 'header.organization.menus.manageSSO.generalSettings.ssrfUpgradeNoticeDismissed',
  },
];

export class AddSsrfProtectionInstanceSettings1790600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const total = SSRF_INSTANCE_SETTINGS_ROWS.length;
    // No workspace yet means a new installation; any workspace means an existing setup being upgraded, which keeps
    // its current behaviour: off unless it had opted in through the SSRF_PROTECTION_ENABLED env var.
    const [{ exists: isExistingSetup }] = await queryRunner.query(
      `SELECT EXISTS (SELECT 1 FROM organizations) AS "exists"`
    );
    // Existing setups also skip the dashboard notice: it is meant for new installations only.
    const existingSetupValues: Partial<Record<string, string>> = {
      SSRF_PROTECTION_ENABLED: process.env.SSRF_PROTECTION_ENABLED === 'true' ? 'true' : 'false',
      SSRF_UPGRADE_NOTICE_DISMISSED: 'true',
    };
    console.log(
      `${MIGRATION_NAME}: [START] SSRF instance settings to add: ${total} (${isExistingSetup ? 'existing setup' : 'new installation'})`
    );

    let inserted = 0;
    for (const [index, row] of SSRF_INSTANCE_SETTINGS_ROWS.entries()) {
      const value = isExistingSetup ? (existingSetupValues[row.key] ?? row.value) : row.value;
      // ON CONFLICT on the unique key: a re-run never overwrites an admin's choice.
      const rows = await queryRunner.query(
        `INSERT INTO instance_settings (key, value, label, label_key, data_type, helper_text, helper_text_key, type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'system')
         ON CONFLICT (key) DO NOTHING
         RETURNING id`,
        [row.key, value, row.label, row.labelKey, row.dataType, row.helperText, row.helperTextKey]
      );
      inserted += rows.length;
      console.log(`${MIGRATION_NAME}: [PROGRESS] ${index + 1}/${total} (${Math.round(((index + 1) / total) * 100)}%)`);
    }

    console.log(`${MIGRATION_NAME}: [SUCCESS] Adding SSRF instance settings finished. Inserted: ${inserted}`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
