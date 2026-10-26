import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@modules/app/module';
import { getTooljetEdition } from '@helpers/utils.helper';
import { getImportPath, TOOLJET_EDITIONS } from '@modules/app/constants';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { LicenseInitService } from '@modules/licensing/interfaces/IService';
import { getLicenseFieldValue } from '@modules/licensing/helper';
import { OrganizationsLicense } from '@entities/organization_license.entity';

const MIGRATION_NAME = 'DisableUnlicensedAutomaticSsoLogin1790800000000';
const PROGRESS_EVERY = 100;

/**
 * Automatic SSO login is now gated by the `automaticSsoLogin` license entitlement (Enterprise). Turn the saved
 * setting off wherever the current license doesn't include it, and leave it untouched where it does, so
 * Enterprise keeps auto-login across the upgrade.
 *  - Self-hosted EE: one instance license covers the instance setting and every workspace.
 *  - Cloud: each workspace is checked against its own organization_license row.
 *  - CE: its plan includes automatic SSO login, so nothing changes.
 */
export class DisableUnlicensedAutomaticSsoLogin1790800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const edition = getTooljetEdition() as TOOLJET_EDITIONS;
    if (edition === TOOLJET_EDITIONS.CE) {
      console.log(`${MIGRATION_NAME}: [SKIP] Community edition includes automatic SSO login`);
      return;
    }

    const manager = queryRunner.manager;
    const importPath = await getImportPath(true, edition);
    if (edition === TOOLJET_EDITIONS.Cloud) {
      await this.disableForCloud(manager, importPath);
    } else {
      await this.disableForSelfHosted(manager, importPath);
    }
  }

  private async disableForSelfHosted(manager: EntityManager, importPath: string): Promise<void> {
    const nestApp = await NestFactory.createApplicationContext(await AppModule.register({ IS_GET_CONTEXT: true }));
    try {
      await nestApp.get(LicenseInitService).initForMigration(manager);
      const { default: License } = await import(`${importPath}/licensing/configs/License`);

      console.log(`${MIGRATION_NAME}: [START] checking the instance license for automatic SSO login: 1`);
      if (getLicenseFieldValue(LICENSE_FIELD.AUTOMATIC_SSO_LOGIN, License.Instance())) {
        console.log(`${MIGRATION_NAME}: [SUCCESS] license includes automatic SSO login, settings kept.`);
        return;
      }

      // pg returns [rows, rowCount] for UPDATE through TypeORM's query()
      const workspacesResult = await manager.query(
        `UPDATE organizations SET automatic_sso_login = false WHERE automatic_sso_login = true`
      );
      const instanceResult = await manager.query(
        `UPDATE instance_settings SET value = 'false' WHERE key = 'AUTOMATIC_SSO_LOGIN' AND value = 'true'`
      );
      console.log(
        `${MIGRATION_NAME}: [SUCCESS] automatic SSO login turned off on ${workspacesResult?.[1]} workspace(s) and ${instanceResult?.[1]} instance setting(s).`
      );
    } finally {
      await nestApp.close();
    }
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
