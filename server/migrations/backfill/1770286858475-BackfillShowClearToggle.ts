import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillShowClearToggle1770286858475 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const batchSize = 100;
    let offset = 0;
    let hasMoreData = true;

    const componentTypes = [
      'TextInput',
      'NumberInput',
      'EmailInput',
      'CurrencyInput',
      'PhoneInput',
      'Datepicker',
      'DatePickerV2',
      'DatetimePickerV2',
      'TimePicker',
      'DaterangePicker',
    ];

    while (hasMoreData) {
      const components = await queryRunner.query(
        `SELECT id, properties
         FROM components
         WHERE type = ANY($1)
         ORDER BY "created_at" ASC
         LIMIT $2 OFFSET $3`,
        [componentTypes, batchSize, offset]
      );

      if (components.length === 0) {
        hasMoreData = false;
        break;
      }

      await this.processUpdates(queryRunner, components);
      offset += batchSize;
    }
  }

  private async processUpdates(queryRunner: QueryRunner, components: any[]) {
    for (const component of components) {
      const properties = component.properties ? { ...component.properties } : {};

      if (!properties.showClearBtn) {
        properties.showClearBtn = { value: '{{false}}' };
      }

      await queryRunner.query(
        `UPDATE components
           SET properties = $1
           WHERE id = $2`,
        [JSON.stringify(properties), component.id]
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
