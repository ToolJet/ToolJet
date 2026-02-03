import { MigrationInterface, QueryRunner } from "typeorm";
import { loadEnvironmentVariables } from '../scripts/env-utils';

export class AddLdapGroupSyncToggle1763837608217 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {

        const data = loadEnvironmentVariables(process.env.NODE_ENV);
        const rawValue = data.DISABLE_LDAP_GROUP_SYNC;
        const desiredBool = rawValue !== 'true';
        const sqlBool = String(desiredBool);

        // The key for LDAP is 'enableGroupSync'
        await queryRunner.query(`
            UPDATE sso_configs
            SET configs = jsonb_set(
                configs::jsonb,
                '{enableGroupSync}',
                '${sqlBool}'::jsonb,
                true
            )
            WHERE sso = 'ldap'
              AND NOT (configs::jsonb ? 'enableGroupSync');
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove the 'enableGroupSync' key from the LDAP configs
        await queryRunner.query(`
            UPDATE sso_configs
            SET configs = configs::jsonb - 'enableGroupSync'
            WHERE sso = 'ldap';
        `);
    }
}
