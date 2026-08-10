/** @group gitsync */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  canonicalStringify,
  dataSourceFilePath,
  readDataSourceEntries,
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
  });
});
