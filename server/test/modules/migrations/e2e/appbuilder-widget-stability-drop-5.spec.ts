/**
 * Covers: the widget stability drop 5 migrations in migrations/data and migrations/cleanup. The RichTextEditor,
 * Calendar and SvgImage key moves copy each key with migration-helpers/component-key-moves.ts and keep both places
 * equal until their cleanup; the Form backfill pins registerNestedFields off where it is missing. Runs the real
 * classes the way the runner does: every up(), then every beforeCommit(), in one transaction; each cleanup step in its
 * own short transaction. The runner itself is covered by appbuilder-key-move.spec.ts.
 * @group database
 */
import { DataSource, QueryRunner } from 'typeorm';
import { createScratchDatabase, dropScratchDatabase, postgres } from '../fixtures/harness';
import { BackfillRegisterNestedFieldsForForm1795418406136 } from '../../../../migrations/data/1795418406136-BackfillRegisterNestedFieldsForForm';
import { CopyRichTextEditorAdditionalActions1795418406137 } from '../../../../migrations/data/1795418406137-CopyRichTextEditorAdditionalActions';
import { CopyCalendarAdditionalActions1795418406138 } from '../../../../migrations/data/1795418406138-CopyCalendarAdditionalActions';
import { CopySvgImageAdditionalActions1795418406139 } from '../../../../migrations/data/1795418406139-CopySvgImageAdditionalActions';
import { DropRichTextEditorOldAdditionalActions1795418406140 } from '../../../../migrations/cleanup/1795418406140-DropRichTextEditorOldAdditionalActions';
import { DropCalendarOldAdditionalActions1795418406141 } from '../../../../migrations/cleanup/1795418406141-DropCalendarOldAdditionalActions';
import { DropSvgImageOldAdditionalActions1795418406142 } from '../../../../migrations/cleanup/1795418406142-DropSvgImageOldAdditionalActions';

const VERSION = '11111111-1111-1111-1111-111111111111';
const OTHER_VERSION = '22222222-2222-2222-2222-222222222222';
const SHOWN = { value: '{{true}}' };
const HIDDEN = { value: '{{false}}' };
const DISABLED = { value: '{{true}}' };
const ENABLED = { value: '{{false}}' };
const PLAIN_TEXT = { value: 'plainText' };
const SHADOW = { value: '0px 0px 5px red' };
const OTHER_SHADOW = { value: '1px 1px 1px blue' };
const NESTED_OFF = { value: '{{false}}' };
const COLUMNS = ['properties', 'styles', 'general_properties', 'general_styles'] as const;

type Widget = Partial<Record<(typeof COLUMNS)[number], Record<string, unknown>>>;
const widget = ({ properties = {}, styles = {}, general_properties = {}, general_styles = {} }: Widget) => ({
  properties,
  styles,
  general_properties,
  general_styles,
});

