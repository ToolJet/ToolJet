import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillDateTimePlaceholders1772045292279 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const batchSize = 100;
    let offset = 0;
    let hasMoreData = true;
    let processedCount = 0;
    let updatedCount = 0;
    let batchNumber = 0;

    const placeholderByType: Record<string, string> = {
      Datepicker: 'Select date',
      DatePickerV2: 'Select date',
      DatetimePickerV2: 'Select date and time',
      TimePicker: 'Select time',
      DaterangePicker: 'Select Date Range',
    };

    const componentTypes = Object.keys(placeholderByType);

    const totalRecords = await queryRunner.query(
      `SELECT COUNT(*)::int AS count
       FROM components
       WHERE type = ANY($1)`,
      [componentTypes]
    );
    const totalCount = totalRecords[0]?.count ?? 0;

    if (totalCount === 0) {
      console.log('BackfillDateTimePlaceholders1772045292279: No components found to update.');
      return;
    }

    while (hasMoreData) {
      const components = await queryRunner.query(
        `SELECT id, type, properties
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

      batchNumber++;
      const batchUpdatedCount = await this.processUpdates(queryRunner, components, placeholderByType);

      processedCount += components.length;
      updatedCount += batchUpdatedCount;
      const progress = Math.round((processedCount / totalCount) * 100);

      console.log(
        `BackfillDateTimePlaceholders1772045292279: Batch ${batchNumber} | Processed ${processedCount}/${totalCount} (${progress}%) | Updated ${updatedCount}`
      );

      offset += batchSize;
    }
  }

  private async processUpdates(
    queryRunner: QueryRunner,
    components: any[],
    placeholderByType: Record<string, string>
  ): Promise<number> {
    let updatedCount = 0;

    for (const component of components) {
      const properties = component.properties ? { ...component.properties } : {};

      if (properties.placeholder !== undefined) continue;

      const placeholder = placeholderByType[component.type];
      if (!placeholder) continue;

      properties.placeholder = { value: placeholder };

      await queryRunner.query(
        `UPDATE components
           SET properties = $1
           WHERE id = $2`,
        [JSON.stringify(properties), component.id]
      );
      updatedCount++;
    }

    return updatedCount;
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
