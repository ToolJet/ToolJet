import { Component } from 'src/entities/component.entity';
import { processDataInBatches } from '@helpers/migration.helper';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';

const componentTypes = ['TextInput', 'NumberInput', 'PasswordInput', 'EmailInput', 'PhoneInput', 'CurrencyInput', 'DatePickerV2', 'DateRangePicker', 'Timepicker', 'DatetimePicker', 'DaterangePicker', 'TextArea', 'DropdownV2', 'MultiselectV2', 'RadioButtonV2', 'FilePicker', 'RangeSliderV2'];
const batchSize = 100;

export class DeprecateInputWidgetTypeOfField1754940735810 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
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
            const styles = component.styles;

            if (!styles.widthType) {
                styles.widthType = 'ofField';
            }

            await entityManager.update(Component, component.id, {
                styles,
            });
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> { }
}
