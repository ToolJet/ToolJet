import { AppVersion } from "@entities/app_version.entity";
import { MigrationInterface, QueryRunner } from "typeorm";

export class DummyMigration1772175417356 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const entityManager = queryRunner.manager;
        const appVersions = await entityManager.find(AppVersion);
        const total = appVersions.length;

        console.log(`[START] Update Text component textSize | Total: ${total}`);

        for (let i = 0; i < appVersions.length; i++) {
            const version = appVersions[i];
            const definition = version['definition'];

            if (definition) {
                const components = definition['components'];

                for (const componentId of Object.keys(components)) {
                    const component = components[componentId];

                    if (component.component.component === 'Text') {
                        component.component.definition.styles.textSize = { value: 14 };
                        components[componentId] = {
                            ...component,
                            component: {
                                ...component.component,
                                definition: {
                                    ...component.component.definition,
                                },
                            },
                        };
                    }
                }

                definition['components'] = components;
                version.definition = definition;

                await entityManager.update(AppVersion, { id: version.id }, { definition });
            }

            const current = i + 1;
            if (total > 0 && Math.floor(current * 10 / total) > Math.floor((current - 1) * 10 / total)) {
                const percentage = Math.round((current / total) * 100);
                console.log(`[PROGRESS] ${current}/${total} (${percentage}%)`);
            }
        }

        console.log(`[SUCCESS] Update Text component textSize finished.`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> { }
}

