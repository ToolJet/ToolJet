/**
 * Covers: the Spinner and BoundedBox key moves in migrations/data and migrations/cleanup. Each copies its keys with
 * migration-helpers/component-key-moves.ts and keeps both places equal until its cleanup. Runs the real classes the
 * way the runner does: every up(), then every beforeCommit(), in one transaction; each cleanup step in its own short
 * transaction. The runner itself is covered by appbuilder-key-move.spec.ts.
 * @group database
 */
import { DataSource, QueryRunner } from 'typeorm';
import { createScratchDatabase, dropScratchDatabase, postgres } from '../fixtures/harness';
import { CopySpinnerAdditionalActions1795097903387 } from '../../../../migrations/data/1795097903387-CopySpinnerAdditionalActions';
import { CopyBoundedBoxAdditionalActions1795097903388 } from '../../../../migrations/data/1795097903388-CopyBoundedBoxAdditionalActions';
import { DropSpinnerOldAdditionalActions1795097903389 } from '../../../../migrations/cleanup/1795097903389-DropSpinnerOldAdditionalActions';
import { DropBoundedBoxOldAdditionalActions1795097903390 } from '../../../../migrations/cleanup/1795097903390-DropBoundedBoxOldAdditionalActions';

const VERSION = '11111111-1111-1111-1111-111111111111';
const OTHER_VERSION = '22222222-2222-2222-2222-222222222222';
const SHOWN = { value: '{{true}}' };
const HIDDEN = { value: '{{false}}' };
const DISABLED = { value: '{{true}}' };
const ENABLED = { value: '{{false}}' };
const PLAIN_TEXT = { value: 'plainText' };
const COLOUR = { value: '#4D72FA' };
const COLUMNS = ['properties', 'styles', 'general_properties', 'general_styles'] as const;

type Widget = Partial<Record<(typeof COLUMNS)[number], Record<string, unknown>>>;
const widget = ({ properties = {}, styles = {}, general_properties = {}, general_styles = {} }: Widget) => ({
  properties,
  styles,
  general_properties,
  general_styles,
});

describe('Spinner and BoundedBox key moves: copy in the data phase, remove the old keys in cleanup', () => {
  const database = `tooljet_migration_backfill2_${process.pid}`;
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
        new CopySpinnerAdditionalActions1795097903387(),
        new CopyBoundedBoxAdditionalActions1795097903388(),
      ];
      for (const migration of migrations) await migration.up(queryRunner);
      for (const migration of migrations) await migration.beforeCommit(queryRunner);
    });

  /** The cleanup phase: each migration opens its own short transactions. */
  async function cleanupPhase() {
    const queryRunner = db.createQueryRunner();
    try {
      for (const cleanup of [
        new DropSpinnerOldAdditionalActions1795097903389(),
        new DropBoundedBoxOldAdditionalActions1795097903390(),
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
    await save('spinner', 'Spinner', {
      styles: { visibility: HIDDEN, colour: COLOUR },
      general_properties: { tooltip: { value: 'Loading' } },
    });
    await save('box', 'BoundedBox', {
      properties: { imageUrl: { value: 'https://example.com/a.png' } },
      styles: { visibility: HIDDEN, disabledState: DISABLED },
      general_properties: { tooltip: { value: 'Annotate' } },
    });
    // A value already at the new place wins over the old one.
    await save('spinner-new-place', 'Spinner', { properties: { visibility: SHOWN }, styles: { visibility: HIDDEN } });
    await save('button', 'Button', { styles: { visibility: HIDDEN } }, OTHER_VERSION);

    await dataPhase();

    expect(await stored('spinner')).toEqual(
      widget({
        properties: { visibility: HIDDEN, tooltip: { value: 'Loading' }, tooltipFormat: PLAIN_TEXT },
        styles: { visibility: HIDDEN, colour: COLOUR },
        general_properties: { tooltip: { value: 'Loading' } },
      })
    );
    expect(await stored('box')).toEqual(
      widget({
        properties: {
          imageUrl: { value: 'https://example.com/a.png' },
          visibility: HIDDEN,
          disabledState: DISABLED,
          tooltip: { value: 'Annotate' },
          tooltipFormat: PLAIN_TEXT,
        },
        styles: { visibility: HIDDEN, disabledState: DISABLED },
        general_properties: { tooltip: { value: 'Annotate' } },
      })
    );
    expect(await stored('spinner-new-place')).toEqual(
      widget({ properties: { visibility: SHOWN, tooltipFormat: PLAIN_TEXT }, styles: { visibility: HIDDEN } })
    );
    expect(await stored('button')).toEqual(widget({ styles: { visibility: HIDDEN } }));
    // Undo history of the version whose widgets changed is gone; the other version keeps its own.
    expect(await db.query('SELECT app_version_id FROM app_history')).toEqual([{ app_version_id: OTHER_VERSION }]);

    // An editor tab opened before the upgrade writes the old place: this release reads it.
    await edit('spinner', 'general_properties', 'tooltip', { value: 'From an old tab' });
    expect((await stored('spinner')).properties.tooltip).toEqual({ value: 'From an old tab' });
    // This release enables the box at the new place; a rollback reads the old place.
    await edit('box', 'properties', 'disabledState', ENABLED);
    expect((await stored('box')).styles.disabledState).toEqual(ENABLED);
    // This release creates a spinner with only the new places; the previous release can still render it.
    await save('spinner-created', 'Spinner', { properties: { visibility: HIDDEN, tooltip: { value: 'New' } } });
    expect(await stored('spinner-created')).toEqual(
      widget({
        properties: { visibility: HIDDEN, tooltip: { value: 'New' } },
        styles: { visibility: HIDDEN },
        general_properties: { tooltip: { value: 'New' } },
      })
    );
    expect(await syncsLeft()).toEqual([
      'trg_components_sync_bounded_box_additional_actions',
      'trg_components_sync_spinner_additional_actions',
    ]);

    await cleanupPhase();

    expect(await stored('spinner')).toEqual(
      widget({
        properties: { visibility: HIDDEN, tooltip: { value: 'From an old tab' }, tooltipFormat: PLAIN_TEXT },
        styles: { colour: COLOUR },
      })
    );
    expect(await stored('box')).toEqual(
      widget({
        properties: {
          imageUrl: { value: 'https://example.com/a.png' },
          visibility: HIDDEN,
          disabledState: ENABLED,
          tooltip: { value: 'Annotate' },
          tooltipFormat: PLAIN_TEXT,
        },
      })
    );
    expect(await stored('spinner-new-place')).toEqual(
      widget({ properties: { visibility: SHOWN, tooltipFormat: PLAIN_TEXT } })
    );
    expect(await stored('spinner-created')).toEqual(
      widget({ properties: { visibility: HIDDEN, tooltip: { value: 'New' } } })
    );
    expect(await stored('button')).toEqual(widget({ styles: { visibility: HIDDEN } }));
    expect(await syncsLeft()).toEqual([]);
  }, 120_000);

  it('should change nothing when the data phase runs again', async () => {
    await save('spinner', 'Spinner', { styles: { visibility: HIDDEN } });
    await save('box', 'BoundedBox', { styles: { disabledState: DISABLED } });

    await dataPhase();
    const before = await db.query(`SELECT name, ${COLUMNS.join(', ')} FROM components ORDER BY name`);
    await dataPhase();

    expect(await db.query(`SELECT name, ${COLUMNS.join(', ')} FROM components ORDER BY name`)).toEqual(before);
  }, 120_000);
});
