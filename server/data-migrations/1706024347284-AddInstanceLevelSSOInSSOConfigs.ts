import { MigrationInterface, QueryRunner } from 'typeorm';
import { ConfigScope, SSOConfigs, SSOType } from '@entities/sso_config.entity';
import { EncryptionService } from '@modules/encryption/service';

export class AddInstanceLevelSSOInSSOConfigs1706024347284 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const entityManager = queryRunner.manager;
    const encryptionService = new EncryptionService();
    const ssoConfigs: Partial<SSOConfigs>[] = [
      {
        configScope: ConfigScope.INSTANCE,
        sso: SSOType.GOOGLE,
        enabled: !!process.env?.SSO_GOOGLE_OAUTH2_CLIENT_ID,
        configs: {
          clientId: process.env?.SSO_GOOGLE_OAUTH2_CLIENT_ID || '',
        },
      },
      {
        configScope: ConfigScope.INSTANCE,
        sso: SSOType.GIT,
        enabled: !!process.env?.SSO_GIT_OAUTH2_CLIENT_ID,
        configs: {
          clientId: process.env?.SSO_GIT_OAUTH2_CLIENT_ID || '',
          hostName: process.env?.SSO_GIT_OAUTH2_HOST || '',
          clientSecret:
            (process.env?.SSO_GIT_OAUTH2_CLIENT_SECRET &&
              (await encryptionService.encryptColumnValue(
                'ssoConfigs',
                'clientSecret',
                process.env.SSO_GIT_OAUTH2_CLIENT_SECRET
              ))) ||
            '',
        },
      },
      {
        configScope: ConfigScope.INSTANCE,
        sso: SSOType.OPENID,
        enabled: !!process.env?.SSO_OPENID_CLIENT_ID,
        configs: {
          clientId: process.env?.SSO_OPENID_CLIENT_ID || '',
          name: process.env?.SSO_OPENID_NAME || '',
          clientSecret:
            (process.env?.SSO_OPENID_CLIENT_SECRET &&
              (await encryptionService.encryptColumnValue(
                'ssoConfigs',
                'clientSecret',
                process.env.SSO_OPENID_CLIENT_SECRET
              ))) ||
            '',
          wellKnownUrl: process.env?.SSO_OPENID_WELL_KNOWN_URL || '',
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
