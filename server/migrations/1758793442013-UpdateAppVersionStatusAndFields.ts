import { MigrationInterface, QueryRunner } from 'typeorm';
import { getTooljetEdition } from '@helpers/utils.helper';
import { TOOLJET_EDITIONS } from '@modules/app/constants';
import { AppVersionStatus } from 'src/entities/app_version.entity';
export class UpdateAppVersionStatusAndFields1758793442013 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Get all app versions with their IDs

        // const allAppVersions = await queryRunner.query(`
        //     SELECT * FROM app_versions
        // `);
        // const findDevelopmentEnvironment = await queryRunner.query(`
        //     SELECT id FROM app_environments WHERE name = 'development'
        // `);

        const allDevelopmentVersionIds = await queryRunner.query(`
            SELECT av.id
            FROM app_versions av
            JOIN app_environments ae ON av.environment_id = ae.id
            WHERE ae.name = 'development'
        `);
        const allReleasedVersionIds = await queryRunner.query(`
            SELECT 
                av.id as version_id,
                FROM apps a
                INNER JOIN app_versions av ON a.current_version_id = av.id
            `);

        const edition = getTooljetEdition();
        // Handle CE edition specific logic
        if (edition === TOOLJET_EDITIONS.CE) {
            if (allReleasedVersionIds && allReleasedVersionIds.length) {
                await queryRunner.query(
                    `UPDATE apps SET status = ${AppVersionStatus.PUBLISHED} WHERE id = ANY($1::uuid[])`,
                    [allReleasedVersionIds]
                );
            }
            if (allDevelopmentVersionIds && allDevelopmentVersionIds.length) {
                await queryRunner.query(
                    `UPDATE apps SET status = ${AppVersionStatus.DRAFT} WHERE id = ANY($1::uuid[])`,
                    [allDevelopmentVersionIds]
                );
            }

        }
        // Get the development environment ID
    }

    public async down(queryRunner: QueryRunner): Promise<void> { }
}
// Need to review -> If we need to handle it speparately for CE and basic plans or this flow is fine


// CE --> If that version is a released version -> can keep the status to published else keep the status as DRAFT
// EE --> 
// Basic plan --> If that version is a released version -> can keep the status to published else keep the status as DRAFT
// Licensed users --> a. For all the versions in development environment -> keep the status to DRAFT
//                    b. For all the versions in staging/production environment -> keep the status to PUBLISHED   


// Cloud -->  : Free/Basic plan --> If that version is a released version -> can keep the status to published else keep the status as DRAFT
// Licensed users --> a. For all the versions in development environment -> keep the status to DRAFT
//                    b. For all the versions in staging/production environment -> keep the status to PUBLISHED



// you only have the version id -> using that I have to find the app is currently in which workspace and that workspace is on which plan and then I have to update the status accordingly
// app_version_id -> get app id from app_versions table -> using that app id get workspace id from apps table -> using that workspace id get plan details

// app_version_id  → Get app id from app_versions → App ID → Get Organization ID from Apps table → Organization ID → Workspace Plan & Type → Environment & Released Status → Determine Status → Update app_versions.status (edited) 





