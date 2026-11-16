/**
 * Covers: the widget-stability drop 5 migrations in migrations/data and migrations/cleanup. The RichTextEditor,
 * Calendar and SvgImage key moves copy each key with migration-helpers/component-key-moves.ts and keep both places
 * equal until their cleanups; the Form and RangeSliderV2 backfills add a key where it is missing. Runs the real
 * classes the way the runner does: every up(), then every beforeCommit(), in one transaction; each cleanup step in
 * its own short transaction. The runner itself is covered by appbuilder-key-move.spec.ts.
 * @group database
 */
import { DataSource, QueryRunner } from 'typeorm';
import { createScratchDatabase, dropScratchDatabase, postgres } from '../fixtures/harness';
import { BackfillRegisterNestedFieldsForForm1794252760834 } from '../../../../migrations/data/1794252760834-BackfillRegisterNestedFieldsForForm';
import { BackfillStripPercentRangeSliderV21794252760835 } from '../../../../migrations/data/1794252760835-BackfillStripPercentRangeSliderV2';
import { CopyRichTextEditorAdditionalActions1794252760836 } from '../../../../migrations/data/1794252760836-CopyRichTextEditorAdditionalActions';
import { CopyCalendarAdditionalActions1794252760837 } from '../../../../migrations/data/1794252760837-CopyCalendarAdditionalActions';
import { CopySvgImageAdditionalActions1794252760838 } from '../../../../migrations/data/1794252760838-CopySvgImageAdditionalActions';
import { DropRichTextEditorOldAdditionalActions1794252760839 } from '../../../../migrations/cleanup/1794252760839-DropRichTextEditorOldAdditionalActions';
import { DropCalendarOldAdditionalActions1794252760840 } from '../../../../migrations/cleanup/1794252760840-DropCalendarOldAdditionalActions';
import { DropSvgImageOldAdditionalActions1794252760841 } from '../../../../migrations/cleanup/1794252760841-DropSvgImageOldAdditionalActions';

const VERSION = '11111111-1111-1111-1111-111111111111';
const OTHER_VERSION = '22222222-2222-2222-2222-222222222222';
const SHADOW = { value: '0px 4px 12px 0px #00000059' };
const SHOWN = { value: '{{true}}' };
const HIDDEN = { value: '{{false}}' };
const DISABLED = { value: '{{true}}' };
const ENABLED = { value: '{{false}}' };
const PLAIN_TEXT = { value: 'plainText' };
const SYNCS = ['rich_text_editor_additional_actions', 'calendar_additional_actions', 'svg_image_additional_actions'];
const COLUMNS = ['properties', 'styles', 'general_properties', 'general_styles'] as const;

type Widget = Partial<Record<(typeof COLUMNS)[number], Record<string, unknown>>>;
const widget = ({ properties = {}, styles = {}, general_properties = {}, general_styles = {} }: Widget) => ({
  properties,
  styles,
  general_properties,
  general_styles,
});

