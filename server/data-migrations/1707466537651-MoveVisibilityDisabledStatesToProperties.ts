import { Component } from 'src/entities/component.entity';
import { processDataInBatches } from 'src/helpers/utils.helper';
import { EntityManager, In, MigrationInterface, QueryRunner } from 'typeorm';

export class MoveVisibilityDisabledStatesToProperties1707466537651 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const componentTypes = ['TextInput', 'NumberInput', 'PasswordInput', 'Text'];
        const batchSize = 100;
        const entityManager = queryRunner.manager;

        for (const componentType of componentTypes) {
            await processDataInBatches(
                entityManager,
                async (entityManager: EntityManager) => {
                    return await entityManager.find(Component, {
                        where: { type: componentType },
                        order: { createdAt: 'ASC' },
                    });
                },
                async (entityManager: EntityManager, components: Component[]) => {
                    await this.processUpdates(entityManager, components);
                },
                batchSize
            );
        }
    }

    private async processUpdates(entityManager, components) {
        for (const component of components) {
            const properties = component.properties;
            const styles = component.styles;
            const general = component.general;

            if (styles.visibility) {
                properties.visibility = styles.visibility;
                delete styles.visibility;
            }

            if (styles.disabledState) {
                properties.disabledState = styles.disabledState;
                delete styles.disabledState;
            }

            if (general?.tooltip) {
                properties.tooltip = general?.tooltip;
                delete general?.tooltip;
            }

            await entityManager.update(Component, component.id, { properties, styles, general });
        }

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
