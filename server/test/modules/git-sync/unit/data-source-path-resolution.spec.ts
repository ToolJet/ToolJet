/// <reference types="jest" />
/**
 * WorkspaceGitSyncAdapter — data source serialize PATH resolution, the data-source analogue of
 * PlatformGitPushService's app/module path resolution (push-path-resolution.spec.ts). Verifies the
 * placement folder is resolved per branch and that the on-disk path nests the data source under its
 * folder (data-sources/<folder>/<ds-name>/…), or sits at root when unfoldered — including that a
 * long (100-char) name survives as a path segment without truncation.
 *
 * Kept a pure unit test: fs and the adapter's heavy collaborators are stubbed; only path resolution
 * runs. `resolvePlacementFolderName` is private, reached via a typed cast, and takes an EntityManager
 * whose `findOne` we mock to stand in for the folder_data_sources lookup.
 *
 * @group gitsync
 */
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(() => false),
  mkdirSync: jest.fn(),
  readdirSync: jest.fn(() => []),
  rmSync: jest.fn(),
  writeFileSync: jest.fn(),
}));
jest.mock('got', () => ({ __esModule: true, default: jest.fn() }));

import * as path from 'path';
import { WorkspaceGitSyncAdapter } from '@ee/git-sync/workspace-git-sync-adapter';
import { dataSourceFilePath } from '@ee/git-sync/data-source-fs.util';

type WithResolve = {
  resolvePlacementFolderName(manager: any, dataSourceId: string, branchId: string): Promise<string | null>;
};

describe('WorkspaceGitSyncAdapter — data source path resolution', () => {
  const DS_DIR = '/tmp/repo/data-sources';
  const BRANCH = 'branch-1';
  const nameOfLength = (n: number): string => 'a'.repeat(n);

  let adapter: WorkspaceGitSyncAdapter;

  const resolveFolder = (manager: any, dataSourceId = 'ds-1') =>
    (adapter as unknown as WithResolve).resolvePlacementFolderName(manager, dataSourceId, BRANCH);

  // manager whose findOne returns the given folder_data_sources row (or null for "at root").
  const managerReturning = (row: any) => ({ findOne: jest.fn().mockResolvedValue(row) });

  beforeEach(() => {
    adapter = new WorkspaceGitSyncAdapter({ log: jest.fn() } as any, {} as any, {} as any);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('data source not in a folder', () => {
    it('resolves a null placement folder and writes the DS at the data-sources root', async () => {
      const manager = managerReturning(null); // no folder_data_sources row
      const folder = await resolveFolder(manager);

      expect(folder).toBeNull();
      expect(dataSourceFilePath(DS_DIR, 'stripe', folder)).toBe(path.join(DS_DIR, 'stripe', 'data-source.json'));
    });

    it('keeps a 100-character data source name intact as the root path segment', async () => {
      const longName = nameOfLength(100);
      const folder = await resolveFolder(managerReturning(null));
      const filePath = dataSourceFilePath(DS_DIR, longName, folder);

      expect(filePath).toBe(path.join(DS_DIR, longName, 'data-source.json'));
      expect(path.basename(path.dirname(filePath))).toHaveLength(100);
    });
  });

  describe('data source inside a folder', () => {
    it('resolves the folder name and nests the DS under data-sources/<folder>/<ds-name>/', async () => {
      const manager = managerReturning({ folder: { name: 'Payments' } });
      const folder = await resolveFolder(manager);

      expect(folder).toBe('Payments');
      expect(dataSourceFilePath(DS_DIR, 'stripe', folder)).toBe(
        path.join(DS_DIR, 'Payments', 'stripe', 'data-source.json')
      );
    });

    it('nests a 100-character name under the folder without truncation', async () => {
      const longName = nameOfLength(100);
      const folder = await resolveFolder(managerReturning({ folder: { name: 'Payments' } }));
      const filePath = dataSourceFilePath(DS_DIR, longName, folder);

      expect(filePath).toBe(path.join(DS_DIR, 'Payments', longName, 'data-source.json'));
      expect(path.basename(path.dirname(filePath))).toHaveLength(100);
    });
  });

  it('scopes the folder lookup to (data_source_id, branch_id)', async () => {
    const manager = managerReturning({ folder: { name: 'Payments' } });
    await resolveFolder(manager, 'ds-42');

    expect(manager.findOne).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ where: { dataSourceId: 'ds-42', branchId: BRANCH }, relations: ['folder'] })
    );
  });

  it('resolves null when the folder_data_sources row has no joined folder', async () => {
    // Defensive: a dangling row without its folder relation resolves to root, not a crash.
    const folder = await resolveFolder(managerReturning({ folder: null }));
    expect(folder).toBeNull();
  });
});
