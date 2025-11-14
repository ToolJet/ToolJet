import { MigrationInterface, QueryRunner } from "typeorm";
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { filePathForEnvVars } from '../scripts/database-config-utils';

export class AddGroupSyncEnabledToSAMLConfigs1762960587101 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {

    let data: any = process.env;
    const envVarsFilePath = filePathForEnvVars(process.env.NODE_ENV);

    if (fs.existsSync(envVarsFilePath)) {
      const envFileContent = fs.readFileSync(envVarsFilePath);
      const parsedEnvVars = dotenv.parse(envFileContent);
      data = { ...data, ...parsedEnvVars };
    }

    const rawValue = data.DISABLE_SAML_GROUP_SYNC;

    // Rule:
    // DISABLE_SAML_GROUP_SYNC = "false" --> desiredBool = true
    // otherwise → false
    const desiredBool = rawValue === 'false';
    const sqlBool = String(desiredBool);

    console.log("ENV RAW:", rawValue);
    console.log("desiredBool:", desiredBool);
    console.log("sqlBool:", sqlBool);

    // Update SAML
    await queryRunner.query(`
      UPDATE sso_configs
      SET configs = jsonb_set(
        configs::jsonb,
        '{groupSyncEnabled}',
        '${sqlBool}'::jsonb,
        true
      )
      WHERE sso = 'saml'
        AND NOT (configs::jsonb ? 'groupSyncEnabled');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE sso_configs
      SET configs = configs::jsonb - 'groupSyncEnabled'
      WHERE sso = 'saml';
    `);
  }
}
