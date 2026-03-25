import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillLoadingStateListView1774412653881 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const batchSize = 100;
    let offset = 0;
    let hasMoreData = true;
    let processedCount = 0;
    let updatedCount = 0;
    let batchNumber = 0;

    const totalRecords = await queryRunner.query(
      `SELECT COUNT(*)::int AS count
       FROM components
       WHERE type = 'Listview'`
    );
    const totalCount = totalRecords[0]?.count ?? 0;

    if (totalCount === 0) {
      console.log('BackfillLoadingStateListView1774412653881: No components found to update.');
      return;
    }

    while (hasMoreData) {
      const components = await queryRunner.query(
        `SELECT id, properties
         FROM components
         WHERE type = 'Listview'
         ORDER BY "created_at" ASC
         LIMIT $1 OFFSET $2`,
        [batchSize, offset]
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
        `BackfillLoadingStateListView1774412653881: Batch ${batchNumber} | Processed ${processedCount}/${totalCount} (${progress}%) | Updated ${updatedCount}`
      );

      offset += batchSize;
    }
  }

  private async processUpdates(queryRunner: QueryRunner, components: any[]): Promise<number> {
    let updatedCount = 0;

    for (const component of components) {
      const properties = component.properties ? { ...component.properties } : {};

      if (properties.loadingState !== undefined) continue;

      properties.loadingState = { value: '{{false}}' };

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
