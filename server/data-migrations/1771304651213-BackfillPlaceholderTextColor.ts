import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillPlaceholderTextColor1771304651213 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const batchSize = 100;
    let offset = 0;
    let hasMoreData = true;
    let processedCount = 0;
    let updatedCount = 0;
    let batchNumber = 0;

    const componentTypes = ['TextInput', 'NumberInput', 'PasswordInput', 'DropdownV2'];
    const totalRecords = await queryRunner.query(
      `SELECT COUNT(*)::int AS count
       FROM components
       WHERE type = ANY($1)`,
      [componentTypes]
    );
    const totalCount = totalRecords[0]?.count ?? 0;

    if (totalCount === 0) {
      console.log('BackfillPlaceholderTextColor1771304651213: No components found to update.');
      return;
    }

    while (hasMoreData) {
      const components = await queryRunner.query(
        `SELECT id, styles
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
      const batchUpdatedCount = await this.processUpdates(queryRunner, components);

      processedCount += components.length;
      updatedCount += batchUpdatedCount;
      const progress = Math.round((processedCount / totalCount) * 100);
      console.log(
        `BackfillPlaceholderTextColor1771304651213: Batch ${batchNumber} | Processed ${processedCount}/${totalCount} (${progress}%) | Updated ${updatedCount}`
      );

      offset += batchSize;
    }
  }

  private async processUpdates(queryRunner: QueryRunner, components: any[]): Promise<number> {
    let updatedCount = 0;

    for (const component of components) {
      const styles = component.styles ? { ...component.styles } : {};

      if (styles.placeholderTextColor !== undefined) continue;

      styles.placeholderTextColor = {
        value: 'var(--cc-placeholder-text)',
      };

      await queryRunner.query(
        `UPDATE components
           SET styles = $1
           WHERE id = $2`,
        [JSON.stringify(styles), component.id]
      );
      updatedCount++;
    }

    return updatedCount;
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
