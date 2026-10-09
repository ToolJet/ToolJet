import { useCustomComponentLibrariesStore } from '../customComponentLibrariesStore';
import { customComponentLibrariesService } from '@/_services/customComponentLibraries.service';

// jest.mock calls are hoisted above these imports by babel-plugin-jest-hoist regardless
// of where they're written, so placing them after the imports is safe.
jest.mock('@/_services/authentication.service', () => ({
  authenticationService: { currentSessionValue: { current_user: { id: 'user-1' } } },
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
  devBundles: [{ userId: 'user-1', userEmail: 'dev@tooljet.io' }],
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
    it('[FetchLibraries-001] populates devPreviewEmailsByUserId from every library\'s devBundles', () => {
      // Break this catches: the exact bug this design targets — email resolution used to
      // live inside syncDevPinStreams (gated behind license/stream access), so without a
      // CCL license the "dev: <email>" badge fell back to showing a raw userId. Deriving
      // it here instead — straight from the list response — makes it license-independent.
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

    it('[FetchLibraries-002] merges emails across multiple libraries/devBundles', () => {
      const otherLibrary = {
        id: 'lib-2',
        correlationId: 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff',
        name: 'other-lib',
        revisions: [],
        devBundles: [{ userId: 'user-2', userEmail: 'other@tooljet.io' }],
      };
      (customComponentLibrariesService.list as jest.Mock).mockResolvedValue([library, otherLibrary]);

      return useCustomComponentLibrariesStore
        .getState()
        .fetchLibraries()
        .then(() => {
          expect(useCustomComponentLibrariesStore.getState().devPreviewEmailsByUserId).toEqual({
            'user-1': 'dev@tooljet.io',
            'user-2': 'other@tooljet.io',
          });
        });
    });
  });

  describe('syncDevPinStreams', () => {
    beforeEach(() => {
      useCustomComponentLibrariesStore.setState({ libraries: [library] as any });
    });

    it('[SyncDevPinStreams-001] does not touch devPreviewEmailsByUserId — that is fetchLibraries\' job now', () => {
      useCustomComponentLibrariesStore.setState({ devPreviewEmailsByUserId: { 'user-1': 'stale@tooljet.io' } });

      useCustomComponentLibrariesStore.getState().syncDevPinStreams({ [DASHLESS]: 'dev:user-1' });

      expect(useCustomComponentLibrariesStore.getState().devPreviewEmailsByUserId).toEqual({
        'user-1': 'stale@tooljet.io',
      });
    });

    it('[SyncDevPinStreams-002] opens a stream for the viewer\'s own pin', () => {
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

    it('[SyncDevPinStreams-004] a live push invalidates that library\'s dev manifest cache entry', () => {
      // Break this catches: a push not evicting the cached manifest, since the key has
      // no nonce to bust it automatically.
      useCustomComponentLibrariesStore.setState({
        manifests: { [`${LIBRARY_ID}@dev:user-1`]: { components: { Old: {} } } },
      });

      useCustomComponentLibrariesStore.getState().syncDevPinStreams({ [DASHLESS]: 'dev:user-1' });
      const onMessage = (customComponentLibrariesService.streamDevBundleUpdates as jest.Mock).mock.calls[0][2].onMessage;
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

      expect(() => useCustomComponentLibrariesStore.getState().invalidateManifest(LIBRARY_ID, 'dev:user-1')).not.toThrow();
      expect(useCustomComponentLibrariesStore.getState().manifests).toEqual({});
    });
  });
});
