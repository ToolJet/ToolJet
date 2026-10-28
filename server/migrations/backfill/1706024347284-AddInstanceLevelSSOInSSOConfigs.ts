import { MigrationInterface, QueryRunner } from 'typeorm';
import { ConfigScope, SSOConfigs, SSOType } from '@entities/sso_config.entity';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@modules/app/module';
import { getTooljetEdition } from '@helpers/utils.helper';
import { getImportPath, TOOLJET_EDITIONS } from '@modules/app/constants';
import { getEnvVars } from 'scripts/database-config-utils';

export class AddInstanceLevelSSOInSSOConfigs1706024347284 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const nestApp = await NestFactory.createApplicationContext(await AppModule.register({ IS_GET_CONTEXT: true }));

    const edition = getTooljetEdition() as TOOLJET_EDITIONS;
    const { EncryptionService } = await import(`${await getImportPath(true, edition)}/encryption/service`);
    const encryptionService = nestApp.get(EncryptionService);

    const envVars = getEnvVars();

    const ssoConfigs: Partial<SSOConfigs>[] = [
      {
        configScope: ConfigScope.INSTANCE,
        sso: SSOType.GOOGLE,
        enabled: !!envVars?.SSO_GOOGLE_OAUTH2_CLIENT_ID,
        configs: {
          clientId: envVars?.SSO_GOOGLE_OAUTH2_CLIENT_ID || '',
        },
      },
      {
        configScope: ConfigScope.INSTANCE,
        sso: SSOType.GIT,
        enabled: !!envVars?.SSO_GIT_OAUTH2_CLIENT_ID,
        configs: {
          clientId: envVars?.SSO_GIT_OAUTH2_CLIENT_ID || '',
          hostName: envVars?.SSO_GIT_OAUTH2_HOST || '',
          clientSecret:
            (envVars?.SSO_GIT_OAUTH2_CLIENT_SECRET &&
              (await encryptionService.encryptColumnValue(
                'ssoConfigs',
                'clientSecret',
                envVars.SSO_GIT_OAUTH2_CLIENT_SECRET
              ))) ||
            '',
        },
      },
      {
        configScope: ConfigScope.INSTANCE,
        sso: SSOType.OPENID,
        enabled: !!envVars?.SSO_OPENID_CLIENT_ID,
        configs: {
          clientId: envVars?.SSO_OPENID_CLIENT_ID || '',
          name: envVars?.SSO_OPENID_NAME || '',
          clientSecret:
            (envVars?.SSO_OPENID_CLIENT_SECRET &&
              (await encryptionService.encryptColumnValue(
                'ssoConfigs',
                'clientSecret',
                envVars.SSO_OPENID_CLIENT_SECRET
              ))) ||
            '',
          wellKnownUrl: envVars?.SSO_OPENID_WELL_KNOWN_URL || '',
        },
      },
      {
        configScope: ConfigScope.INSTANCE,
        sso: SSOType.FORM,
        enabled: true,
      },
    ];
    for (const config of ssoConfigs) {
      await entityManager.insert(SSOConfigs, config);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
