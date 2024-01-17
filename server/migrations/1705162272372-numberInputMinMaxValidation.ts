import { Component } from 'src/entities/component.entity';
import { In, MigrationInterface, QueryRunner } from 'typeorm';

export class NumberInputMinMaxValidation1705162272372 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Array of component types to be enhanced
    const componentTypes = ['NumberInput'];

    // Obtaining the TypeORM EntityManager from the QueryRunner
    const entityManager = queryRunner.manager;

    // Retrieving components of specified types from the database
    const components = await entityManager.find(Component, {
      where: { type: In(componentTypes) }, // Filtering by component types
      order: { createdAt: 'ASC' }, // Ordering components by creation date in ascending order
    });

    // Iterating through each retrieved component
    for (const component of components) {
      // Extracting properties and validation from the component
      const properties = component.properties;
      const validation = component.validation;

      // Moving 'minValue' from properties to validation
      if (properties.minValue) {
        validation.minValue = properties.minValue;
        delete properties.minValue; // Removing 'minValue' from properties
      }

      // Moving 'minValue' from properties to validation
      if (properties.maxValue) {
        validation.maxValue = properties.maxValue;
        delete properties.maxValue; // Removing 'minValue' from properties
      }
      // Updating the component in the database with the modified properties and validation
      await entityManager.update(Component, component.id, { properties, validation });
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
