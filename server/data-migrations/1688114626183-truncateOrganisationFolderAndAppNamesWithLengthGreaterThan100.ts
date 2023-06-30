import { MigrationInterface, QueryRunner, EntityManager } from 'typeorm';
import { App } from 'src/entities/app.entity';
import { Folder } from 'src/entities/folder.entity';
import { Organization } from 'src/entities/organization.entity';

export class TruncateOrganisationFolderAndAppNamesWithLengthGreaterThan1001688114626183 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const entityManager = queryRunner.manager;

        await this.truncateAppNames(entityManager);
        await this.truncateFolderNames(entityManager);
        await this.truncateOrganizationNames(entityManager);
    }

    public async truncateAppNames(entityManager: EntityManager) {
        const apps = await entityManager.find(App, {
            where: "LENGTH(name) > 100",
        });

        for (const app of apps) {
            app.name = app.name.substring(0, 100);
            await entityManager.save(app);
        }
    }

    public async truncateFolderNames(entityManager: EntityManager) {
        const folders = await entityManager.find(Folder, {
            where: "LENGTH(name) > 100",
        });

        for (const folder of folders) {
            folder.name = folder.name.substring(0, 100);
            await entityManager.save(folder);
        }
    }

    public async truncateOrganizationNames(entityManager: EntityManager) {
        const organizations = await entityManager.find(Organization, {
            where: "LENGTH(name) > 100",
        });

        for (const organization of organizations) {
            organization.name = organization.name.substring(0, 100);
            await entityManager.save(organization);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }
}
