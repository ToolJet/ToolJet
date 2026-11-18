/** @group database */
import { randomUUID } from 'crypto';
import { DataSource, QueryRunner } from 'typeorm';
import { BackfillCodeModeBuildMode1792470000000 } from '@migrations/data/1792470000000-BackfillCodeModeBuildMode';
import { createScratchDatabase, dropScratchDatabase, postgres } from '../fixtures/harness';

describe('Code Mode build-mode backfill', () => {
  const database = `tooljet_code_mode_backfill_${process.pid}`;
  let db: DataSource;
  let runner: QueryRunner;
  const migration = new BackfillCodeModeBuildMode1792470000000();

  beforeAll(async () => {
    await createScratchDatabase(database);
    db = await new DataSource({ type: 'postgres', ...postgres, database }).initialize();
  });

  beforeEach(async () => {
    runner = db.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    await runner.query(`
      CREATE TEMP TABLE apps (id uuid PRIMARY KEY, build_mode text DEFAULT 'visual',
        CONSTRAINT apps_build_mode_check CHECK (build_mode IN ('visual', 'code')));
      CREATE TEMP TABLE app_versions (id uuid PRIMARY KEY, app_id uuid);
      CREATE TEMP TABLE pages (id uuid PRIMARY KEY, app_version_id uuid);
      CREATE TEMP TABLE components (id uuid PRIMARY KEY, page_id uuid, type text, parent text, properties json);
    `);
  });

  afterEach(async () => {
    await runner.rollbackTransaction();
    await runner.release();
  });

  afterAll(async () => {
    await db?.destroy();
    await dropScratchDatabase(database);
  });

  async function seed(type: string, value?: unknown, parent: string | null = null, mode = 'visual') {
    const appId = randomUUID();
    const versionId = randomUUID();
    const pageId = randomUUID();
    const properties = JSON.stringify({ code: { value: 'sheet\u0000REF' }, codePage: { value } });
    await runner.query('INSERT INTO apps VALUES ($1, $2)', [appId, mode]);
    await runner.query('INSERT INTO app_versions VALUES ($1, $2)', [versionId, appId]);
    await runner.query('INSERT INTO pages VALUES ($1, $2)', [pageId, versionId]);
    await runner.query('INSERT INTO components VALUES ($1, $2, $3, $4, $5::json)', [
      randomUUID(),
      pageId,
      type,
      parent,
      properties,
    ]);
    return appId;
  }

  async function modeOf(appId: string): Promise<string> {
    const [app] = await runner.query('SELECT build_mode FROM apps WHERE id = $1', [appId]);
    return app.build_mode;
  }

  it('should leave legacy custom components containing null characters unchanged', async () => {
    const id = await seed('CustomComponent');
    const before = await runner.query('SELECT id, properties::text FROM components ORDER BY id');
    await migration.up(runner);
    expect(await modeOf(id)).toBe('visual');
    expect(await runner.query('SELECT id, properties::text FROM components ORDER BY id')).toEqual(before);
  });

  it.each(['LibraryComponent', 'PackComponent'])(
    'should backfill %s roots with every supported true value despite null characters',
    async (type) => {
      const ids: string[] = [];
      for (const flag of [true, 'true', '{{true}}']) ids.push(await seed(type, flag));
      const before = await runner.query('SELECT id, properties::text FROM components ORDER BY id');
      await migration.up(runner);
      expect(await Promise.all(ids.map(modeOf))).toEqual(['code', 'code', 'code']);
      expect(await runner.query('SELECT id, properties::text FROM components ORDER BY id')).toEqual(before);
    }
  );

  it('should recognize an empty parent as a code-page root', async () => {
    const id = await seed('LibraryComponent', '{{true}}', '');
    await migration.up(runner);
    expect(await modeOf(id)).toBe('code');
  });

  it('should ignore nested roots, unrelated types and false or missing flags', async () => {
    const ids = [
      await seed('LibraryComponent', true, 'container'),
      await seed('CustomComponent', true),
      await seed('PackComponent', false),
      await seed('LibraryComponent'),
    ];
    await migration.up(runner);
    expect(await Promise.all(ids.map(modeOf))).toEqual(['visual', 'visual', 'visual', 'visual']);
  });

  it('should preserve existing code apps and be safe to rerun', async () => {
    const existing = await seed('LibraryComponent', undefined, null, 'code');
    const backfilled = await seed('PackComponent', true);
    await migration.up(runner);
    await migration.beforeCommit(runner);
    await migration.up(runner);
    expect(await Promise.all([existing, backfilled].map(modeOf))).toEqual(['code', 'code']);
  });

  it('should find a code root after a full batch of nonmatching candidates', async () => {
    const id = await seed('LibraryComponent');
    await runner.query(`
      INSERT INTO components (id, page_id, type, properties)
      SELECT ('00000000-0000-0000-0000-' || lpad(to_hex(n), 12, '0'))::uuid,
             p.id, 'LibraryComponent',
             CASE WHEN n = 2001 THEN '{"codePage":{"value":true}}'::json ELSE '{}'::json END
      FROM pages p CROSS JOIN generate_series(1, 2001) n
    `);
    await migration.up(runner);
    expect(await modeOf(id)).toBe('code');
  });
});
