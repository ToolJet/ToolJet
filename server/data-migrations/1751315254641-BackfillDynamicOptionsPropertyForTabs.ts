import { Component } from 'src/entities/component.entity';
import { processDataInBatches } from '@helpers/migration.helper';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillDynamicOptionsPropertyForTabs1751315254641 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const batchSize = 100;
        const entityManager = queryRunner.manager;

        await processDataInBatches(
            entityManager,
            async (entityManager: EntityManager) => {
                return await entityManager.find(Component, {
                    where: { type: 'Tabs' },
                    order: { createdAt: 'ASC' },
                });
            },
            async (entityManager: EntityManager, components: Component[]) => {
                await this.processUpdates(entityManager, components);
            },
            batchSize
        );
    }

    private async processUpdates(entityManager, components) {
        for (const component of components) {
            const properties = component.properties;

            // Set useDynamicOptions to true if it doesn't exist
            if (properties.useDynamicOptions === undefined) {
                properties.useDynamicOptions =  { value: true };
            }

            await entityManager.update(Component, component.id, {
                properties,
            });
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
