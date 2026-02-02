import { MigrationInterface, QueryRunner } from 'typeorm';

const DEFAULT_STYLES: Record<string, Record<string, { value: string | number }>> = {
  CodeEditor: {
    backgroundColor: { value: 'var(--cc-surface1-surface)' },
    borderColor: { value: 'var(--cc-weak-border)' },
  },
  PDF: {
    borderRadius: { value: 0 },
    borderColor: { value: '#00000000' },
  },
  Calendar: {
    borderRadius: { value: 0 },
    borderColor: { value: '#00000000' },
  },
  Chat: {
    borderRadius: { value: 6 },
  },
  CustomComponent: {
    boxShadow: { value: '0px 0px 0px 0px #00000040' },
    borderColor: { value: 'var(--cc-default-border)' },
  },
};

export class BackfillDefaultComponentStyles1765313746517 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const batchSize = 100;
    let offset = 0;
    let hasMoreData = true;

    while (hasMoreData) {
      // Fetch components in batches using raw SQL
      const components = await queryRunner.query(
        `SELECT id, properties, styles, general_properties, general_styles, type
             FROM components
             WHERE type = ANY($1)
             ORDER BY "created_at" ASC
             LIMIT $2 OFFSET $3`,
        [Object.keys(DEFAULT_STYLES), batchSize, offset]
      );

      if (components.length === 0) {
        hasMoreData = false;
        break;
      }

      await this.processUpdates(queryRunner, components);
      offset += batchSize;
    }
  }

  private applyDefaultStyles(styles: Record<string, any>, componentType: string): void {
    const defaults = DEFAULT_STYLES[componentType];
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
      const componentType = component.type;

      this.applyDefaultStyles(styles, componentType);

      // Updating component using raw query
      await queryRunner.query(`UPDATE components SET styles = $1 WHERE id = $2`, [
        JSON.stringify(styles),
        component.id,
      ]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