describe('Widget stability drop 5 migrations: copy and backfill in the data phase, remove the old keys in cleanup', () => {
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
        new BackfillRegisterNestedFieldsForForm1795418406136(),
        new CopyRichTextEditorAdditionalActions1795418406137(),
        new CopyCalendarAdditionalActions1795418406138(),
        new CopySvgImageAdditionalActions1795418406139(),
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
        new DropRichTextEditorOldAdditionalActions1795418406140(),
        new DropCalendarOldAdditionalActions1795418406141(),
        new DropSvgImageOldAdditionalActions1795418406142(),
      ]) {
        await cleanup.up(queryRunner);
      }
    } finally {
      await queryRunner.release();
    }
  }

  async function syncsLeft(): Promise<string[]> {
    const rows: { name: string }[] = await db.query(
      `SELECT tgname AS name FROM pg_trigger WHERE tgname LIKE 'trg_components_sync_%' ORDER BY tgname`
    );
    return rows.map(({ name }) => name);
  }

  it('should copy each moved key, keep both places equal for either release, and leave only the new places after cleanup', async () => {
    // Saved by the previous release.
    await save('editor', 'RichTextEditor', {
      properties: { placeholder: { value: 'Write here' } },
      styles: { visibility: HIDDEN, disabledState: DISABLED },
      general_properties: { tooltip: { value: 'Notes' } },
      general_styles: { boxShadow: SHADOW },
    });
    await save('calendar', 'Calendar', {
      styles: { visibility: HIDDEN },
      general_properties: { tooltip: { value: 'Schedule' } },
      general_styles: { boxShadow: SHADOW },
    });
    await save('svg', 'SvgImage', {
      properties: { data: { value: '<svg/>' } },
      styles: { visibility: HIDDEN },
      general_properties: { tooltip: { value: 'Logo' } },
      general_styles: { boxShadow: SHADOW },
    });
    // A value already at the new place wins over the old one.
    await save('calendar-new-place', 'Calendar', {
      properties: { visibility: SHOWN },
      styles: { visibility: HIDDEN, boxShadow: OTHER_SHADOW },
      general_styles: { boxShadow: SHADOW },
    });
    // A RichTextEditor or Calendar without a tooltip gets no tooltipFormat; every SvgImage does.
    await save('editor-no-tooltip', 'RichTextEditor', {});
    await save('svg-no-tooltip', 'SvgImage', {});
    await save('button', 'Button', { styles: { visibility: HIDDEN } }, OTHER_VERSION);

    await dataPhase();

    expect(await stored('editor')).toEqual(
      widget({
        properties: {
          placeholder: { value: 'Write here' },
          visibility: HIDDEN,
          disabledState: DISABLED,
          tooltip: { value: 'Notes' },
          tooltipFormat: PLAIN_TEXT,
        },
        styles: { visibility: HIDDEN, disabledState: DISABLED, boxShadow: SHADOW },
        general_properties: { tooltip: { value: 'Notes' } },
        general_styles: { boxShadow: SHADOW },
      })
    );
    expect(await stored('calendar')).toEqual(
      widget({
        properties: { visibility: HIDDEN, tooltip: { value: 'Schedule' }, tooltipFormat: PLAIN_TEXT },
        styles: { visibility: HIDDEN, boxShadow: SHADOW },
        general_properties: { tooltip: { value: 'Schedule' } },
        general_styles: { boxShadow: SHADOW },
      })
    );
    expect(await stored('svg')).toEqual(
      widget({
        properties: {
          data: { value: '<svg/>' },
          visibility: HIDDEN,
          tooltip: { value: 'Logo' },
          tooltipFormat: PLAIN_TEXT,
        },
        styles: { visibility: HIDDEN, boxShadow: SHADOW },
        general_properties: { tooltip: { value: 'Logo' } },
        general_styles: { boxShadow: SHADOW },
      })
    );
    expect(await stored('calendar-new-place')).toEqual(
      widget({
        properties: { visibility: SHOWN },
        styles: { visibility: HIDDEN, boxShadow: OTHER_SHADOW },
        general_styles: { boxShadow: SHADOW },
      })
    );
    expect(await stored('editor-no-tooltip')).toEqual(widget({}));
    expect(await stored('svg-no-tooltip')).toEqual(widget({ properties: { tooltipFormat: PLAIN_TEXT } }));
    expect(await stored('button')).toEqual(widget({ styles: { visibility: HIDDEN } }));
    // Undo history of the version whose widgets changed is gone; the other version keeps its own.
    expect(await db.query('SELECT app_version_id FROM app_history')).toEqual([{ app_version_id: OTHER_VERSION }]);

    // An editor tab opened before the upgrade writes the old place: this release reads it.
    await edit('svg', 'general_properties', 'tooltip', { value: 'From an old tab' });
    expect((await stored('svg')).properties.tooltip).toEqual({ value: 'From an old tab' });
    // This release enables the editor at the new place; a rollback reads the old place.
    await edit('editor', 'properties', 'disabledState', ENABLED);
    expect((await stored('editor')).styles.disabledState).toEqual(ENABLED);
    // This release changes the calendar's shadow at the new place; a rollback reads the old place.
    await edit('calendar', 'styles', 'boxShadow', OTHER_SHADOW);
    expect((await stored('calendar')).general_styles.boxShadow).toEqual(OTHER_SHADOW);
    // This release creates a calendar with only the new places; the previous release can still render it.
    await save('calendar-created', 'Calendar', {
      properties: { visibility: HIDDEN, tooltip: { value: 'New' } },
      styles: { boxShadow: SHADOW },
    });
    expect(await stored('calendar-created')).toEqual(
      widget({
        properties: { visibility: HIDDEN, tooltip: { value: 'New' } },
        styles: { visibility: HIDDEN, boxShadow: SHADOW },
        general_properties: { tooltip: { value: 'New' } },
        general_styles: { boxShadow: SHADOW },
      })
    );
    expect(await syncsLeft()).toEqual([
      'trg_components_sync_calendar_additional_actions',
      'trg_components_sync_rich_text_editor_additional_actions',
      'trg_components_sync_svg_image_additional_actions',
    ]);

    await cleanupPhase();

    expect(await stored('editor')).toEqual(
      widget({
        properties: {
          placeholder: { value: 'Write here' },
          visibility: HIDDEN,
          disabledState: ENABLED,
          tooltip: { value: 'Notes' },
          tooltipFormat: PLAIN_TEXT,
        },
        styles: { boxShadow: SHADOW },
      })
    );
    expect(await stored('calendar')).toEqual(
      widget({
        properties: { visibility: HIDDEN, tooltip: { value: 'Schedule' }, tooltipFormat: PLAIN_TEXT },
        styles: { boxShadow: OTHER_SHADOW },
      })
    );
    expect(await stored('svg')).toEqual(
      widget({
        properties: {
          data: { value: '<svg/>' },
          visibility: HIDDEN,
          tooltip: { value: 'From an old tab' },
          tooltipFormat: PLAIN_TEXT,
        },
        styles: { boxShadow: SHADOW },
      })
    );
    expect(await stored('calendar-new-place')).toEqual(
      widget({ properties: { visibility: SHOWN }, styles: { boxShadow: OTHER_SHADOW } })
    );
    expect(await stored('calendar-created')).toEqual(
      widget({ properties: { visibility: HIDDEN, tooltip: { value: 'New' } }, styles: { boxShadow: SHADOW } })
    );
    expect(await stored('button')).toEqual(widget({ styles: { visibility: HIDDEN } }));
    expect(await syncsLeft()).toEqual([]);
  }, 120_000);

  it('should copy every SvgImage, including more than one batch saved in the same transaction', async () => {
    // The old migration paged by OFFSET ordered by created_at alone. Rows saved by one app create or import share
    // that timestamp, so a page could repeat some rows and skip others. The copy pages by id.
    const count = 2_100;
    await db.query(
      `INSERT INTO components (name, type, page_id, properties, styles, general_properties, general_styles)
       SELECT 'svg-' || n, 'SvgImage', (SELECT id FROM pages WHERE app_version_id = $1), '{}',
              $2, '{}', '{}'
       FROM generate_series(1, $3) AS n`,
      [VERSION, JSON.stringify({ visibility: HIDDEN }), count]
    );

    await dataPhase();

    const [{ copied }] = await db.query(
      `SELECT COUNT(*)::int AS copied FROM components
       WHERE type = 'SvgImage' AND properties::jsonb -> 'visibility' = $1::jsonb`,
      [JSON.stringify(HIDDEN)]
    );
    expect(copied).toBe(count);
  }, 120_000);

  it('should pin registerNestedFields off on every existing Form, keep a value already set, and change nothing on a rerun', async () => {
    await save('form', 'Form', { properties: { buttonToSubmit: { value: 'button1' } } });
    await save('form-set', 'Form', { properties: { registerNestedFields: { value: '{{true}}' } } });
    await save('container', 'Container', {});

    await dataPhase();

    expect((await stored('form')).properties).toEqual({
      buttonToSubmit: { value: 'button1' },
      registerNestedFields: NESTED_OFF,
    });
    expect((await stored('form-set')).properties).toEqual({ registerNestedFields: { value: '{{true}}' } });
    expect((await stored('container')).properties).toEqual({});
  }, 120_000);

  it('should change nothing when the data phase runs again', async () => {
    await save('editor', 'RichTextEditor', {
      styles: { visibility: HIDDEN },
      general_properties: { tooltip: { value: 'Notes' } },
    });
    await save('calendar', 'Calendar', { general_styles: { boxShadow: SHADOW } });
    await save('svg', 'SvgImage', { styles: { visibility: HIDDEN } });
    await save('form', 'Form', {});

    await dataPhase();
    const before = await db.query(`SELECT name, ${COLUMNS.join(', ')} FROM components ORDER BY name`);
    await dataPhase();

    expect(await db.query(`SELECT name, ${COLUMNS.join(', ')} FROM components ORDER BY name`)).toEqual(before);
  }, 120_000);
});
