/** @group platform */
import { VersionSnapshotStore } from '@modules/versions/diff/snapshot-store';
import { VersionDiffService } from '@modules/versions/diff/version-diff.service';
import { VersionRows, buildSnapshot } from '@modules/versions/diff/snapshot';
import { diffVersions } from '@modules/versions/diff/version-diff';

const rows = (text: string): VersionRows => ({
  version: {
    id: 'v-1',
    name: 'v1',
    status: 'DRAFT',
    homePageId: 'p-1',
    showViewerNavigation: true,
    globalSettings: {},
    pageSettings: {},
  },
  pages: [
    {
      id: 'p-1',
      name: 'Home',
      handle: 'home',
      index: 0,
      disabled: false,
      hidden: null,
      icon: null,
      isPageGroup: false,
      pageGroupId: null,
      autoComputeLayout: true,
      pageHeader: null,
      pageFooter: null,
      type: 'default',
      url: null,
    },
  ],
  components: [
    {
      id: 'c-1',
      name: 'title',
      type: 'Text',
      pageId: 'p-1',
      parent: null,
      properties: { text: { value: text } },
      styles: {},
      general: {},
      generalStyles: {},
      displayPreferences: {},
      validation: {},
    },
  ],
  layouts: [{ componentId: 'c-1', type: 'desktop', top: 10, left: 1, width: 20, height: 40 }],
  queries: [],
  dataSources: [],
  events: [],
});

// A stand-in for the database: remembers the one inserted snapshot row.
function fakeManager() {
  const stored: any[] = [];
  return {
    stored,
    query: async (sql: string, params: any[]) => {
      if (sql.includes('INSERT INTO app_version_snapshots')) {
        stored.push({
          id: 's-1',
          versionId: params[2],
          reason: params[3],
          refId: params[4],
          fingerprint: params[5],
          content: params[6],
          createdAt: '2026-10-15T01:00:00Z',
        });
        return [{ id: 's-1' }];
      }
      if (sql.includes('FROM app_version_snapshots')) return stored.filter((row) => row.id === params[0]);
      return [];
    },
  };
}

describe('version snapshots', () => {
  afterEach(() => jest.restoreAllMocks());

  it('captures a version and diffs the snapshot like the version itself', async () => {
    const load = jest.spyOn(VersionDiffService.prototype, 'loadRows').mockResolvedValue(rows('Deals'));
    const manager: any = fakeManager();
    const store = new VersionSnapshotStore();
    const { id, fingerprint } = await store.capture(manager, {
      organizationId: 'o',
      appId: 'a',
      versionId: 'v-1',
      reason: 'ai_turn',
      refId: 'm-1',
    });
    expect(id).toBe('s-1');
    expect(fingerprint).toMatch(/^f3:[0-9a-f]{64}$/);
    expect(load).toHaveBeenCalledWith(manager, 'a', 'v-1');

    const before = await store.snapshot(manager, 'a', 's-1');
    expect(before.name).toBe('Before');
    expect(diffVersions(before, buildSnapshot(rows('Deals'))).identical).toBe(true);

    // The AI edits the version in place afterwards.
    const after = diffVersions(before, buildSnapshot(rows('Open deals')));
    expect(after.pages[0].components[0].changes.map((change) => change.summary)).toEqual([
      'Text changed from "Deals" to "Open deals"',
    ]);
  });

  it('reports a fingerprint that changes only when content does', async () => {
    const spy = jest.spyOn(VersionDiffService.prototype, 'loadRows').mockResolvedValue(rows('Deals'));
    const store = new VersionSnapshotStore();
    const first = await store.fingerprintOf({} as any, 'a', 'v-1');
    expect(await store.fingerprintOf({} as any, 'a', 'v-1')).toBe(first);
    spy.mockResolvedValue(rows('Open deals'));
    expect(await store.fingerprintOf({} as any, 'a', 'v-1')).not.toBe(first);
  });

  // A manager for restore: the stored snapshot, the version's freeze flags, and a log of every statement.
  const restoreManager = (version: Record<string, any>) => {
    const content = {
      ...rows('Deals'),
      permissions: [
        {
          kind: 'page',
          id: 'pp-1',
          ownerId: 'p-1',
          type: 'GROUP',
          users: [{ id: 'pu-1', userId: null, groupId: 'g-1' }],
        },
      ],
      queryFolders: [],
    };
    const statements: Array<{ sql: string; params: any[] }> = [];
    return {
      statements,
      query: async (sql: string, params: any[] = []) => {
        statements.push({ sql, params });
        if (sql.includes('FROM app_versions v JOIN apps')) return [version];
        if (sql.includes('INSERT INTO app_version_snapshots')) return [{ id: 's-backup' }];
        if (sql.includes('FROM app_version_snapshots'))
          return [{ id: 's-1', versionId: 'v-1', reason: 'ai_turn', content: JSON.stringify(content) }];
        return [];
      },
    };
  };
  const draft = { status: 'DRAFT', isReleased: false, priority: 1, gitAllowsEditing: null };

  it('puts access rules back when Undo re-creates what a turn deleted', async () => {
    jest
      .spyOn(VersionDiffService.prototype, 'loadRows')
      .mockResolvedValueOnce(rows('Open deals')) // the version now
      .mockResolvedValueOnce(rows('Open deals')) // the backup taken first
      .mockResolvedValueOnce(rows('Deals')); // after the restore
    const manager: any = restoreManager(draft);
    const result = await new VersionSnapshotStore().restore(manager, {
      appId: 'a',
      snapshotId: 's-1',
      organizationId: 'o',
    });
    expect(result).toMatchObject({ restored: true, backupSnapshotId: 's-backup' });
    const sql = manager.statements.map((statement) => statement.sql);
    expect(sql.some((text) => text.includes('DELETE FROM page_permissions'))).toBe(true);
    const rule = manager.statements.find((statement) => statement.sql.includes('INSERT INTO page_permissions'));
    expect(rule.params).toEqual(['pp-1', 'p-1', 'GROUP']);
    const user = manager.statements.find((statement) => statement.sql.includes('INSERT INTO page_users'));
    expect(user.params).toEqual(['pu-1', 'pp-1', null, 'g-1']);
  });

  it.each([
    [{ ...draft, status: 'PUBLISHED' }, 'saved'],
    [{ ...draft, isReleased: true }, 'live'],
    [{ ...draft, priority: 2 }, 'promoted'],
    [{ ...draft, gitAllowsEditing: false }, 'Git sync'],
  ])('refuses to undo on a version the editor would not let you edit (%#)', async (version, words) => {
    const load = jest.spyOn(VersionDiffService.prototype, 'loadRows').mockResolvedValue(rows('Open deals'));
    const manager: any = restoreManager(version);
    await expect(
      new VersionSnapshotStore().restore(manager, { appId: 'a', snapshotId: 's-1', organizationId: 'o' })
    ).rejects.toThrow(words);
    expect(load).not.toHaveBeenCalled();
  });

  it('refuses an Undo it cannot check: the turn was recorded under older fingerprint rules', async () => {
    jest.spyOn(VersionDiffService.prototype, 'loadRows').mockResolvedValue(rows('Open deals'));
    const manager: any = restoreManager(draft);
    await expect(
      new VersionSnapshotStore().restore(manager, {
        appId: 'a',
        snapshotId: 's-1',
        organizationId: 'o',
        expectedFingerprint: 'f2:abc',
      })
    ).rejects.toThrow('recorded before an update');
    expect(manager.statements.some((statement) => statement.sql.includes('INSERT INTO app_version_snapshots'))).toBe(
      false
    );
  });
});
