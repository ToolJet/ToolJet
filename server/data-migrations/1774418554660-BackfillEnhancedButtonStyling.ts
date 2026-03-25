import { MigrationInterface, QueryRunner } from 'typeorm';

type StyleValue = string | number | boolean;
type StyleEntry = { value?: StyleValue; [key: string]: any } | StyleValue;
type Styles = Record<string, StyleEntry>;

const COMPONENT_TYPES = ['Button', 'ButtonGroupV2', 'ModalV2', 'PopoverMenu'];

const DEFAULT_STYLES: Record<string, Record<string, StyleValue>> = {
  Button: {
    textSize: '{{14}}',
    fontWeight: 'normal',
    contentAlignment: 'center',
    hoverBackgroundMode: 'auto',
    hoverBackgroundColor: 'var(--cc-primary-brand)',
  },
  ButtonGroupV2: {
    textSize: '{{14}}',
    fontWeight: 'normal',
    hoverBackgroundMode: 'auto',
    hoverBackgroundColor: 'var(--cc-primary-brand)',
  },
  ModalV2: {
    triggerButtonTextSize: '{{14}}',
    triggerButtonFontWeight: 'normal',
    triggerButtonContentAlignment: 'center',
    triggerButtonHoverBackgroundMode: 'auto',
    triggerButtonHoverBackgroundColor: 'var(--cc-primary-brand)',
  },
  PopoverMenu: {
    textSize: '{{14}}',
    fontWeight: 'normal',
    contentAlignment: 'center',
    hoverBackgroundMode: 'auto',
    hoverBackgroundColor: 'var(--cc-primary-brand)',
  },
};

const HOVER_MODE_CONFIG: Record<string, { modeKey: string; colorKey: string; defaultColor: string }> = {
  Button: {
    modeKey: 'hoverBackgroundMode',
    colorKey: 'hoverBackgroundColor',
    defaultColor: 'var(--cc-primary-brand)',
  },
  ButtonGroupV2: {
    modeKey: 'hoverBackgroundMode',
    colorKey: 'hoverBackgroundColor',
    defaultColor: 'var(--cc-primary-brand)',
  },
  ModalV2: {
    modeKey: 'triggerButtonHoverBackgroundMode',
    colorKey: 'triggerButtonHoverBackgroundColor',
    defaultColor: 'var(--cc-primary-brand)',
  },
  PopoverMenu: {
    modeKey: 'hoverBackgroundMode',
    colorKey: 'hoverBackgroundColor',
    defaultColor: 'var(--cc-primary-brand)',
  },
};

export class BackfillEnhancedButtonStyling1774418554660 implements MigrationInterface {
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
       WHERE type = ANY($1)`,
      [COMPONENT_TYPES]
    );
    const totalCount = totalRecords[0]?.count ?? 0;

    if (totalCount === 0) {
      console.log('BackfillEnhancedButtonStyling1774418554660: No components found to update.');
      return;
    }

    while (hasMoreData) {
      const components = await queryRunner.query(
        `SELECT id, type, styles
         FROM components
         WHERE type = ANY($1)
         ORDER BY "created_at" ASC
         LIMIT $2 OFFSET $3`,
        [COMPONENT_TYPES, batchSize, offset]
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
        `BackfillEnhancedButtonStyling1774418554660: Batch ${batchNumber} | Processed ${processedCount}/${totalCount} (${progress}%) | Updated ${updatedCount}`
      );

      offset += batchSize;
    }
  }

  private hasUsableValue(entry: StyleEntry | undefined): boolean {
    if (entry === undefined || entry === null) return false;
    if (Array.isArray(entry)) return false;

    if (typeof entry === 'object') {
      return entry.value !== undefined && entry.value !== null && entry.value !== '';
    }

    return entry !== '';
  }

  private getStyleValue(styles: Styles, key: string): StyleValue | undefined {
    const entry = styles[key];
    if (entry === undefined || entry === null) return undefined;
    if (Array.isArray(entry)) return undefined;

    if (typeof entry === 'object') {
      return entry.value;
    }

    return entry as StyleValue;
  }

  private setStyleValue(styles: Styles, key: string, value: StyleValue): void {
    const current = styles[key];
    if (current && typeof current === 'object' && !Array.isArray(current)) {
      styles[key] = { ...current, value };
      return;
    }

    styles[key] = { value };
  }

  private backfillDefaultStyles(styles: Styles, componentType: string): boolean {
    const defaults = DEFAULT_STYLES[componentType];
    if (!defaults) return false;

    let didChange = false;

    for (const [key, value] of Object.entries(defaults)) {
      if (!this.hasUsableValue(styles[key])) {
        this.setStyleValue(styles, key, value);
        didChange = true;
      }
    }

    return didChange;
  }

  private backfillHoverMode(styles: Styles, componentType: string): boolean {
    const config = HOVER_MODE_CONFIG[componentType];
    if (!config) return false;

    const { modeKey, colorKey, defaultColor } = config;
    if (this.hasUsableValue(styles[modeKey])) return false;

    const hoverColor = this.getStyleValue(styles, colorKey);
    const inferredMode = hoverColor && hoverColor !== defaultColor ? 'manual' : 'auto';
    this.setStyleValue(styles, modeKey, inferredMode);
    return true;
  }

  private async processUpdates(queryRunner: QueryRunner, components: any[]): Promise<number> {
    let updatedCount = 0;

    for (const component of components) {
      const componentType = component.type;
      const styles: Styles = component.styles ? { ...component.styles } : {};

      const didUpdateDefaults = this.backfillDefaultStyles(styles, componentType);
      const didUpdateHoverMode = this.backfillHoverMode(styles, componentType);
      const didUpdate = didUpdateDefaults || didUpdateHoverMode;

      if (!didUpdate) continue;

      await queryRunner.query(`UPDATE components SET styles = $1 WHERE id = $2`, [
        JSON.stringify(styles),
        component.id,
      ]);
      updatedCount++;
    }

    return updatedCount;
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
