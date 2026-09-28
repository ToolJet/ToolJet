import { create, zustandDevTools } from './utils';
import { customComponentLibrariesService, type CustomComponentLibrary } from '@/_services/customComponentLibraries.service';
import { authenticationService } from '@/_services/authentication.service';
import {
  streamKey,
  resolveOwnDevPins,
  buildDevPreviewEmailsByUserId,
  diffStreamKeys,
  libraryFileUrl,
  buildManifestCacheKey,
} from '@/_helpers/customComponentLibrariesStoreUtils';
import type { LibraryManifest } from '@/AppBuilder/types/libraryComponent.types';

interface CustomComponentLibrariesState {
  libraries: CustomComponentLibrary[] | null; // null = not yet fetched
  loadFailed: boolean;
  devPreviewEmailsByUserId: Record<string, string>; // { [userId]: email } — feeds the canvas "dev: email" badge
  devBundleUpdatedAt: Record<string, number>; // { [libraryId]: number } — nonce bumped on each live-reload push
  manifests: Record<string, LibraryManifest>; // keyed by buildManifestCacheKey(libraryId, revision)
  fetchLibraries: (options?: { force?: boolean }) => Promise<CustomComponentLibrary[]>;
  invalidate: () => void;
  syncDevPinStreams: (devPinKeys: Record<string, string>) => void;
  fetchManifest: (libraryId: string, revision: string) => Promise<void>;
  invalidateManifest: (libraryId: string, revision: string) => void;
  resetAll: () => void;
}

// Module-scoped, not zustand state, so devtools/persist never touch it — dev bundle bytes
// must never persist into app state, only the pin string does (invariant #14, HANDOFF-NISHIDH.md).
const activeStreams = new Map<string, AbortController | null>(); // `${libraryId}:${userId}` -> AbortController

// Dedupes concurrent fetchLibraries() calls (e.g. the RightSideBar tab and the dev-pin
// sync effect both running around the same time) into a single request.
let inFlightFetch: Promise<CustomComponentLibrary[]> | null = null;

// Dedupes concurrent fetchManifest() calls for the same cache key (e.g. the widget
// runtime and the Inspector both mounting for the same instance at once).
const manifestInFlight = new Map<string, Promise<void>>();

// Every library list entry already carries its latest revision's manifest — seed the
// cache with it for free so useLibraryManifest never re-fetches what's already in hand.
function seedLatestManifests(libraries: CustomComponentLibrary[]): Record<string, LibraryManifest> {
  const seeded: Record<string, LibraryManifest> = {};
  libraries.forEach((lib) => {
    const latest = lib.revisions?.[0]?.version;
    if (latest && lib.manifest) seeded[buildManifestCacheKey(lib.id, latest)] = lib.manifest;
  });
  return seeded;
}

function closeAllStreams(): void {
  activeStreams.forEach((controller) => controller?.abort());
  activeStreams.clear();
}

function closeStream(key: string): void {
  activeStreams.get(key)?.abort();
  activeStreams.delete(key);
}

function openStream(libraryId: string, userId: string, onMessage: () => void): void {
  const key = streamKey(libraryId, userId);
  // Reserve the slot synchronously so a second reconcile pass (e.g. another
  // globalSettings write landing before this promise resolves) can't open a duplicate.
  activeStreams.set(key, null);
  customComponentLibrariesService
    .streamDevBundleUpdates(libraryId, userId, { onMessage, onError: () => {} }) // fetchEventSource auto-retries
    .then((controller: AbortController) => {
      if (activeStreams.has(key)) activeStreams.set(key, controller);
      else controller.abort(); // slot was closed before the connection finished opening
    });
}

