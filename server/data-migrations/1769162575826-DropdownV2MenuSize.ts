import { MigrationInterface, QueryRunner } from 'typeorm';

const DEFAULT_STYLES: Record<string, Record<string, { value: string | number }>> = {
  DropdownV2: {
    menuWidthMode: { value: 'matchField' },
  },
};

export class DropdownV2MenuSize1769162575826 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const batchSize = 100;
    let offset = 0;
    let hasMoreData = true;

    while (hasMoreData) {
      // Fetch DropdownV2 components in batches using raw SQL
      const components = await queryRunner.query(
        `SELECT id, styles, type
             FROM components
             WHERE type = $1
             ORDER BY "created_at" ASC
             LIMIT $2 OFFSET $3`,
        ['DropdownV2', batchSize, offset]
      );

      if (components.length === 0) {
        hasMoreData = false;
        break;
      }

      await this.processUpdates(queryRunner, components);
      offset += batchSize;
    }
  }

  private applyDefaultStyles(styles: Record<string, any>): void {
    const defaults = DEFAULT_STYLES['DropdownV2'];
    if (!defaults) return;

    for (const [key, value] of Object.entries(defaults)) {
      if (!styles[key]) {
        styles[key] = value;
      }
    }
  }

  private async processUpdates(queryRunner: QueryRunner, components: any[]) {
    for (const component of components) {
      const styles = component.styles ? { ...component.styles } : {};

      this.applyDefaultStyles(styles);

      // Updating component using raw query
      await queryRunner.query(`UPDATE components SET styles = $1 WHERE id = $2`, [
        JSON.stringify(styles),
        component.id,
      ]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
