/**
 * PlatformGitPushService — the fs-only, host-free pieces:
 *   - deleteAppFromRepo (remove an app's dir + its .meta/appMeta.json entry)
 *   - readAppMeta / writeAppMeta (round-trip the .meta JSON)
 *   - relocateExistingAppCopy (identity-based move of an app that changed location)
 *
 * `fs` is mocked; `path` is real. The DB/git push paths (pushApp, resolveAppPath,
 * findTooljetDbTables, …) are exercised by the e2e lifecycle specs, not here.
 *
 * @group gitsync
 */
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  rmSync: jest.fn(),
  mkdirSync: jest.fn(),
  readdirSync: jest.fn(),
  renameSync: jest.fn(),
}));

// Importing PlatformGitPushService drags in GitSyncAdapter → import/export → data-sources
// util → `got` (ESM), which jest's CJS loader chokes on. Stub the heavy DI-only deps so the
// chain never loads — these methods take `null` for those deps anyway.
jest.mock('got', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@ee/git-sync/git-sync-adapter', () => ({ GitSyncAdapter: class {} }));
jest.mock('@ee/import-export-resources/service', () => ({ ImportExportResourcesService: class {} }));

import * as fs from 'fs';
import { PlatformGitPushService } from '@ee/platform-git-sync/push.service';

const existsSync = fs.existsSync as unknown as jest.Mock;
const readFileSync = fs.readFileSync as unknown as jest.Mock;
const writeFileSync = fs.writeFileSync as unknown as jest.Mock;
const rmSync = fs.rmSync as unknown as jest.Mock;
const mkdirSync = fs.mkdirSync as unknown as jest.Mock;
const readdirSync = fs.readdirSync as unknown as jest.Mock;
const renameSync = fs.renameSync as unknown as jest.Mock;

describe('PlatformGitPushService (fs-only helpers)', () => {
  let svc: PlatformGitPushService;
  let logger: { log: jest.Mock };

  beforeEach(() => {
    [existsSync, readFileSync, writeFileSync, rmSync, mkdirSync, readdirSync, renameSync].forEach((m) => m.mockReset());
    logger = { log: jest.fn() };
    svc = new PlatformGitPushService(null as any, null as any, logger as any);
  });

  const lastWrite = () => JSON.parse(writeFileSync.mock.calls.at(-1)![1] as string);

  describe('deleteAppFromRepo', () => {
    it('returns false (no fs writes) when the app has no co_relation_id', () => {
      expect(svc.deleteAppFromRepo('/repo', {})).toBe(false);
      expect(readFileSync).not.toHaveBeenCalled();
      expect(rmSync).not.toHaveBeenCalled();
    });

    it('returns false and logs when there is no appMeta entry for the co_relation_id', () => {
      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue(JSON.stringify({ 'other-id': { appPath: 'apps/x' } }));
      expect(svc.deleteAppFromRepo('/repo', { co_relation_id: 'missing' })).toBe(false);
      expect(rmSync).not.toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('No appMeta entry'));
    });

    it('removes the app dir, drops the entry, rewrites meta, and returns true', () => {
      const meta = {
        'co-1': { appPath: 'apps/my-app' },
        'co-2': { appPath: 'apps/keep-me' },
      };
      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue(JSON.stringify(meta));

      const result = svc.deleteAppFromRepo('/repo', { co_relation_id: 'co-1' });

      expect(result).toBe(true);
      // deleted the resolved app dir
      expect(rmSync).toHaveBeenCalledWith(expect.stringContaining('my-app'), { recursive: true, force: true });
      // rewrote meta without co-1, keeping co-2
      const written = lastWrite();
      expect(written).not.toHaveProperty('co-1');
      expect(written).toHaveProperty('co-2');
    });

    it('still drops the meta entry when the app dir is already gone (no rmSync)', () => {
      const meta = { 'co-1': { appPath: 'apps/my-app' } };
      // meta file + meta dir exist, but the app directory does not
      existsSync.mockImplementation((p: string) => !String(p).includes('my-app'));
      readFileSync.mockReturnValue(JSON.stringify(meta));

      expect(svc.deleteAppFromRepo('/repo', { co_relation_id: 'co-1' })).toBe(true);
      expect(rmSync).not.toHaveBeenCalled();
      expect(lastWrite()).not.toHaveProperty('co-1');
    });

    it('resolves moduleMeta.json for modules', () => {
      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue(JSON.stringify({ 'co-m': { appPath: 'modules/m' } }));
      svc.deleteAppFromRepo('/repo', { co_relation_id: 'co-m', type: 'module' });
      // the meta file read + written is moduleMeta.json, not appMeta.json
      expect(readFileSync.mock.calls[0][0]).toContain('moduleMeta.json');
      expect(writeFileSync.mock.calls.at(-1)![0]).toContain('moduleMeta.json');
    });
  });

  describe('readAppMeta', () => {
    it('returns {} when the meta file is absent', () => {
      existsSync.mockReturnValue(false);
      expect(svc.readAppMeta('/repo')).toEqual({});
      expect(readFileSync).not.toHaveBeenCalled();
    });

    it('parses the meta file when present', () => {
      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue(JSON.stringify({ 'co-1': { appPath: 'apps/a' } }));
      expect(svc.readAppMeta('/repo')).toEqual({ 'co-1': { appPath: 'apps/a' } });
    });

    it('returns {} on malformed JSON instead of throwing', () => {
      existsSync.mockReturnValue(true);
      readFileSync.mockReturnValue('{ not json');
      expect(svc.readAppMeta('/repo')).toEqual({});
    });
  });

  describe('writeAppMeta', () => {
    it('creates the .meta dir when missing then writes pretty-printed JSON', () => {
      existsSync.mockReturnValue(false); // meta dir absent
      svc.writeAppMeta('/repo', { 'co-1': { appPath: 'apps/a' } });
      expect(mkdirSync).toHaveBeenCalledWith(expect.stringContaining('.meta'), { recursive: true });
      const [target, body] = writeFileSync.mock.calls.at(-1)!;
      expect(String(target)).toContain('appMeta.json');
      expect(body).toBe(JSON.stringify({ 'co-1': { appPath: 'apps/a' } }, null, 2));
    });

    it('does not mkdir when the .meta dir already exists', () => {
      existsSync.mockReturnValue(true);
      svc.writeAppMeta('/repo', {});
      expect(mkdirSync).not.toHaveBeenCalled();
      expect(writeFileSync).toHaveBeenCalled();
    });
  });

  // Regression: an app is addressed on disk by name/folder, but its identity is its
  // co_relation_id. When the app moves (into/out of a folder, or is renamed), the push
  // must find its EXISTING copy by co_relation_id and relocate it — a name-only scan
  // leaves the old copy behind and the app ends up duplicated at both paths.
  describe('relocateExistingAppCopy (identity-based move)', () => {
    const dirent = (name: string) => ({ name, isDirectory: () => true });
    const relocate = (app: any, repoPath: string, newAppPath: string) =>
      (svc as any).relocateExistingAppCopy(app, repoPath, newAppPath);

    it('is a no-op for a brand-new app (no co_relation_id)', () => {
      relocate({}, '/repo', '/repo/apps/MyApp');
      expect(renameSync).not.toHaveBeenCalled();
      expect(rmSync).not.toHaveBeenCalled();
    });

    it('is a no-op when the app is not present anywhere in the repo', () => {
      existsSync.mockReturnValue(false); // no meta file, no resource dir
      relocate({ co_relation_id: 'co-1' }, '/repo', '/repo/apps/MyApp');
      expect(renameSync).not.toHaveBeenCalled();
    });

    it('is a no-op when the recorded location already equals the target', () => {
      existsSync.mockImplementation((p: string) => String(p).includes('.meta') || String(p).endsWith('app.json'));
      readFileSync.mockImplementation((p: string) =>
        String(p).endsWith('app.json')
          ? JSON.stringify({ id: 'co-1' })
          : JSON.stringify({ 'co-1': { appPath: 'apps/MyApp' } })
      );
      relocate({ co_relation_id: 'co-1' }, '/repo', '/repo/apps/MyApp');
      expect(renameSync).not.toHaveBeenCalled();
    });

    it('moves the app from its recorded folder path to the new root path and prunes the emptied folder', () => {
      // appMeta records the app under apps/F/MyApp; the push now targets apps/MyApp.
      existsSync.mockImplementation((p: string) => {
        const s = String(p);
        if (s.endsWith('appMeta.json')) return true;
        if (s === '/repo/apps/F/MyApp/app/app.json') return true;
        if (s === '/repo/apps/MyApp') return false; // target does not exist yet
        if (s === '/repo/apps/F') return true; // old parent still on disk
        return false;
      });
      readFileSync.mockImplementation((p: string) =>
        String(p).endsWith('app.json')
          ? JSON.stringify({ id: 'co-1' })
          : JSON.stringify({ 'co-1': { appPath: 'apps/F/MyApp' } })
      );
      readdirSync.mockImplementation((p: string) => (String(p) === '/repo/apps/F' ? [] : []));

      relocate({ co_relation_id: 'co-1' }, '/repo', '/repo/apps/MyApp');

      expect(renameSync).toHaveBeenCalledWith('/repo/apps/F/MyApp', '/repo/apps/MyApp');
      // the now-empty folder F is removed
      expect(rmSync).toHaveBeenCalledWith('/repo/apps/F', { recursive: true, force: true });
    });

    it('falls back to a co_relation_id filesystem scan when appMeta is missing', () => {
      // No meta file — locate the app by scanning apps/<folder>/<app>/app/app.json.
      existsSync.mockImplementation((p: string) => {
        const s = String(p);
        if (s.endsWith('appMeta.json')) return false; // meta absent
        if (s === '/repo/apps') return true;
        if (s === '/repo/apps/F/app/app.json') return false; // F is a container, not an app
        if (s === '/repo/apps/F/MyApp/app/app.json') return true;
        if (s === '/repo/apps/G/MyApp') return false; // target does not exist yet
        return false;
      });
      readFileSync.mockReturnValue(JSON.stringify({ id: 'co-1' }));
      readdirSync.mockImplementation((p: string) => {
        const s = String(p);
        if (s === '/repo/apps') return [dirent('F')];
        if (s === '/repo/apps/F') return [dirent('MyApp')];
        return [];
      });

      relocate({ co_relation_id: 'co-1' }, '/repo', '/repo/apps/G/MyApp');

      expect(renameSync).toHaveBeenCalledWith('/repo/apps/F/MyApp', '/repo/apps/G/MyApp');
    });
  });
});