export const useCustomComponentLibrariesStore = create(
  zustandDevTools(
    (set: any, get: any): CustomComponentLibrariesState => ({
      libraries: null,
      loadFailed: false,
      devPreviewEmailsByUserId: {},
      devBundleUpdatedAt: {},
      manifests: {},

      // Cache-first: only the first caller hits the network, same staleness contract as a
      // published version (no polling). Pass force:true to bypass the cache (Retry, delete).
      fetchLibraries: async ({ force = false } = {}) => {
        const { libraries } = get();
        if (!force && libraries !== null) return libraries;
        if (inFlightFetch) return inFlightFetch;

        inFlightFetch = customComponentLibrariesService
          .list()
          .then((result) => {
            set(
              (state: CustomComponentLibrariesState) => ({
                libraries: result,
                loadFailed: false,
                manifests: { ...state.manifests, ...seedLatestManifests(result) },
                devPreviewEmailsByUserId: { ...state.devPreviewEmailsByUserId, ...buildDevPreviewEmailsByUserId(result) },
              }),
              false,
              'fetchLibraries'
            );
            return result;
          })
          .catch((error) => {
            set({ libraries: [], loadFailed: true }, false, 'fetchLibraries:error');
            throw error;
          })
          .finally(() => {
            inFlightFetch = null;
          });

        return inFlightFetch;
      },

      // Clears just the library-list cache (not the dev-preview stream state below) — call on
      // unmount of a page that only reads the list, like the WorkspaceSettings admin page.
      invalidate: () => set({ libraries: null, loadFailed: false }, false, 'invalidate:customComponentLibraries'),

      // Opens a live-reload stream only for pins where the viewer IS the pinned developer
      // (resolveOwnDevPins). Reads the cached list rather than fetching it — caller
      // re-invokes once fetchLibraries() resolves.
      syncDevPinStreams: (devPinKeys) => {
        if (!Object.keys(devPinKeys).length) {
          closeAllStreams();
          set({ devBundleUpdatedAt: {} }, false, 'syncDevPinStreams:empty');
          return;
        }

        const { libraries } = get();
        if (!libraries) return; // not fetched yet — caller re-invokes once fetchLibraries() resolves

        const currentUserId = (authenticationService.currentSessionValue as { current_user?: { id?: string } })
          ?.current_user?.id;
        const ownPins = resolveOwnDevPins(libraries, devPinKeys, currentUserId);
        const { toClose, toOpen } = diffStreamKeys(Array.from(activeStreams.keys()), ownPins);

        toClose.forEach(closeStream);
        toOpen.forEach(([libraryId, userId]) =>
          openStream(libraryId, userId, () => {
            // A live push means this library's cached dev manifest is stale — drop it.
            const devKey = buildManifestCacheKey(libraryId, `dev:${userId}`);
            set(
              (state: CustomComponentLibrariesState) => {
                const { [devKey]: _removed, ...manifests } = state.manifests;
                return {
                  devBundleUpdatedAt: { ...state.devBundleUpdatedAt, [libraryId]: Date.now() },
                  manifests,
                };
              },
              false,
              'devBundleUpdated'
            );
          })
        );
      },

      // Fetches manifest.json for (libraryId, revision), cached by that pair — a cache hit
      // never re-fetches. Dev slots rely on invalidateManifest for freshness instead.
      // Shared by the widget runtime, Inspector, and palette so it's fetched once.
      fetchManifest: async (libraryId, revision) => {
        const key = buildManifestCacheKey(libraryId, revision);
        if (get().manifests[key]) return;
        if (manifestInFlight.has(key)) return manifestInFlight.get(key);

        const promise = fetch(libraryFileUrl(libraryId, revision, 'manifest.json'))
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (data) set((state: CustomComponentLibrariesState) => ({ manifests: { ...state.manifests, [key]: data } }), false, 'fetchManifest');
          })
          .catch(() => {})
          .finally(() => manifestInFlight.delete(key));

        manifestInFlight.set(key, promise);
        return promise;
      },

      // Evicts one manifest cache entry — used for dev slots whenever content may have
      // changed (a live push, or switching a pin to dev).
      invalidateManifest: (libraryId, revision) => {
        const key = buildManifestCacheKey(libraryId, revision);
        set(
          (state: CustomComponentLibrariesState) => {
            if (!(key in state.manifests)) return state;
            const { [key]: _removed, ...manifests } = state.manifests;
            return { manifests };
          },
          false,
          'invalidateManifest'
        );
      },

      // Closes every stream and clears all dev-preview + library-list state — call on app
      // switch/unmount so connections don't leak and the next app sees a fresh library list.
      resetAll: () =>
        set(
          () => {
            closeAllStreams();
            return {
              devPreviewEmailsByUserId: {},
              devBundleUpdatedAt: {},
              libraries: null,
              loadFailed: false,
              manifests: {},
            };
          },
          false,
          'resetAll'
        ),
    }),
    { name: 'customComponentLibrariesStore' }
  )
);
