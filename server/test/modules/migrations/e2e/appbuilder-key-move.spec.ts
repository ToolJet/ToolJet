/**
 * Covers: migration-helpers/component-key-moves.ts with run-all-migrations.ts and migration-mode.ts for App Builder
 * key moves (server/docs/APP_DEFINITION_MIGRATIONS.md): a data migration copies a component key to its new place and
 * adds a trigger that keeps both places equal; a cleanup migration shipped in the same release drops the trigger and
 * the old key one upgrade later. The fixtures are the doc's templates verbatim, so this checks the code the team copies.
 * @group database
 */
import { DataSource, QueryRunner } from 'typeorm';
import { classifyLocks } from 'src/migration-helpers/lock-probe';
import {
  createScratchDatabase,
  dropScratchDatabase,
  postgres,
  spawnPod,
  withScratchConnection,
} from '../fixtures/harness';
import { CopyFixtureWidgetKeys1790800000021 } from '../fixtures/migration-sets/appbuilder-key-move/data/1790800000021-CopyFixtureWidgetKeys';

const FIXTURE_SET = 'appbuilder-key-move';
const COPY = 'CopyFixtureWidgetKeys1790800000021';
const CLEANUP = 'DropFixtureWidgetOldKeys1790800000022';
const SYNC_TRIGGER = 'trg_components_sync_svg_image_additional_actions';
const SHADOW = '0px 4px 12px 0px #00000059';
const SVG = { data: { value: '<svg/>' } };
const SHOWN = { value: '{{true}}' };
const HIDDEN = { value: '{{false}}' };
/** More rows than one 2000-row batch, so the copy pages through them. */
const BULK_ROWS = 2500;
const VERSION_WITH_SVGS = '11111111-1111-1111-1111-111111111111';
const VERSION_WITHOUT_SVGS = '22222222-2222-2222-2222-222222222222';

/** A hidden SvgImage with a tooltip and a shadow, as the previous release saves it. */
const previousReleaseSvg = (tooltip: string) => ({
  properties: { ...SVG },
  styles: { visibility: { value: '{{false}}' }, alignment: { value: 'left' } },
  general_properties: { tooltip: { value: tooltip } },
  general_styles: { boxShadow: { value: SHADOW } },
});

/** The same widget once the copy ran: both places hold the values. */
const copiedSvg = (tooltip: string) => ({
  properties: { ...SVG, visibility: { value: '{{false}}' }, tooltip: { value: tooltip } },
  styles: { visibility: { value: '{{false}}' }, alignment: { value: 'left' }, boxShadow: { value: SHADOW } },
  general_properties: { tooltip: { value: tooltip } },
  general_styles: { boxShadow: { value: SHADOW } },
});

/** The same widget once the cleanup ran: only the new places. */
const contractedSvg = (tooltip: string) => ({
  properties: { ...SVG, visibility: { value: '{{false}}' }, tooltip: { value: tooltip } },
  styles: { alignment: { value: 'left' }, boxShadow: { value: SHADOW } },
  general_properties: {},
  general_styles: {},
});

const BUTTON = {
  properties: { text: { value: 'Save' } },
  styles: { visibility: { value: '{{false}}' } },
  general_properties: { tooltip: { value: 'Not an SvgImage' } },
  general_styles: { boxShadow: { value: SHADOW } },
};

const COLUMNS = ['properties', 'styles', 'general_properties', 'general_styles'];

