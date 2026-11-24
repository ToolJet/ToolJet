import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { getTooljetEdition } from '@helpers/utils.helper';
import { getImportPath, TOOLJET_EDITIONS } from '@modules/app/constants';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { getLicenseFieldValue } from '@modules/licensing/helper';
import { OrganizationsLicense } from '@entities/organization_license.entity'; // migration-import-allowed: reads the license row the same way LicenseInitService.getPlanForMigrationCloud does

const MIGRATION_NAME = 'DisableUnlicensedAutomaticSsoLogin1790800000000';
const PROGRESS_EVERY = 100;

/**
 * Cloud only: automatic SSO login is an Enterprise entitlement there, so turn the saved setting off on workspaces
 * whose own organization_license doesn't include it. Self-hosted keeps saved settings (a key without the flag allows it).
 */
export class DisableUnlicensedAutomaticSsoLogin1790800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (getTooljetEdition() !== TOOLJET_EDITIONS.Cloud) {
      console.log(`${MIGRATION_NAME}: [SKIP] only Cloud turns off unlicensed automatic SSO login`);
      return;
    }

    const importPath = await getImportPath(true, TOOLJET_EDITIONS.Cloud);
    await this.disableForCloud(queryRunner.manager, importPath);
  }

  private async disableForCloud(manager: EntityManager, importPath: string): Promise<void> {
    const { default: OrganizationLicense } = await import(`${importPath}/licensing/configs/organization-license`);
    const organizationIds: string[] = (
      await manager.query(`SELECT id FROM organizations WHERE automatic_sso_login = true`)
    ).map((row: { id: string }) => row.id);
    const total = organizationIds.length;
    console.log(`${MIGRATION_NAME}: [START] checking workspaces with automatic SSO login on: ${total}`);

    const unlicensedIds: string[] = [];
    for (const [index, organizationId] of organizationIds.entries()) {
      // Same license construction as LicenseInitService.getPlanForMigrationCloud.
      const orgLicense = await manager.findOne(OrganizationsLicense, { where: { organizationId } });
      const licenseInstance = orgLicense
        ? new OrganizationLicense(
            orgLicense.terms,
            orgLicense.updatedAt,
            orgLicense.expiryWithGracePeriod,
            orgLicense.plan
          )
        : new OrganizationLicense();
      if (!getLicenseFieldValue(LICENSE_FIELD.AUTOMATIC_SSO_LOGIN, licenseInstance)) {
        unlicensedIds.push(organizationId);
      }

      const done = index + 1;
      if (done % PROGRESS_EVERY === 0 || done === total) {
        console.log(`${MIGRATION_NAME}: [PROGRESS] ${done}/${total} (${Math.round((done / total) * 100)}%)`);
      }
    }

    if (unlicensedIds.length) {
      await manager.query(`UPDATE organizations SET automatic_sso_login = false WHERE id = ANY($1::uuid[])`, [
        unlicensedIds,
      ]);
    }
    console.log(
      `${MIGRATION_NAME}: [SUCCESS] automatic SSO login turned off on ${unlicensedIds.length} of ${total} workspace(s).`
    );
  }

  public async down(): Promise<void> {
    // The previous per-workspace values were not recorded, so this cannot be reversed.
  }
}
