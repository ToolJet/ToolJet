import { MigrationInterface, QueryRunner } from 'typeorm';
import { getTooljetEdition } from '@helpers/utils.helper';
import { TOOLJET_EDITIONS } from '@modules/app/constants';
import { AppVersionStatus } from 'src/entities/app_version.entity';
export class UpdateAppVersionStatusAndFields1758793442013 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Get all app versions with their IDs
        const allAppVersions = await queryRunner.query(`
        SELECT id, current_environment_id FROM app_versions
    `);
        // Get the development environment ID
        const findDevelopmentEnvironment = await queryRunner.query(`
        SELECT id FROM app_environments WHERE name = 'development'
    `);

        if (!findDevelopmentEnvironment || !findDevelopmentEnvironment.length) {
            console.log('No development environment found, skipping migration');
            return;
        }

        const developmentEnvironmentId = findDevelopmentEnvironment[0]?.id;

        // Loop through app versions and update those in the development environment
        for (const version of allAppVersions) {
            if (version.current_environment_id === developmentEnvironmentId) {
                await queryRunner.query(
                    `UPDATE app_versions SET status = $1 WHERE id = $2`,
                    [AppVersionStatus.DRAFT, version.id]
                );
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> { }
}
// Need to review -> If we need to handle it speparately for CE and basic plans or this flow is fine