describe('App Builder key move: copy in the data phase, remove the old key in cleanup one upgrade later', () => {
  const database = `tooljet_migration_keymove_${process.pid}`;
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
      INSERT INTO pages (app_version_id) VALUES ('${VERSION_WITH_SVGS}'), ('${VERSION_WITHOUT_SVGS}')`);
    await save('svg', 'SvgImage', previousReleaseSvg('Company logo'));
    await save('button', 'Button', BUTTON, VERSION_WITHOUT_SVGS);
    await db.query(
      `INSERT INTO components (name, type, page_id, properties, styles, general_properties, general_styles)
       SELECT 'bulk-' || n, 'SvgImage', (SELECT id FROM pages WHERE app_version_id = $1), $2, $3, $4, $5
       FROM generate_series(1, ${BULK_ROWS}) AS n`,
      [VERSION_WITH_SVGS, ...COLUMNS.map((column) => JSON.stringify(previousReleaseSvg('Bulk')[column]))]
    );
    // Undo history: two entries for the version with SvgImages, one for the other version.
    await db.query(`
      WITH root AS (INSERT INTO app_history (app_version_id) VALUES ('${VERSION_WITH_SVGS}') RETURNING id)
      INSERT INTO app_history (app_version_id, parent_id) SELECT '${VERSION_WITH_SVGS}', id FROM root;
      INSERT INTO app_history (app_version_id) VALUES ('${VERSION_WITHOUT_SVGS}')`);
  }, 60_000);

  afterEach(async () => {
    await db?.destroy().catch(() => undefined);
    await dropScratchDatabase(database);
  }, 60_000);

  async function save(name: string, type: string, widget: Record<string, object>, version = VERSION_WITH_SVGS) {
    await db.query(
      `INSERT INTO components (name, type, page_id, properties, styles, general_properties, general_styles)
       VALUES ($1, $2, (SELECT id FROM pages WHERE app_version_id = $3), $4, $5, $6, $7)`,
      [name, type, version, ...COLUMNS.map((column) => JSON.stringify(widget[column]))]
    );
  }

  async function stored(name: string) {
    const [row] = await db.query(`SELECT ${COLUMNS.join(', ')} FROM components WHERE name = $1`, [name]);
    return row;
  }

  /** Saves one key the way the editor does: the server merges the change into the stored column and writes it back. */
  async function edit(name: string, column: string, key: string, value: object) {
    const [row] = await db.query(`SELECT ${column} AS value FROM components WHERE name = $1`, [name]);
    await db.query(`UPDATE components SET ${column} = $1 WHERE name = $2`, [
      JSON.stringify({ ...row.value, [key]: value }),
      name,
    ]);
  }

  async function syncTriggerExists(): Promise<boolean> {
    const [{ exists }] = await db.query('SELECT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = $1) AS exists', [
      SYNC_TRIGGER,
    ]);
    return exists;
  }

  /** SvgImages still holding an old key, and SvgImages still missing a new one. */
  async function svgCounts() {
    const [counts] = await db.query(`SELECT
      count(*) FILTER (WHERE styles::jsonb ? 'visibility' OR general_properties::jsonb ? 'tooltip'
                         OR general_styles::jsonb ? 'boxShadow')::int AS "withOldKeys",
      count(*) FILTER (WHERE NOT (properties::jsonb ? 'visibility' AND properties::jsonb ? 'tooltip'
                         AND styles::jsonb ? 'boxShadow'))::int AS "missingNewKeys"
      FROM components WHERE type = 'SvgImage'`);
    return counts;
  }

  async function historyByVersion() {
    const rows: { version: string; entries: number }[] = await db.query(
      'SELECT app_version_id AS version, count(*)::int AS entries FROM app_history GROUP BY app_version_id'
    );
    return Object.fromEntries(rows.map(({ version, entries }) => [version, entries]));
  }

  async function recorded(): Promise<string[]> {
    return (await db.query('SELECT name FROM migrations')).map(({ name }: { name: string }) => name);
  }

  /** An instance in use: the previous release already recorded a migration, so this is not a fresh install. */
  async function previousReleaseRecorded() {
    await db.query(`CREATE TABLE migrations (id SERIAL PRIMARY KEY, timestamp bigint NOT NULL, name varchar NOT NULL);
                    INSERT INTO migrations (timestamp, name) VALUES (1700000000001, 'EarlierRelease1700000000001')`);
  }

  const upgrade = (podId: string, env: Record<string, string> = {}) =>
    spawnPod({ podId, database, fixtureSet: FIXTURE_SET, env }).done;

  /** Dropping the baseline makes the next run count as the next release's first upgrade. */
  const nextRelease = () => db.query('DELETE FROM migration_baselines');

  const HOLDING_BACK = `Holding back ${CLEANUP} until an earlier upgrade has recorded ${COPY}.`;
  const TOTAL = BULK_ROWS + 1;

  describe('Async mode: schema, data and cleanup phases', () => {
    it('should copy in the data phase, hold the cleanup back on that upgrade, then remove the old keys on the next one', async () => {
      await previousReleaseRecorded();
      expect(await upgrade('keymove-schema', { MIGRATION_PHASE: 'schema' })).toMatchObject({ exitCode: 0 });
      const data = await upgrade('keymove-data', { MIGRATION_PHASE: 'data' });
      expect(data).toMatchObject({ exitCode: 0, result: { error: null } });

      // Expand: every SvgImage got its new keys and kept its old ones, in two batches.
      expect(data.stdout).toContain(`[PROGRESS] 2000/${TOTAL}`);
      expect(data.stdout).toContain(`[PROGRESS] ${TOTAL}/${TOTAL}`);
      expect(await stored('svg')).toEqual(copiedSvg('Company logo'));
      expect(await svgCounts()).toEqual({ withOldKeys: TOTAL, missingNewKeys: 0 });
      expect(await historyByVersion()).toEqual({ [VERSION_WITHOUT_SVGS]: 1 });
      expect(await syncTriggerExists()).toBe(true);

      const firstCleanup = await upgrade('keymove-cleanup-1', { MIGRATION_PHASE: 'cleanup' });
      expect(firstCleanup).toMatchObject({ exitCode: 0, result: { error: null } });
      expect(firstCleanup.stdout).toContain(HOLDING_BACK);
      expect(await recorded()).toEqual(expect.arrayContaining([COPY]));
      expect(await recorded()).not.toContain(CLEANUP);
      expect(await stored('svg')).toEqual(copiedSvg('Company logo'));

      // Old code saves a widget after the copy ran (an editor tab opened before the upgrade, or an old pod): the
      // trigger gives it the new places at once, so this release shows its values, not the defaults.
      await save('late', 'SvgImage', previousReleaseSvg('Saved by old code'));
      expect(await stored('late')).toEqual(copiedSvg('Saved by old code'));

      await nextRelease();
      const nextCleanup = await upgrade('keymove-cleanup-2', { MIGRATION_PHASE: 'cleanup' });
      expect(nextCleanup).toMatchObject({ exitCode: 0, result: { error: null } });
      expect(await recorded()).toEqual(expect.arrayContaining([COPY, CLEANUP]));
      expect(await syncTriggerExists()).toBe(false);
      expect(await stored('svg')).toEqual(contractedSvg('Company logo'));
      expect(await stored('late')).toEqual(contractedSvg('Saved by old code'));
      expect(await svgCounts()).toEqual({ withOldKeys: 0, missingNewKeys: 0 });
      expect(await stored('button')).toEqual(BUTTON);
    }, 300_000);
  });

  describe('Blocking mode: one transaction', () => {
    it('should copy and hold the cleanup back on the upgrade that ships both, then run it on the next upgrade', async () => {
      await previousReleaseRecorded();

      const firstUpgrade = await upgrade('keymove-single-1');
      expect(firstUpgrade).toMatchObject({ exitCode: 0, result: { error: null } });
      expect(firstUpgrade.stdout).toContain(HOLDING_BACK);
      expect(await recorded()).not.toContain(CLEANUP);
      expect(await stored('svg')).toEqual(copiedSvg('Company logo'));
      expect(await syncTriggerExists()).toBe(true);

      await nextRelease();
      expect(await upgrade('keymove-single-2')).toMatchObject({ exitCode: 0, result: { error: null } });
      expect(await recorded()).toEqual(expect.arrayContaining([COPY, CLEANUP]));
      expect(await syncTriggerExists()).toBe(false);
      expect(await stored('svg')).toEqual(contractedSvg('Company logo'));
      expect(await svgCounts()).toEqual({ withOldKeys: 0, missingNewKeys: 0 });
      expect(await stored('button')).toEqual(BUTTON);
    }, 300_000);

    it('should run the copy and the cleanup together on a fresh install, where no earlier release can be rolled back to', async () => {
      expect(await upgrade('keymove-fresh')).toMatchObject({ exitCode: 0, result: { error: null } });
      expect(await recorded()).toEqual(expect.arrayContaining([COPY, CLEANUP]));
      expect(await stored('svg')).toEqual(contractedSvg('Company logo'));
      expect(await syncTriggerExists()).toBe(false);
    }, 300_000);
  });

  describe('Both places stay equal until the cleanup', () => {
    it('should carry each edit to the other place, whichever release saves it, and keep it through the cleanup', async () => {
      await previousReleaseRecorded();
      expect(await upgrade('keymove-sync-1')).toMatchObject({ exitCode: 0, result: { error: null } });

      // An editor tab opened before the upgrade shows the image. It writes the old place only; this release reads
      // the new one.
      await edit('svg', 'styles', 'visibility', SHOWN);
      expect((await stored('svg')).properties.visibility).toEqual(SHOWN);

      // This release hides it again. It writes the new place only; a rollback reads the old one.
      await edit('svg', 'properties', 'visibility', HIDDEN);
      expect((await stored('svg')).styles.visibility).toEqual(HIDDEN);

      // After a rollback, the previous release edits the tooltip at the old place; upgrading again must keep it.
      await edit('svg', 'general_properties', 'tooltip', { value: 'Edited after a rollback' });
      expect((await stored('svg')).properties.tooltip).toEqual({ value: 'Edited after a rollback' });

      // This release creates a widget with only the new places; the previous release can still render it.
      await save('created', 'SvgImage', contractedSvg('Created by this release'));
      expect(await stored('created')).toEqual(copiedSvg('Created by this release'));

      // Other widget types keep their keys where they are.
      await edit('button', 'styles', 'visibility', SHOWN);
      expect(await stored('button')).toEqual({ ...BUTTON, styles: { visibility: SHOWN } });

      await nextRelease();
      expect(await upgrade('keymove-sync-2')).toMatchObject({ exitCode: 0, result: { error: null } });
      expect(await syncTriggerExists()).toBe(false);
      expect(await stored('svg')).toEqual(contractedSvg('Edited after a rollback'));
      expect(await stored('created')).toEqual(contractedSvg('Created by this release'));
      expect(await svgCounts()).toEqual({ withOldKeys: 0, missingNewKeys: 0 });

      // Once the cleanup ran, nothing puts an old key back.
      await edit('svg', 'properties', 'visibility', SHOWN);
      expect((await stored('svg')).styles).toEqual(contractedSvg('Edited after a rollback').styles);
    }, 300_000);
  });

  describe('Locks', () => {
    /** Table locks one step holds at the end of its transaction. */
    const locksHeldBy = (step: (queryRunner: QueryRunner) => Promise<void>) =>
      withScratchConnection(database, async (connection) => {
        const queryRunner = connection.createQueryRunner();
        await queryRunner.startTransaction();
        try {
          await step(queryRunner);
          const locks: { table: string; mode: string }[] = await queryRunner.query(
            `SELECT c.relname AS "table", l.mode FROM pg_locks l JOIN pg_class c ON c.oid = l.relation
             WHERE l.pid = pg_backend_pid() AND l.locktype = 'relation' AND c.relkind = 'r'
               AND c.relnamespace = 'public'::regnamespace`
          );
          return locks.map((lock) => ({ ...lock, existed: true }));
        } finally {
          await queryRunner.rollbackTransaction();
          await queryRunner.release();
        }
      });
    /** Modes above plain row locks; row locks never block a read. */
    const stronger = (locks: { mode: string }[]) =>
      locks
        .map(({ mode }) => mode)
        .filter((mode) => !['AccessShareLock', 'RowShareLock', 'RowExclusiveLock'].includes(mode));

    it('should only take row locks in the copy, and pause writes but never reads while adding the trigger', async () => {
      const copy = new CopyFixtureWidgetKeys1790800000021();
      const copyLocks = await locksHeldBy((queryRunner) => copy.up(queryRunner));
      expect(copyLocks).toContainEqual({ table: 'components', mode: 'RowExclusiveLock', existed: true });
      expect(stronger(copyLocks)).toEqual([]);
      expect(classifyLocks('data', 'up', copyLocks)).toEqual([]);

      const syncLocks = await locksHeldBy((queryRunner) => copy.beforeCommit(queryRunner));
      expect(stronger(syncLocks)).toEqual(['ShareRowExclusiveLock']);
      expect(classifyLocks('data', 'beforeCommit', syncLocks)).toEqual([]);
    }, 60_000);
  });
});
