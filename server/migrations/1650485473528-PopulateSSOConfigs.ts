import { Organization } from 'src/entities/organization.entity';
import { SSOConfigs } from 'src/entities/sso_config.entity';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { EncryptionService } from 'src/services/encryption.service';

export class PopulateSSOConfigs1650485473528 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const encryptionService = new EncryptionService();
    const OrganizationRepository = entityManager.getRepository(Organization);

    const isSingleOrganization = process.env.MULTI_ORGANIZATION !== 'true';
    const enableSignUp = process.env.SSO_DISABLE_SIGNUP !== 'true';
    const domain = process.env.SSO_RESTRICTED_DOMAIN;

    const googleEnabled = !!process.env.SSO_GOOGLE_OAUTH2_CLIENT_ID;
    const googleConfigs = {
      clientId: process.env.SSO_GOOGLE_OAUTH2_CLIENT_ID,
    };

    const gitEnabled = !!process.env.SSO_GIT_OAUTH2_CLIENT_ID;

    const gitConfigs = {
      clientId: process.env.SSO_GIT_OAUTH2_CLIENT_ID,
      clientSecret:
        process.env.SSO_GIT_OAUTH2_CLIENT_SECRET &&
        (await encryptionService.encryptColumnValue(
          'ssoConfigs',
          'clientSecret',
          process.env.SSO_GIT_OAUTH2_CLIENT_SECRET
        )),
    };

    const passwordEnabled = process.env.DISABLE_PASSWORD_LOGIN !== 'true';

    const organizations: Organization[] = await OrganizationRepository.find({
      relations: ['ssoConfigs'],
      select: ['ssoConfigs', 'id'],
    });

    if (organizations && organizations.length > 0) {
      for (const organization of organizations) {
        await OrganizationRepository.update({ id: organization.id }, { enableSignUp, ...(domain ? { domain } : {}) });
        // adding form configs for organizations which does not have any
        if (
          !organization.ssoConfigs?.some((og) => {
            og?.sso === 'form';
          })
        ) {
          await entityManager
            .createQueryBuilder()
            .insert()
            .into(SSOConfigs, ['organizationId', 'sso', 'enabled'])
            .values({
              organizationId: organization.id,
              sso: 'form',
              enabled: !isSingleOrganization ? true : passwordEnabled,
            })
            .execute();
        }
        if (
          isSingleOrganization &&
          googleEnabled &&
          !organization.ssoConfigs?.some((og) => {
            og?.sso === 'google';
          })
        ) {
          await entityManager
            .createQueryBuilder()
            .insert()
            .into(SSOConfigs, ['organizationId', 'sso', 'enabled', 'configs'])
            .values({
              organizationId: organization.id,
              sso: 'google',
              enabled: googleEnabled,
              configs: googleConfigs,
            })
            .execute();
        }

        if (
          isSingleOrganization &&
          gitEnabled &&
          !organization.ssoConfigs?.some((og) => {
            og?.sso === 'git';
          })
        ) {
          await entityManager
            .createQueryBuilder()
            .insert()
            .into(SSOConfigs, ['organizationId', 'sso', 'enabled', 'configs'])
            .values({
              organizationId: organization.id,
              sso: 'git',
              enabled: gitEnabled,
              configs: gitConfigs,
            })
            .execute();
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
