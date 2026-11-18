import { useCustomComponentLibrariesStore } from '../customComponentLibrariesStore';
import { customComponentLibrariesService } from '@/_services/customComponentLibraries.service';

// jest.mock calls are hoisted above these imports by babel-plugin-jest-hoist regardless
// of where they're written, so placing them after the imports is safe.
jest.mock('@/_services/authentication.service', () => ({
  authenticationService: { currentSessionValue: { current_user: { id: 'user-1', email: 'dev@tooljet.io' } } },
}));

jest.mock('@/_services/customComponentLibraries.service', () => ({
  customComponentLibrariesService: {
    list: jest.fn(),
    streamDevBundleUpdates: jest.fn(() => Promise.resolve({ abort: jest.fn() })),
  },
}));

const DASHLESS = 'aaaaaaaabbbbccccddddeeeeeeeeeeee';
const CORRELATION_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const LIBRARY_ID = 'lib-1';

const library = {
  id: LIBRARY_ID,
  correlationId: CORRELATION_ID,
  name: 'lib',
  revisions: [],
  devBundles: [{ userId: 'user-1' }],
};

describe('customComponentLibrariesStore', () => {
  beforeEach(() => {
    (customComponentLibrariesService.streamDevBundleUpdates as jest.Mock).mockClear();
    (customComponentLibrariesService.list as jest.Mock).mockReset();
    // activeStreams is a module-scoped Map, not zustand state — setState below can't reset
    // it, so close everything via the store's own API to keep tests isolated from each other.
    useCustomComponentLibrariesStore.getState().syncDevPinStreams({});
    useCustomComponentLibrariesStore.setState({
      libraries: null,
      loadFailed: false,
      devPreviewEmailsByUserId: {},
      devBundleUpdatedAt: {},
      manifests: {},
    });
  });

  describe('fetchLibraries', () => {
    it("[FetchLibraries-001] names the signed-in user's own dev preview by their email, from the session", () => {
      // The badge reads this map whatever the license, so it is filled here rather than in syncDevPinStreams. The list
      // names dev builds by user id only (every workspace member reads it), so the email comes from the session.
      (customComponentLibrariesService.list as jest.Mock).mockResolvedValue([library]);

      return useCustomComponentLibrariesStore
        .getState()
        .fetchLibraries()
        .then(() => {
          expect(useCustomComponentLibrariesStore.getState().devPreviewEmailsByUserId).toEqual({
            'user-1': 'dev@tooljet.io',
          });
        });
    });

    it("[FetchLibraries-002] knows no one else's email: their dev previews show the user id", () => {
      const otherLibrary = {
        id: 'lib-2',
        correlationId: 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff',
        name: 'other-lib',
        revisions: [],
        devBundles: [{ userId: 'user-2', userEmail: 'stale-server@tooljet.io' }],
      };
      (customComponentLibrariesService.list as jest.Mock).mockResolvedValue([library, otherLibrary]);

      return useCustomComponentLibrariesStore
        .getState()
        .fetchLibraries()
        .then(() => {
          expect(useCustomComponentLibrariesStore.getState().devPreviewEmailsByUserId).toEqual({
            'user-1': 'dev@tooljet.io',
          });
        });
    });

    it('[FetchLibraries-003] seeds the latest manifest, except one whose source the list left out', () => {
      const plain = { ...library, revisions: [{ id: 'r1', version: '1.0.0' }], manifest: { components: { A: {} } } };
      const codeApp = {
        id: 'lib-code',
        correlationId: 'cccccccc-dddd-eeee-ffff-000000000000',
        name: 'code-app',
        revisions: [{ id: 'r2', version: '2.0.0' }],
        manifest: { components: { App: {} } },
        manifestSourceOmitted: true,
      };
      (customComponentLibrariesService.list as jest.Mock).mockResolvedValue([plain, codeApp]);

      return useCustomComponentLibrariesStore
        .getState()
        .fetchLibraries()
        .then(() => {
          // The code app's manifest is fetched from its manifest file instead, which keeps the files.
          expect(useCustomComponentLibrariesStore.getState().manifests).toEqual({
            [`${LIBRARY_ID}@1.0.0`]: { components: { A: {} } },
          });
        });
    });
  });

  describe('syncDevPinStreams', () => {
    beforeEach(() => {
      useCustomComponentLibrariesStore.setState({ libraries: [library] as any });
    });

    it("[SyncDevPinStreams-001] does not touch devPreviewEmailsByUserId — that is fetchLibraries' job now", () => {
      useCustomComponentLibrariesStore.setState({ devPreviewEmailsByUserId: { 'user-1': 'stale@tooljet.io' } });

      useCustomComponentLibrariesStore.getState().syncDevPinStreams({ [DASHLESS]: 'dev:user-1' });

      expect(useCustomComponentLibrariesStore.getState().devPreviewEmailsByUserId).toEqual({
        'user-1': 'stale@tooljet.io',
      });
    });

    it("[SyncDevPinStreams-002] opens a stream for the viewer's own pin", () => {
      useCustomComponentLibrariesStore.getState().syncDevPinStreams({ [DASHLESS]: 'dev:user-1' });

      expect(customComponentLibrariesService.streamDevBundleUpdates).toHaveBeenCalledWith(
        LIBRARY_ID,
        'user-1',
        expect.anything()
      );
    });

    it('[SyncDevPinStreams-003] does not open a stream for a pin owned by a different user', () => {
      useCustomComponentLibrariesStore.getState().syncDevPinStreams({ [DASHLESS]: 'dev:someone-else' });

      expect(customComponentLibrariesService.streamDevBundleUpdates).not.toHaveBeenCalled();
    });

    it("[SyncDevPinStreams-004] a live push invalidates that library's dev manifest cache entry", () => {
      // Break this catches: a push not evicting the cached manifest, since the key has
      // no nonce to bust it automatically.
      useCustomComponentLibrariesStore.setState({
        manifests: { [`${LIBRARY_ID}@dev:user-1`]: { components: { Old: {} } } },
      });

      useCustomComponentLibrariesStore.getState().syncDevPinStreams({ [DASHLESS]: 'dev:user-1' });
      const onMessage = (customComponentLibrariesService.streamDevBundleUpdates as jest.Mock).mock.calls[0][2]
        .onMessage;
      onMessage();

      expect(useCustomComponentLibrariesStore.getState().manifests[`${LIBRARY_ID}@dev:user-1`]).toBeUndefined();
      expect(useCustomComponentLibrariesStore.getState().devBundleUpdatedAt[LIBRARY_ID]).toEqual(expect.any(Number));
    });
  });

  describe('invalidateManifest', () => {
    it('[InvalidateManifest-001] removes only the targeted (libraryId, revision) entry', () => {
      useCustomComponentLibrariesStore.setState({
        manifests: {
          [`${LIBRARY_ID}@dev:user-1`]: { components: { Old: {} } },
          [`${LIBRARY_ID}@v2`]: { components: { Kept: {} } },
        },
      });

      useCustomComponentLibrariesStore.getState().invalidateManifest(LIBRARY_ID, 'dev:user-1');

      expect(useCustomComponentLibrariesStore.getState().manifests).toEqual({
        [`${LIBRARY_ID}@v2`]: { components: { Kept: {} } },
      });
    });

    it('[InvalidateManifest-002] is a no-op when there is nothing cached for that key', () => {
      useCustomComponentLibrariesStore.setState({ manifests: {} });

      expect(() =>
        useCustomComponentLibrariesStore.getState().invalidateManifest(LIBRARY_ID, 'dev:user-1')
      ).not.toThrow();
      expect(useCustomComponentLibrariesStore.getState().manifests).toEqual({});
    });
  });
});
