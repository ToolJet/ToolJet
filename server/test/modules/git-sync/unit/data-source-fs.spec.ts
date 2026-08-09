/** @group gitsync */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { readDataSourceEntries } from '@ee/git-sync/data-source-fs.util';

// Regression coverage: a datasource caught mid-migration from the legacy flat-file layout to the
// current folder-per-datasource layout used to be returned TWICE by readDataSourceEntries (once per
// layout) since both share the same directory and there was no dedup by coRelationId. Every caller
// that doesn't defensively dedupe (deserializeDataSources in workspace-git-sync-adapter.ts) would then
// process the same datasource twice in one pull, pushing duplicate DSVO upsert rows and tripping
// "ON CONFLICT DO UPDATE command cannot affect row a second time".
describe('readDataSourceEntries', () => {
  let dsDir: string;

  beforeEach(() => {
    dsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-fs-test-'));
  });

  afterEach(() => {
    fs.rmSync(dsDir, { recursive: true, force: true });
  });

  it('returns one entry per datasource when only the folder layout is present', () => {
    fs.mkdirSync(path.join(dsDir, 'my-postgres'));
    fs.writeFileSync(
      path.join(dsDir, 'my-postgres', 'data-source.json'),
      JSON.stringify({ id: 'ds-1', name: 'my-postgres' })
    );

    const entries = readDataSourceEntries(dsDir);

    expect(entries).toHaveLength(1);
    expect(entries[0].coRelationId).toBe('ds-1');
    expect(entries[0].treePath).toBe('data-sources/my-postgres');
  });

  it('dedupes a datasource present in BOTH the folder and legacy flat layout, preferring the folder', () => {
    fs.mkdirSync(path.join(dsDir, 'my-postgres'));
    fs.writeFileSync(
      path.join(dsDir, 'my-postgres', 'data-source.json'),
      JSON.stringify({ id: 'ds-1', name: 'my-postgres-renamed' })
    );
    // Leftover legacy flat file for the SAME coRelationId — not cleaned up after migration.
    fs.writeFileSync(path.join(dsDir, 'ds-1.json'), JSON.stringify({ id: 'ds-1', name: 'my-postgres' }));

    const entries = readDataSourceEntries(dsDir);

    expect(entries).toHaveLength(1);
    expect(entries[0].coRelationId).toBe('ds-1');
    expect(entries[0].treePath).toBe('data-sources/my-postgres'); // folder layout wins
    expect(entries[0].content.name).toBe('my-postgres-renamed');
  });

  it('keeps entries for distinct datasources separate', () => {
    fs.mkdirSync(path.join(dsDir, 'ds-a'));
    fs.writeFileSync(path.join(dsDir, 'ds-a', 'data-source.json'), JSON.stringify({ id: 'a', name: 'ds-a' }));
    fs.writeFileSync(path.join(dsDir, 'b.json'), JSON.stringify({ id: 'b', name: 'ds-b' }));

    const entries = readDataSourceEntries(dsDir);

    expect(entries.map((e) => e.coRelationId).sort()).toEqual(['a', 'b']);
  });
});
