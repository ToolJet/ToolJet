import { MigrationInterface, QueryRunner } from "typeorm";
import { InstanceSettings } from '@entities/instance_settings.entity';
import { INSTANCE_CONFIGS_DATA_TYPES } from '@modules/instance-settings/constants';
import { INSTANCE_SETTINGS_TYPE, INSTANCE_SYSTEM_SETTINGS } from '@modules/instance-settings/constants';
export class AddGranularDomainSettings1765958549099 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const entityManager = queryRunner.manager;

        // Query existing ALLOWED_DOMAINS to prefill PASSWORD_ALLOWED_DOMAINS
        const existingAllowedDomains = await entityManager.findOne(InstanceSettings, {
            where: { key: INSTANCE_SYSTEM_SETTINGS.ALLOWED_DOMAINS }
        });
        const existingAllowedDomainsValue = existingAllowedDomains?.value || '';

        const newSettings = [
            {
                key: 'PASSWORD_ALLOWED_DOMAINS',
                label: 'Password Allowed Domains',
                dataType: INSTANCE_CONFIGS_DATA_TYPES.TEXT,
                value: existingAllowedDomainsValue,
                type: INSTANCE_SETTINGS_TYPE.SYSTEM,
                createdAt: new Date(),
            },
            {
                key: 'PASSWORD_RESTRICTED_DOMAINS',
                label: 'Password Restricted Domains',
                dataType: INSTANCE_CONFIGS_DATA_TYPES.TEXT,
                value: '',
                type: INSTANCE_SETTINGS_TYPE.SYSTEM,
                createdAt: new Date(),
            }
        ];

        for (const setting of newSettings) {
            // Use upsert or check existence to prevent errors if you run this twice
            await entityManager.insert(InstanceSettings, setting);
        }
    }


    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM instance_settings WHERE key IN ('PASSWORD_ALLOWED_DOMAINS', 'PASSWORD_RESTRICTED_DOMAINS')`);
    }

}
