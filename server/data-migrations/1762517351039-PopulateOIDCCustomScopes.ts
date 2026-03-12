import { MigrationInterface, QueryRunner } from 'typeorm';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { filePathForEnvVars } from '../scripts/database-config-utils';

export class PopulateOIDCCustomScopes1762517351039 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {

    let data: any = process.env;
    const envVarsFilePath = filePathForEnvVars(process.env.NODE_ENV);

    if (fs.existsSync(envVarsFilePath)) {
      const envFileContent = fs.readFileSync(envVarsFilePath);
      const parsedEnvVars = dotenv.parse(envFileContent);
      data = { ...data, ...parsedEnvVars };
    }

    const oidcCustomScopes = data.OIDC_CUSTOM_SCOPES;

    if (!oidcCustomScopes) {
      return;
    }

 
    await queryRunner.query(`
      UPDATE sso_configs
      SET configs = jsonb_set(
        configs::jsonb,
        '{customScopes}',
        to_jsonb('${oidcCustomScopes}'::text)
      )
      WHERE sso = 'openid';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE sso_configs
      SET configs = configs - 'customScopes'
      WHERE sso = 'openid';
    `);
  }
}
