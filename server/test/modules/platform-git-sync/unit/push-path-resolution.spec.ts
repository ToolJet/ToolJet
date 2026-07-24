/// <reference types="jest" />
import * as path from 'path';

// Isolate PlatformGitPushService from its heavy collaborators and IO so this stays a
// pure path-resolution unit test. We only care that a long (100-char) app name survives
// as a filesystem path segment without truncation or throwing.
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(() => false),
  mkdirSync: jest.fn(),
  readdirSync: jest.fn(() => []),
  rmSync: jest.fn(),
}));
jest.mock('@helpers/database.helper', () => ({ dbTransactionWrap: jest.fn() }));
jest.mock('@ee/git-sync/git-sync-adapter', () => ({ GitSyncAdapter: class {} }));
jest.mock('@ee/import-export-resources/service', () => ({ ImportExportResourcesService: class {} }));
jest.mock('@modules/logging/service', () => ({ TransactionLogger: class {} }));

import { dbTransactionWrap } from '@helpers/database.helper';
import { PlatformGitPushService } from '@ee/platform-git-sync/push.service';

/** @group platform */
describe('PlatformGitPushService — app name path resolution', () => {
  const REPO = '/tmp/repo';
  const nameOfLength = (n: number): string => 'a'.repeat(n);

  let service: PlatformGitPushService;

  type AppLike = { id: string; name: string; type?: string };
  // resolveAppPath is private; a typed cast reaches it without exposing test-only surface.
  // Impl takes displayName explicitly (branch-specific app_versions.app_name); here it's just the app name.
  type WithResolveAppPath = {
    resolveAppPath(app: AppLike, repoPath: string, displayName: string): Promise<{ appPath: string; parentDir: string }>;
  };
  const resolveAppPath = (app: AppLike) =>
    (service as unknown as WithResolveAppPath).resolveAppPath(app, REPO, app.name);

  beforeEach(() => {
    // Heavy collaborators are mocked out; these stubs stand in for the real ctor deps.
    const deps = [{}, {}, { log: jest.fn() }] as unknown as ConstructorParameters<typeof PlatformGitPushService>;
    service = new PlatformGitPushService(...deps);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('app not in a folder', () => {
    beforeEach(() => {
      (dbTransactionWrap as jest.Mock).mockResolvedValue(null); // no FolderApp row
    });

    it('should keep a 100-character app name intact as the path segment', async () => {
      const longName = nameOfLength(100);
      const { appPath, parentDir } = await resolveAppPath({ id: '1', name: longName, type: 'front-end' });

      expect(appPath).toBe(path.join(REPO, 'apps', longName));
      expect(parentDir).toBe(path.join(REPO, 'apps'));
      // The directory segment must not be truncated below the full name length.
      expect(path.basename(appPath)).toHaveLength(100);
    });

    it('should keep a 100-character module name intact under the modules folder', async () => {
      const longName = nameOfLength(100);
      const { appPath } = await resolveAppPath({ id: '2', name: longName, type: 'module' });

      expect(appPath).toBe(path.join(REPO, 'modules', longName));
      expect(path.basename(appPath)).toHaveLength(100);
    });
  });

  describe('app inside a folder', () => {
    beforeEach(() => {
      (dbTransactionWrap as jest.Mock).mockResolvedValue({ folder: { name: 'My Folder' } });
    });

    it('should nest a 100-character app name under the folder without truncation', async () => {
      const longName = nameOfLength(100);
      const { appPath, parentDir } = await resolveAppPath({ id: '3', name: longName, type: 'front-end' });

      expect(appPath).toBe(path.join(REPO, 'apps', 'My Folder', longName));
      expect(parentDir).toBe(path.join(REPO, 'apps', 'My Folder'));
      expect(path.basename(appPath)).toHaveLength(100);
    });
  });

  it('should not throw while resolving a 100-character name', async () => {
    (dbTransactionWrap as jest.Mock).mockResolvedValue(null);
    await expect(resolveAppPath({ id: '4', name: nameOfLength(100), type: 'front-end' })).resolves.toBeDefined();
  });
});