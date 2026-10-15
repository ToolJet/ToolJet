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
    expect(fingerprint).toMatch(/^f2:[0-9a-f]{64}$/);
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
});
