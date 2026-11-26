/**
 * Covers: migrations/data/1792950330429-BackfillStripPercentRangeSliderV2.ts. Every RangeSliderV2 that exists at
 * upgrade gets `stripPercent`, so it keeps stripping the first `%` from its mark labels; a slider created afterwards
 * has no key and shows them. Runs the real class on a scratch database, in one transaction as the data phase does.
 * @group database
 */
import { DataSource, QueryRunner } from 'typeorm';
import { createScratchDatabase, dropScratchDatabase, postgres } from '../fixtures/harness';
import { BackfillStripPercentRangeSliderV21792950330429 } from '../../../../migrations/data/1792950330429-BackfillStripPercentRangeSliderV2';

const VERSION = '11111111-1111-1111-1111-111111111111';
const OTHER_VERSION = '22222222-2222-2222-2222-222222222222';
const STRIP = { value: '{{true}}' };
const MARKS = { value: '{{[{label: "25%", value: 25}]}}' };

describe('BackfillStripPercentRangeSliderV2: existing sliders keep stripping the percent sign', () => {
  const database = `tooljet_migration_strip_percent_${process.pid}`;
  let db: DataSource;

  beforeEach(async () => {
    await createScratchDatabase(database);
    db = await new DataSource({ type: 'postgres', ...postgres, database }).initialize();
    await db.query(`
      CREATE TABLE pages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), app_version_id uuid NOT NULL);
      CREATE TABLE components (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text UNIQUE NOT NULL, type text NOT NULL,
        page_id uuid NOT NULL REFERENCES pages (id), properties json);
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

  /** Stores the properties text exactly as given, the way a json column keeps it. */
  async function save(name: string, type: string, properties: string | null, version = VERSION) {
    await db.query(
      `INSERT INTO components (name, type, page_id, properties)
       VALUES ($1, $2, (SELECT id FROM pages WHERE app_version_id = $3), $4::json)`,
      [name, type, version, properties]
    );
  }

  async function stored(name: string) {
    const [row] = await db.query(`SELECT properties FROM components WHERE name = $1`, [name]);
    return row.properties;
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

  const up = () => inTransaction((queryRunner) => new BackfillStripPercentRangeSliderV21792950330429().up(queryRunner));
  const down = () =>
    inTransaction((queryRunner) => new BackfillStripPercentRangeSliderV21792950330429().down(queryRunner));

  it('should mark every existing slider, keep a value already set, leave other components alone, and clear only the changed versions history', async () => {
    await save('slider', 'RangeSliderV2', JSON.stringify({ marks: MARKS }));
    await save('slider-empty', 'RangeSliderV2', null);
    await save('slider-set', 'RangeSliderV2', JSON.stringify({ stripPercent: { value: '{{false}}' } }), OTHER_VERSION);
    await save('text', 'Text', JSON.stringify({ text: { value: '50%' } }));

    await up();

    expect(await stored('slider')).toEqual({ marks: MARKS, stripPercent: STRIP });
    expect(await stored('slider-empty')).toEqual({ stripPercent: STRIP });
    expect(await stored('slider-set')).toEqual({ stripPercent: { value: '{{false}}' } });
    expect(await stored('text')).toEqual({ text: { value: '50%' } });
    // Nothing in the other version changed, so its undo history stays.
    expect(await db.query('SELECT app_version_id FROM app_history')).toEqual([{ app_version_id: OTHER_VERSION }]);
  }, 120_000);

  it('should mark a slider whose properties hold an escaped NUL or half an emoji, and keep those characters', async () => {
    // ::jsonb rejects both, even under a key the migration never reads; the json column stores them.
    await save('slider-nul', 'RangeSliderV2', '{"label":{"value":"a\\u0000b"}}');
    await save('slider-surrogate', 'RangeSliderV2', '{"label":{"value":"cut \\ud83d"}}');

    await up();

    const rows: { name: string; properties: string }[] = await db.query(
      `SELECT name, properties::text AS properties FROM components ORDER BY name`
    );
    expect(rows).toEqual([
      { name: 'slider-nul', properties: '{"label":{"value":"a\\u0000b"},"stripPercent":{"value":"{{true}}"}}' },
      { name: 'slider-surrogate', properties: '{"label":{"value":"cut \\ud83d"},"stripPercent":{"value":"{{true}}"}}' },
    ]);
  }, 120_000);

  it('should mark every slider across more than one batch', async () => {
    const count = 2_100;
    await db.query(
      `INSERT INTO components (name, type, page_id, properties)
       SELECT 'slider-' || n, 'RangeSliderV2', (SELECT id FROM pages WHERE app_version_id = $1), '{}'
       FROM generate_series(1, $2) AS n`,
      [VERSION, count]
    );

    await up();

    const [{ marked }] = await db.query(
      `SELECT COUNT(*)::int AS marked FROM components WHERE properties::text LIKE '%"stripPercent"%'`
    );
    expect(marked).toBe(count);
  }, 120_000);

  it('should change nothing when it runs again, and remove the key on down()', async () => {
    await save('slider', 'RangeSliderV2', JSON.stringify({ marks: MARKS }));

    await up();
    const once = await stored('slider');
    await up();
    expect(await stored('slider')).toEqual(once);

    await down();
    expect(await stored('slider')).toEqual({ marks: MARKS });
  }, 120_000);
});
