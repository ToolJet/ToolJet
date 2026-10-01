/**
 * data-source-fs.util — the fs layout logic for workspace-global data sources in git, exercised
 * against real temp directories (no DB, no Nest app). Covers the directory-segment folder layout
 * (data-sources/<folder>/<ds-name>/data-source.json), backward-compat with the old flat-per-DS and
 * legacy flat layouts, and the partial-push stale prune.
 *
 * @group gitsync
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  DATA_SOURCE_FILE,
  dataSourceFilePath,
  readDataSourceEntries,
  pruneStaleDataSourceFolders,
} from '@ee/git-sync/data-source-fs.util';

describe('data-source-fs.util (real temp dirs)', () => {
  let dsDir: string;

  beforeEach(() => {
    dsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-fs-')) + '/data-sources';
    fs.mkdirSync(dsDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(path.dirname(dsDir), { recursive: true, force: true });
  });

  // Write data-sources/<folder?>/<name>/data-source.json with the given co_relation_id.
  const writeDs = (name: string, folder: string | null, coRelationId: string, extra: Record<string, any> = {}) => {
    const rel = folder ? path.join(folder, name) : name;
    const abs = path.join(dsDir, rel);
    fs.mkdirSync(abs, { recursive: true });
    fs.writeFileSync(
      path.join(abs, DATA_SOURCE_FILE),
      JSON.stringify({ id: coRelationId, kind: 'postgresql', ...extra })
    );
  };

  // Legacy flat file: data-sources/<file>.json
  const writeLegacyFlat = (fileBase: string, content: Record<string, any>) => {
    fs.writeFileSync(path.join(dsDir, `${fileBase}.json`), JSON.stringify(content));
  };

  describe('dataSourceFilePath', () => {
    it('places a root data source at data-sources/<name>/data-source.json', () => {
      expect(dataSourceFilePath('/repo/data-sources', 'stripe')).toBe(
        path.join('/repo/data-sources', 'stripe', DATA_SOURCE_FILE)
      );
    });

    it('inserts the folder segment when a placement folder is given', () => {
      expect(dataSourceFilePath('/repo/data-sources', 'stripe', 'Payments')).toBe(
        path.join('/repo/data-sources', 'Payments', 'stripe', DATA_SOURCE_FILE)
      );
    });

    it('treats null placement folder as root', () => {
      expect(dataSourceFilePath('/repo/data-sources', 'stripe', null)).toBe(
        path.join('/repo/data-sources', 'stripe', DATA_SOURCE_FILE)
      );
    });
  });

  describe('readDataSourceEntries', () => {
    it('reads a root data source with placementFolder = null', () => {
      writeDs('analytics_db', null, 'corel-1');
      const entries = readDataSourceEntries(dsDir);
      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({
        coRelationId: 'corel-1',
        name: 'analytics_db',
        placementFolder: null,
        treePath: 'data-sources/analytics_db',
      });
    });

    it('reads a folder-nested data source, surfacing the placement folder and nested treePath', () => {
      writeDs('stripe_prod', 'Payments', 'corel-2');
      const entries = readDataSourceEntries(dsDir);
      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({
        coRelationId: 'corel-2',
        name: 'stripe_prod',
        placementFolder: 'Payments',
        treePath: 'data-sources/Payments/stripe_prod',
      });
    });

    it('reads a mix of root, folder-nested, and legacy-flat entries', () => {
      writeDs('root_ds', null, 'corel-root');
      writeDs('folder_ds', 'Marketing', 'corel-folder');
      writeLegacyFlat('corel-legacy', { id: 'corel-legacy', name: 'legacy_ds', kind: 'restapi' });

      const byId = new Map(readDataSourceEntries(dsDir).map((e) => [e.coRelationId, e]));
      expect(byId.get('corel-root')).toMatchObject({ name: 'root_ds', placementFolder: null });
      expect(byId.get('corel-folder')).toMatchObject({ name: 'folder_ds', placementFolder: 'Marketing' });
      // Legacy flat has no directory to name from → falls back to content.name, no treePath/folder.
      expect(byId.get('corel-legacy')).toMatchObject({
        name: 'legacy_ds',
        placementFolder: null,
        treePath: null,
      });
    });

    it('is backward-compatible: an old flat-per-datasource repo reads every DS as root', () => {
      // Old layout is exactly the new "root" case: data-sources/<name>/data-source.json.
      writeDs('ds_a', null, 'corel-a');
      writeDs('ds_b', null, 'corel-b');
      const entries = readDataSourceEntries(dsDir);
      expect(entries).toHaveLength(2);
      expect(entries.every((e) => e.placementFolder === null)).toBe(true);
    });

    it('skips malformed JSON and entries missing an id', () => {
      writeDs('good', null, 'corel-good');
      // malformed
      const badDir = path.join(dsDir, 'bad');
      fs.mkdirSync(badDir, { recursive: true });
      fs.writeFileSync(path.join(badDir, DATA_SOURCE_FILE), '{ not json');
      // missing id
      const noIdDir = path.join(dsDir, 'no_id');
      fs.mkdirSync(noIdDir, { recursive: true });
      fs.writeFileSync(path.join(noIdDir, DATA_SOURCE_FILE), JSON.stringify({ kind: 'postgresql' }));

      const entries = readDataSourceEntries(dsDir);
      expect(entries).toHaveLength(1);
      expect(entries[0].coRelationId).toBe('corel-good');
    });

    it('dedups a datasource present as both a folder entry and a legacy flat file, preferring the folder', () => {
      writeDs('stripe', 'Payments', 'corel-dup');
      writeLegacyFlat('corel-dup', { id: 'corel-dup', name: 'stripe', kind: 'postgresql' });
      const entries = readDataSourceEntries(dsDir);
      expect(entries).toHaveLength(1);
      // Folder entry wins (treePath set).
      expect(entries[0]).toMatchObject({ placementFolder: 'Payments', treePath: 'data-sources/Payments/stripe' });
    });

    it('returns [] when the directory does not exist', () => {
      expect(readDataSourceEntries(path.join(dsDir, 'nope'))).toEqual([]);
    });
  });

  describe('pruneStaleDataSourceFolders', () => {
    it('removes a deleted datasource (co_relation_id not in the expected map)', () => {
      writeDs('gone', null, 'corel-gone');
      writeDs('kept', null, 'corel-kept');
      const removed = pruneStaleDataSourceFolders(dsDir, new Map([['corel-kept', 'kept']]));
      expect(removed).toEqual(['data-sources/gone']);
      expect(fs.existsSync(path.join(dsDir, 'gone'))).toBe(false);
      expect(fs.existsSync(path.join(dsDir, 'kept'))).toBe(true);
    });

    it('removes the stale copy of a renamed datasource (path mismatch)', () => {
      writeDs('old_name', null, 'corel-1');
      writeDs('new_name', null, 'corel-1'); // re-serialized twin under the new name
      // expected = new name only
      const removed = pruneStaleDataSourceFolders(dsDir, new Map([['corel-1', 'new_name']]));
      expect(removed).toEqual(['data-sources/old_name']);
      expect(fs.existsSync(path.join(dsDir, 'old_name'))).toBe(false);
      expect(fs.existsSync(path.join(dsDir, 'new_name'))).toBe(true);
    });

    it('removes the stale copy after a folder move and sweeps the emptied folder', () => {
      writeDs('stripe', null, 'corel-1'); // old: root
      writeDs('stripe', 'Payments', 'corel-1'); // new: in folder
      const removed = pruneStaleDataSourceFolders(dsDir, new Map([['corel-1', 'Payments/stripe']]));
      // Old root copy removed; the new folder copy kept.
      expect(removed).toContain('data-sources/stripe');
      expect(fs.existsSync(path.join(dsDir, 'stripe', DATA_SOURCE_FILE))).toBe(false);
      expect(fs.existsSync(path.join(dsDir, 'Payments', 'stripe', DATA_SOURCE_FILE))).toBe(true);
    });

    it('sweeps a placement folder left empty by removals', () => {
      writeDs('stripe', 'Payments', 'corel-1'); // in folder, but now deleted (not in expected)
      const removed = pruneStaleDataSourceFolders(dsDir, new Map());
      expect(removed).toContain('data-sources/Payments/stripe');
      expect(removed).toContain('data-sources/Payments'); // empty folder swept
      expect(fs.existsSync(path.join(dsDir, 'Payments'))).toBe(false);
    });

    it('keeps a datasource whose path matches its expected path (root and folder)', () => {
      writeDs('root_ds', null, 'corel-root');
      writeDs('folder_ds', 'Sales', 'corel-folder');
      const removed = pruneStaleDataSourceFolders(
        dsDir,
        new Map([
          ['corel-root', 'root_ds'],
          ['corel-folder', 'Sales/folder_ds'],
        ])
      );
      expect(removed).toEqual([]);
      expect(fs.existsSync(path.join(dsDir, 'root_ds'))).toBe(true);
      expect(fs.existsSync(path.join(dsDir, 'Sales', 'folder_ds'))).toBe(true);
    });

    it('leaves legacy flat files untouched', () => {
      writeLegacyFlat('corel-legacy', { id: 'corel-legacy', name: 'legacy_ds', kind: 'restapi' });
      const removed = pruneStaleDataSourceFolders(dsDir, new Map());
      expect(removed).toEqual([]);
      expect(fs.existsSync(path.join(dsDir, 'corel-legacy.json'))).toBe(true);
    });

    it('returns [] when the directory does not exist', () => {
      expect(pruneStaleDataSourceFolders(path.join(dsDir, 'nope'), new Map())).toEqual([]);
    });
  });
});
