import { MigrationInterface, QueryRunner } from 'typeorm';

// Self-contained by design: migrations import nothing but `typeorm` and declare their own types,
// so later changes to entities or shared helpers can't alter what this migration does.
// (Enforced by server/scripts/check-migrations.sh.)

type JsonObject = Record<string, unknown>;

// Shape of a `components` row this migration reads and writes (physical column names).
interface ComponentRow {
  id: string;
  properties: JsonObject | null;
  styles: JsonObject | null;
  general_properties: JsonObject | null;
  general_styles: JsonObject | null;
  validation: JsonObject | null;
}

const COMPONENT_TYPE = 'DaterangePicker';
const BATCH_SIZE = 100;

// SQL NULL for null/undefined; JSON.stringify(null) would store a JSON `null` instead.
const toJsonParam = (value: unknown): string | null => (value == null ? null : JSON.stringify(value));

export class MoveVisibilityDisabledStatesToPropertiesDaterangePicker1733771653728 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const migrationName = this.constructor.name;

    const [{ count }] = await queryRunner.query(`SELECT COUNT(*) FROM components WHERE type = $1`, [COMPONENT_TYPE]);
    const total = parseInt(count, 10);
    console.log(`${migrationName}: [START] Migrate ${COMPONENT_TYPE} components: ${total}`);

    // Keyset pagination on id: every row is visited exactly once regardless of what the transform changes.
    let lastId = '00000000-0000-0000-0000-000000000000';
    let processed = 0;

    while (true) {
      const rows: ComponentRow[] = await queryRunner.query(
        `SELECT id, properties, styles, general_properties, general_styles, validation
         FROM components
         WHERE type = $1 AND id > $2
         ORDER BY id ASC
         LIMIT $3`,
        [COMPONENT_TYPE, lastId, BATCH_SIZE]
      );

      if (rows.length === 0) break;
      lastId = rows[rows.length - 1].id;

      for (const row of rows) {
        this.transform(row);

        await queryRunner.query(
          `UPDATE components SET
             properties = $1::json,
             styles = $2::json,
             general_properties = $3::json,
             general_styles = $4::json,
             validation = $5::json,
             updated_at = now()
           WHERE id = $6`,
          [
            toJsonParam(row.properties),
            toJsonParam(row.styles),
            toJsonParam(row.general_properties),
            toJsonParam(row.general_styles),
            toJsonParam(row.validation),
            row.id,
          ]
        );
      }

      processed += rows.length;
      const percent = total ? ((processed / total) * 100).toFixed(1) : '100.0';
      console.log(`${migrationName}: [PROGRESS] ${processed}/${total} (${percent}%)`);
    }

    console.log(`${migrationName}: [SUCCESS] Migrate ${COMPONENT_TYPE} components finished.`);
  }

  // Transform logic is unchanged from the original entity-based version; only column names differ.
  private transform(component: ComponentRow) {
    const properties = component.properties;
    const styles = component.styles;
    const general = component.general_properties;
    const generalStyles = component.general_styles;

    if (styles.visibility) {
      properties.visibility = styles.visibility;
      delete styles.visibility;
    }

    if (styles.disabledState) {
      properties.disabledState = styles.disabledState;
      delete styles.disabledState;
    }

    if (generalStyles?.boxShadow) {
      styles.boxShadow = generalStyles?.boxShadow;
      delete generalStyles?.boxShadow;
    }

    if (general?.tooltip) {
      properties.tooltip = general?.tooltip;
      delete general?.tooltip;
    }

    // Label and value
    if (properties.label == undefined || null) {
      properties.label = '';
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
