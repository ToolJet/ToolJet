import { Component } from 'src/entities/component.entity';
import { In, MigrationInterface, QueryRunner } from 'typeorm';

export class TextInputMaxHeight1701335703893 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const componentTypes = ['TextInput', 'NumberInput', 'PasswordInput'];
    const entityManager = queryRunner.manager;

    const components = await entityManager.find(Component, {
      where: { type: In(componentTypes) },
      order: { createdAt: 'ASC' },
    });

    for (const component of components) {
      // Ensure properties is always an object
      const properties = component.properties || {};
      // Check if properties.label is not present, then assign it as null
      if (properties.label == undefined || null) {
        properties.label = '';
      }

      // Update the component in the database with the modified properties
      await entityManager.update(Component, component.id, { properties });
    }
  }

  //  implemented in this example
  public async down(queryRunner: QueryRunner): Promise<void> {}
}
