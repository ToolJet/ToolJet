/**
 * git-tree-sha.util — parsing of `git ls-remote` / `git ls-tree` output into
 * the change tokens git-sync uses to skip unchanged pulls.
 *
 * Pure parsing: `simple-git` is mocked so no git host / repo is touched. We drive
 * canned stdout through the parsers and assert the extracted SHAs.
 *
 * @group gitsync
 */

// Mock names must be `mock`-prefixed to satisfy jest's out-of-scope guard.
const mockRaw = jest.fn();
const mockListRemote = jest.fn();

jest.mock('simple-git', () => ({
  __esModule: true,
  default: jest.fn(() => ({ raw: mockRaw, listRemote: mockListRemote })),
}));

import { getRemoteHeadCommit, getTreeShaMap } from '@ee/git-sync/git-tree-sha.util';

describe('git-tree-sha.util', () => {
  beforeEach(() => {
    mockRaw.mockReset();
    mockListRemote.mockReset();
  });

  describe('getRemoteHeadCommit', () => {
    it('extracts the SHA from the first "<sha>\\trefs/heads/<branch>" line', async () => {
      mockListRemote.mockResolvedValue('abc123def456\trefs/heads/main\n');
      await expect(getRemoteHeadCommit('https://tok@host/repo.git', 'main')).resolves.toBe('abc123def456');
      expect(mockListRemote).toHaveBeenCalledWith(['--heads', 'https://tok@host/repo.git', 'main']);
    });

    it('skips leading blank lines and trims whitespace', async () => {
      mockListRemote.mockResolvedValue('\n  \n  deadbeef01  refs/heads/feat  \n');
      await expect(getRemoteHeadCommit('u', 'feat')).resolves.toBe('deadbeef01');
    });

    it('returns null when the ref list is empty (branch absent)', async () => {
      mockListRemote.mockResolvedValue('\n   \n');
      await expect(getRemoteHeadCommit('u', 'gone')).resolves.toBeNull();
    });

    it('returns null when the git call throws (network / auth failure)', async () => {
      mockListRemote.mockRejectedValue(new Error('fatal: could not read Username'));
      await expect(getRemoteHeadCommit('u', 'main')).resolves.toBeNull();
    });
  });

  describe('getTreeShaMap', () => {
    it('maps every tree path → SHA and skips blob (non-tree) entries', async () => {
      mockRaw.mockResolvedValue(
        [
          '040000 tree aaa1\tapps',
          '040000 tree bbb2\tapps/folder/my-app',
          '100644 blob ccc3\tapps/folder/my-app/app.json', // blob → skipped
          '040000 tree ddd4\tdata-sources',
          '040000 tree eee5\tdata-sources/pg-1',
        ].join('\n')
      );

      const map = await getTreeShaMap('/repo');

      expect(mockRaw).toHaveBeenCalledWith(['ls-tree', '-r', '-t', 'HEAD']);
      expect(map.get('apps')).toBe('aaa1');
      expect(map.get('apps/folder/my-app')).toBe('bbb2');
      expect(map.get('data-sources')).toBe('ddd4');
      expect(map.get('data-sources/pg-1')).toBe('eee5');
      // Blobs are not tokens — only subtrees.
      expect(map.has('apps/folder/my-app/app.json')).toBe(false);
      expect(map.size).toBe(4);
    });

    it('honours a non-HEAD ref argument', async () => {
      mockRaw.mockResolvedValue('040000 tree f00\tapps');
      await getTreeShaMap('/repo', 'origin/main');
      expect(mockRaw).toHaveBeenCalledWith(['ls-tree', '-r', '-t', 'origin/main']);
    });

    it('preserves paths containing spaces (path is everything after the tab)', async () => {
      mockRaw.mockResolvedValue('040000 tree 9ab\tapps/my folder/an app');
      const map = await getTreeShaMap('/repo');
      expect(map.get('apps/my folder/an app')).toBe('9ab');
    });

    it('ignores blank and malformed (tab-less / short) lines', async () => {
      mockRaw.mockResolvedValue(['', '040000 tree noTabHere', 'garbage', '040000 tree z1\tapps'].join('\n'));
      const map = await getTreeShaMap('/repo');
      expect(map.size).toBe(1);
      expect(map.get('apps')).toBe('z1');
    });

    it('returns an empty map when git throws (no HEAD / empty repo)', async () => {
      mockRaw.mockRejectedValue(new Error('fatal: not a tree object'));
      const map = await getTreeShaMap('/repo');
      expect(map.size).toBe(0);
    });
  });
});
