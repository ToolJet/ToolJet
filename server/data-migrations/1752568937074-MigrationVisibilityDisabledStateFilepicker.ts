import { Component } from 'src/entities/component.entity';
import { processDataInBatches } from '@helpers/migration.helper';
import { EntityManager, MigrationInterface, QueryRunner } from 'typeorm';

export class MigrationVisibilityDisabledStateFilepicker1752568937074 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const batchSize = 100;
        const entityManager = queryRunner.manager;

        await processDataInBatches(
            entityManager,
            async (entityManager: EntityManager) => {
                return await entityManager.find(Component, {
                    where: { type: 'FilePicker' },
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
            const styles = component.styles;
            const general = component.general;
            const generalStyles = component.generalStyles;
            const validation = component.validation;

            if (styles.visibility) {
                properties.visibility = styles?.visibility;
                delete styles?.visibility;
            }

            if (styles.disabledState) {
                properties.disabledState = styles?.disabledState;
                delete styles?.disabledState;
            }

            if (generalStyles?.boxShadow && !styles.boxShadow) {
                styles.boxShadow = generalStyles?.boxShadow;
                delete generalStyles?.boxShadow;
            }

            // Label and value
            if (properties.label == undefined || null) {
                properties.label = '';
            }

            if (properties.enableDropzone) {
                properties.enableDropzone = { ...properties.enableDropzone, fxActive: properties?.enableDropzone?.fxActive ?? true };
            }
            if (properties.enablePicker) {
                properties.enablePicker = { ...properties.enablePicker, fxActive: properties?.enablePicker?.fxActive ?? true };
            }
            if (properties.enableMultiple) {
                properties.enableMultiple = { ...properties.enableMultiple, fxActive: properties?.enableMultiple?.fxActive ?? true };
            }
            if (properties.fileType && !validation.fileType) {
                validation.fileType = { ...properties.fileType, fxActive: properties?.fileType?.fxActive ?? true };
                delete properties.fileType;
            }

            if (properties.maxFileCount && !validation.maxFileCount) {
                validation.maxFileCount = { ...properties.maxFileCount, fxActive: properties?.fileType?.fxActive ?? true };
                delete properties.maxFileCount;
            }
            if (properties.maxSize && !validation.maxSize) {
                validation.maxSize = { ...properties.maxSize, fxActive: properties?.maxSize?.fxActive ?? true };
                delete properties.maxSize;
            }
            if (properties.minSize && !validation.minSize) {
                validation.minSize = { ...properties.minSize, fxActive: properties?.minSize?.fxActive ?? true };
                delete properties.minSize;
            }

            if (!validation.minFileCount) {
                validation.minFileCount = { value: '{{0}}' };
            }

            await entityManager.update(Component, component.id, {
                properties,
                styles,
                general,
                generalStyles,
                validation,
            });
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