describe('Widget drop 5 migrations: copy and backfill in the data phase, remove the old keys in cleanup', () => {
  const database = `tooljet_migration_drop5_${process.pid}`;
  let db: DataSource;

  beforeEach(async () => {
    await createScratchDatabase(database);
    db = await new DataSource({ type: 'postgres', ...postgres, database }).initialize();
    await db.query(`
      CREATE TABLE pages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), app_version_id uuid NOT NULL);
      CREATE TABLE components (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text UNIQUE NOT NULL, type text NOT NULL,
        page_id uuid NOT NULL REFERENCES pages (id),
        properties json NOT NULL, styles json NOT NULL, general_properties json, general_styles json);
      CREATE TABLE app_history (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), app_version_id uuid NOT NULL,
        parent_id uuid REFERENCES app_history (id));
      INSERT INTO pages (app_version_id) VALUES ('${VERSION}'), ('${OTHER_VERSION}');
      INSERT INTO app_history (app_version_id) VALUES ('${VERSION}'), ('${OTHER_VERSION}')`);
  }, 60_000);

  afterEach(async () => {
    await db?.destroy().catch(() => undefined);
    await dropScratchDatabase(database);
  }, 60_000);

  async function save(name: string, type: string, columns: Widget, version = VERSION) {
    const row = widget(columns);
    await db.query(
      `INSERT INTO components (name, type, page_id, properties, styles, general_properties, general_styles)
       VALUES ($1, $2, (SELECT id FROM pages WHERE app_version_id = $3), $4, $5, $6, $7)`,
      [name, type, version, ...COLUMNS.map((column) => JSON.stringify(row[column]))]
    );
  }

  async function stored(name: string) {
    const [row] = await db.query(`SELECT ${COLUMNS.join(', ')} FROM components WHERE name = $1`, [name]);
    return row;
  }

  /** Saves one key the way the editor does: the server merges the change into the stored column and writes it back. */
  async function edit(name: string, column: (typeof COLUMNS)[number], key: string, value: unknown) {
    const [row] = await db.query(`SELECT ${column} AS value FROM components WHERE name = $1`, [name]);
    await db.query(`UPDATE components SET ${column} = $1 WHERE name = $2`, [
      JSON.stringify({ ...row.value, [key]: value }),
      name,
    ]);
  }

  async function inTransaction(step: (queryRunner: QueryRunner) => Promise<void>) {
    const queryRunner = db.createQueryRunner();
    await queryRunner.startTransaction();
    try {
      await step(queryRunner);
      await queryRunner.commitTransaction();
    } finally {
      if (queryRunner.isTransactionActive) await queryRunner.rollbackTransaction();
      await queryRunner.release();
    }
  }

  /** The data phase: every up(), then every beforeCommit(), in one transaction. */
  const dataPhase = () =>
    inTransaction(async (queryRunner) => {
      const migrations = [
        new BackfillRegisterNestedFieldsForForm1794252760834(),
        new BackfillStripPercentRangeSliderV21794252760835(),
        new CopyRichTextEditorAdditionalActions1794252760836(),
        new CopyCalendarAdditionalActions1794252760837(),
        new CopySvgImageAdditionalActions1794252760838(),
      ];
      for (const migration of migrations) await migration.up(queryRunner);
      for (const migration of migrations) {
        if ('beforeCommit' in migration) await migration.beforeCommit(queryRunner);
      }
    });

  /** The cleanup phase: each migration opens its own short transactions. */
  async function cleanupPhase() {
    const queryRunner = db.createQueryRunner();
    try {
      for (const cleanup of [
        new DropRichTextEditorOldAdditionalActions1794252760839(),
        new DropCalendarOldAdditionalActions1794252760840(),
        new DropSvgImageOldAdditionalActions1794252760841(),
      ]) {
        await cleanup.up(queryRunner);
      }
    } finally {
      await queryRunner.release();
    }
  }

  async function syncsLeft(): Promise<string[]> {
    const rows: { name: string }[] = await db.query(
      `SELECT tgname AS name FROM pg_trigger WHERE tgname LIKE 'trg_components_sync_%'
       UNION ALL SELECT proname FROM pg_proc WHERE proname LIKE 'tj_sync_%'`
    );
    return rows.map(({ name }) => name);
  }

  it('should copy each moved key, keep both places equal for either release, and leave only the new places after cleanup', async () => {
    // Saved by the previous release. The bare tooltip was written through the API.
    await save('rte', 'RichTextEditor', {
      properties: { placeholder: { value: 'Notes' } },
      styles: { visibility: HIDDEN, disabledState: DISABLED },
      general_properties: { tooltip: 'Bare tooltip' },
      general_styles: { boxShadow: SHADOW },
    });
    await save('calendar', 'Calendar', {
      styles: { visibility: HIDDEN },
      general_properties: { tooltip: { value: 'Holidays' } },
      general_styles: { boxShadow: SHADOW },
    });
    await save('svg', 'SvgImage', {
      styles: { visibility: HIDDEN },
      general_properties: { tooltip: { value: 'Logo' } },
      general_styles: { boxShadow: SHADOW },
    });
    // A value already at the new place wins over the old one; no tooltip, so no tooltipFormat.
    await save('rte-new-place', 'RichTextEditor', {
      properties: { visibility: SHOWN },
      styles: { visibility: HIDDEN },
    });
    await save('button', 'Button', { styles: { visibility: HIDDEN } }, OTHER_VERSION);

    await dataPhase();

    expect(await stored('rte')).toEqual(
      widget({
        properties: {
          placeholder: { value: 'Notes' },
          visibility: HIDDEN,
          disabledState: DISABLED,
          tooltip: { value: 'Bare tooltip' },
          tooltipFormat: PLAIN_TEXT,
        },
        styles: { visibility: HIDDEN, disabledState: DISABLED, boxShadow: SHADOW },
        general_properties: { tooltip: 'Bare tooltip' },
        general_styles: { boxShadow: SHADOW },
      })
    );
    expect(await stored('calendar')).toEqual(
      widget({
        properties: { visibility: HIDDEN, tooltip: { value: 'Holidays' }, tooltipFormat: PLAIN_TEXT },
        styles: { visibility: HIDDEN, boxShadow: SHADOW },
        general_properties: { tooltip: { value: 'Holidays' } },
        general_styles: { boxShadow: SHADOW },
      })
    );
    expect(await stored('svg')).toEqual(
      widget({
        properties: { visibility: HIDDEN, tooltip: { value: 'Logo' }, tooltipFormat: PLAIN_TEXT },
        styles: { visibility: HIDDEN, boxShadow: SHADOW },
        general_properties: { tooltip: { value: 'Logo' } },
        general_styles: { boxShadow: SHADOW },
      })
    );
    expect(await stored('rte-new-place')).toEqual(
      widget({ properties: { visibility: SHOWN }, styles: { visibility: HIDDEN } })
    );
    expect(await stored('button')).toEqual(widget({ styles: { visibility: HIDDEN } }));
    // Undo history of the version whose widgets changed is gone; the other version keeps its own.
    expect(await db.query('SELECT app_version_id FROM app_history')).toEqual([{ app_version_id: OTHER_VERSION }]);

    // An editor tab opened before the upgrade writes a bare tooltip at the old place: this release reads the object.
    await edit('rte', 'general_properties', 'tooltip', 'From an old tab');
    expect((await stored('rte')).properties.tooltip).toEqual({ value: 'From an old tab' });
    // This release enables the editor at the new place; a rollback reads the old place.
    await edit('rte', 'properties', 'disabledState', ENABLED);
    expect((await stored('rte')).styles.disabledState).toEqual(ENABLED);
    // After a rollback, the previous release shows the image again; this release reads it.
    await edit('svg', 'styles', 'visibility', SHOWN);
    expect((await stored('svg')).properties.visibility).toEqual(SHOWN);
    // This release creates a calendar with only the new places; the previous release can still render it.
    await save('calendar-new', 'Calendar', {
      properties: { visibility: HIDDEN, tooltip: { value: 'New' } },
      styles: { boxShadow: SHADOW },
    });
    expect(await stored('calendar-new')).toEqual(
      widget({
        properties: { visibility: HIDDEN, tooltip: { value: 'New' } },
        styles: { visibility: HIDDEN, boxShadow: SHADOW },
        general_properties: { tooltip: { value: 'New' } },
        general_styles: { boxShadow: SHADOW },
      })
    );
    expect(await syncsLeft()).toHaveLength(SYNCS.length * 2);

    await cleanupPhase();

    expect(await stored('rte')).toEqual(
      widget({
        properties: {
          placeholder: { value: 'Notes' },
          visibility: HIDDEN,
          disabledState: ENABLED,
          tooltip: { value: 'From an old tab' },
          tooltipFormat: PLAIN_TEXT,
        },
        styles: { boxShadow: SHADOW },
      })
    );
    expect(await stored('calendar')).toEqual(
      widget({
        properties: { visibility: HIDDEN, tooltip: { value: 'Holidays' }, tooltipFormat: PLAIN_TEXT },
        styles: { boxShadow: SHADOW },
      })
    );
    expect(await stored('svg')).toEqual(
      widget({
        properties: { visibility: SHOWN, tooltip: { value: 'Logo' }, tooltipFormat: PLAIN_TEXT },
        styles: { boxShadow: SHADOW },
      })
    );
    expect(await stored('calendar-new')).toEqual(
      widget({ properties: { visibility: HIDDEN, tooltip: { value: 'New' } }, styles: { boxShadow: SHADOW } })
    );
    expect(await stored('rte-new-place')).toEqual(widget({ properties: { visibility: SHOWN } }));
    expect(await stored('button')).toEqual(widget({ styles: { visibility: HIDDEN } }));
    expect(await syncsLeft()).toEqual([]);
  }, 120_000);

  it('should pin the old behaviour on every existing Form and RangeSliderV2, and keep a value already set', async () => {
    await save('form', 'Form', {});
    await save('form-set', 'Form', { properties: { registerNestedFields: { value: '{{true}}' } } });
    await save('slider', 'RangeSliderV2', { properties: { min: { value: '0' } } });
    await save('slider-set', 'RangeSliderV2', { properties: { stripPercent: { value: '{{false}}' } } });
    await save('plain-svg', 'SvgImage', {});

    await dataPhase();

    expect((await stored('form')).properties).toEqual({ registerNestedFields: { value: '{{false}}' } });
    expect((await stored('form-set')).properties).toEqual({ registerNestedFields: { value: '{{true}}' } });
    expect((await stored('slider')).properties).toEqual({ min: { value: '0' }, stripPercent: { value: '{{true}}' } });
    expect((await stored('slider-set')).properties).toEqual({ stripPercent: { value: '{{false}}' } });
    // Every SvgImage gets the plain-text tooltip format, tooltip or not.
    expect((await stored('plain-svg')).properties).toEqual({ tooltipFormat: PLAIN_TEXT });

    // Running the data phase again changes nothing: each step only fills what is missing.
    const before = await db.query(`SELECT name, ${COLUMNS.join(', ')} FROM components ORDER BY name`);
    await dataPhase();
    expect(await db.query(`SELECT name, ${COLUMNS.join(', ')} FROM components ORDER BY name`)).toEqual(before);
  }, 120_000);
});
