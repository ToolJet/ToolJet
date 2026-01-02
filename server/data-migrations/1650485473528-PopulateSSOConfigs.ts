import { Organization } from '@entities/organization.entity';
import { SSOConfigs, SSOType } from '@entities/sso_config.entity';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { getImportPath, TOOLJET_EDITIONS } from '@modules/app/constants';
import { getTooljetEdition } from '@helpers/utils.helper';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@modules/app/module';
import { getEnvVars } from 'scripts/database-config-utils';

export class PopulateSSOConfigs1650485473528 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const nestApp = await NestFactory.createApplicationContext(await AppModule.register({ IS_GET_CONTEXT: true }));

    const edition = getTooljetEdition() as TOOLJET_EDITIONS;
    const { EncryptionService } = await import(`${await getImportPath(true, edition)}/encryption/service`);
    const encryptionService = nestApp.get(EncryptionService);

    const envVars = getEnvVars();

    const isSingleOrganization = envVars.DISABLE_MULTI_WORKSPACE === 'true';
    const enableSignUp = envVars.SSO_DISABLE_SIGNUP !== 'true';
    const domain = envVars.SSO_RESTRICTED_DOMAIN;

    const googleEnabled = !!envVars.SSO_GOOGLE_OAUTH2_CLIENT_ID;
    const googleConfigs = {
      clientId: envVars.SSO_GOOGLE_OAUTH2_CLIENT_ID,
    };

    const gitEnabled = !!envVars.SSO_GIT_OAUTH2_CLIENT_ID;

    const gitConfigs = {
      clientId: envVars.SSO_GIT_OAUTH2_CLIENT_ID,
      clientSecret:
        envVars.SSO_GIT_OAUTH2_CLIENT_SECRET &&
        (await encryptionService.encryptColumnValue(
          'ssoConfigs',
          'clientSecret',
          envVars.SSO_GIT_OAUTH2_CLIENT_SECRET
        )),
    };

    const passwordEnabled = envVars.DISABLE_PASSWORD_LOGIN !== 'true';

    const organizations: Organization[] = await entityManager.find(Organization, {
      relations: ['ssoConfigs'],
      select: ['ssoConfigs', 'id'],
    });

    if (organizations && organizations.length > 0) {
      for (const organization of organizations) {
        await entityManager.update(
          Organization,
          { id: organization.id },
          { enableSignUp, ...(domain ? { domain } : {}) }
        );
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
              sso: SSOType.FORM,
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
              sso: SSOType.GOOGLE,
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
              sso: SSOType.GIT,
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
