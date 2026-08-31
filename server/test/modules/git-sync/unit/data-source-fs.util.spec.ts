/** @group gitsync */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  canonicalStringify,
  dataSourceFilePath,
  readDataSourceEntries,
  pruneStaleDataSourceFolders,
  DATA_SOURCE_FILE,
} from '@ee/git-sync/data-source-fs.util';

describe('data-source-fs.util', () => {
  describe('canonicalStringify', () => {
    it('sorts object keys recursively and preserves array order', () => {
      const out = canonicalStringify({ b: 1, a: { d: 4, c: 3 }, arr: [3, 1, 2] });
      expect(out).toBe(
        [
          '{',
          '  "a": {',
          '    "c": 3,',
          '    "d": 4',
          '  },',
          '  "arr": [',
          '    3,',
          '    1,',
          '    2',
          '  ],',
          '  "b": 1',
          '}',
        ].join('\n')
      );
    });
    it('is byte-stable regardless of input key order', () => {
      expect(canonicalStringify({ x: 1, y: 2 })).toBe(canonicalStringify({ y: 2, x: 1 }));
    });
  });

  describe('dataSourceFilePath', () => {
    it('builds <dir>/<folder>/data-source.json', () => {
      expect(dataSourceFilePath('/repo/data-sources', 'my-ds')).toBe(
        path.join('/repo/data-sources', 'my-ds', DATA_SOURCE_FILE)
      );
    });
  });

  describe('readDataSourceEntries', () => {
    let dir: string;
    beforeAll(() => {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-fs-'));
      const writeFolder = (name: string, content: any) => {
        const d = path.join(dir, name);
        fs.mkdirSync(d, { recursive: true });
        fs.writeFileSync(
          path.join(d, DATA_SOURCE_FILE),
          typeof content === 'string' ? content : JSON.stringify(content)
        );
      };
      // current folder layout
      writeFolder('my-ds', { id: 'corel-1', name: 'my-ds', kind: 'restapi' });
      // malformed JSON → skipped
      writeFolder('bad', 'not json {');
      // missing id → skipped
      writeFolder('noid', { name: 'x' });
      // dedupe: folder entry should win over the legacy flat file for the same id
      writeFolder('dup-folder', { id: 'corel-3', name: 'dup-folder' });
      // legacy flat files at the dir root: <coRelId>.json
      fs.writeFileSync(path.join(dir, 'corel-2.json'), JSON.stringify({ id: 'corel-2', name: 'legacy' }));
      fs.writeFileSync(path.join(dir, 'corel-3.json'), JSON.stringify({ id: 'corel-3', name: 'legacy-dup' }));
    });
    afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

    it('returns [] for a non-existent directory', () => {
      expect(readDataSourceEntries(path.join(dir, 'nope'))).toEqual([]);
    });

    it('reads folder + legacy entries, skips malformed / id-less, and dedupes folder-over-legacy', () => {
      const byId = new Map(readDataSourceEntries(dir).map((e) => [e.coRelationId, e]));

      // folder layout entry carries a treePath
      expect(byId.get('corel-1')?.treePath).toBe('data-sources/my-ds');
      expect(byId.get('corel-1')?.content.name).toBe('my-ds');

      // legacy flat entry has no treePath
      expect(byId.get('corel-2')?.treePath).toBeNull();

      // dedupe: the folder entry (treePath set) wins over the legacy flat file
      expect(byId.get('corel-3')?.treePath).toBe('data-sources/dup-folder');
      expect(byId.get('corel-3')?.content.name).toBe('dup-folder');

      // malformed + id-less were skipped
      expect([...byId.keys()].sort()).toEqual(['corel-1', 'corel-2', 'corel-3']);
    });

    it('derives `name` from the DIRECTORY for folder layout (not content.name), and from content.name for legacy flat', () => {
      const byId = new Map(readDataSourceEntries(dir).map((e) => [e.coRelationId, e]));

      // folder layout → name is the directory, not content.name
      expect(byId.get('corel-1')?.name).toBe('my-ds');
      expect(byId.get('corel-3')?.name).toBe('dup-folder'); // folder entry wins over legacy twin

      // legacy flat file → no directory, so fall back to content.name
      expect(byId.get('corel-2')?.name).toBe('legacy');
    });

    it('uses the directory name even when a stale content.name disagrees (directory is the source of truth)', () => {
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-name-'));
      try {
        const d = path.join(tmp, 'renamed-dir');
        fs.mkdirSync(d, { recursive: true });
        // content.name is stale ('old-json-name') — the directory ('renamed-dir') must win.
        fs.writeFileSync(path.join(d, DATA_SOURCE_FILE), JSON.stringify({ id: 'corel-x', name: 'old-json-name' }));
        const entry = readDataSourceEntries(tmp).find((e) => e.coRelationId === 'corel-x');
        expect(entry?.name).toBe('renamed-dir');
      } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
      }
    });
  });

  // Partial (scope='datasource') pushes skip the full-push ensureCleanDir, so this sweep
  // is what keeps the data-sources/ tree from accumulating stale folders. Identity is the
  // co_relation_id inside data-source.json — a rename must not leave the old-name folder
  // behind (the datasource would be duplicated at both names).
  describe('pruneStaleDataSourceFolders', () => {
    let dir: string;
    const writeFolder = (name: string, content: any) => {
      const d = path.join(dir, name);
      fs.mkdirSync(d, { recursive: true });
      fs.writeFileSync(path.join(d, DATA_SOURCE_FILE), typeof content === 'string' ? content : JSON.stringify(content));
    };
    const names = () => fs.readdirSync(dir).sort();

    beforeEach(() => {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-prune-'));
    });
    afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

    it('returns [] for a non-existent directory', () => {
      expect(pruneStaleDataSourceFolders(path.join(dir, 'nope'), new Map())).toEqual([]);
    });

    it('removes the old-name folder after a rename, keeping only the current-name folder', () => {
      // A partial push wrote the new name but left the old one on disk; both carry the same id.
      writeFolder('Foo', { id: 'co-1', name: 'Foo' });
      writeFolder('Bar', { id: 'co-1', name: 'Bar' });

      const removed = pruneStaleDataSourceFolders(dir, new Map([['co-1', 'Bar']]));

      expect(names()).toEqual(['Bar']);
      expect(removed).toEqual(['data-sources/Foo']);
    });

    it('removes a deleted datasource folder (co_relation_id no longer active)', () => {
      writeFolder('Gone', { id: 'co-1', name: 'Gone' });
      const removed = pruneStaleDataSourceFolders(dir, new Map());
      expect(names()).toEqual([]);
      expect(removed).toEqual(['data-sources/Gone']);
    });

    it('keeps an unchanged, still-active folder and only prunes the stale sibling', () => {
      writeFolder('Keep', { id: 'co-1', name: 'Keep' });
      writeFolder('OldA', { id: 'co-2', name: 'OldA' });
      writeFolder('NewA', { id: 'co-2', name: 'NewA' });

      pruneStaleDataSourceFolders(
        dir,
        new Map([
          ['co-1', 'Keep'],
          ['co-2', 'NewA'],
        ])
      );

      expect(names()).toEqual(['Keep', 'NewA']);
    });

    it('leaves legacy flat files and malformed folders untouched', () => {
      writeFolder('Live', { id: 'co-1', name: 'Live' });
      writeFolder('bad', 'not json {'); // unreadable id → skipped
      fs.writeFileSync(path.join(dir, 'co-9.json'), JSON.stringify({ id: 'co-9' })); // legacy flat file

      pruneStaleDataSourceFolders(dir, new Map([['co-1', 'Live']]));

      expect(names()).toEqual(['Live', 'bad', 'co-9.json']);
    });
  });
});
