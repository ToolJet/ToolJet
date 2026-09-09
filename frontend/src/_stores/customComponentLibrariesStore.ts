import { create, zustandDevTools } from './utils';
import { customComponentLibrariesService, type CustomComponentLibrary } from '@/_services/customComponentLibraries.service';
import { authenticationService } from '@/_services/authentication.service';
import { streamKey, resolveDevPins, diffStreamKeys } from '@/_helpers/customComponentLibrariesStoreUtils';

interface CustomComponentLibrariesState {
  libraries: CustomComponentLibrary[] | null; // null = not yet fetched
  loadFailed: boolean;
  devPreviewEmails: Record<string, string | null>; // { [libraryId]: email } — feeds the canvas "dev: email" badge
  devBundleUpdatedAt: Record<string, number>; // { [libraryId]: number } — nonce bumped on each live-reload push
  fetchLibraries: (options?: { force?: boolean }) => Promise<CustomComponentLibrary[]>;
  invalidate: () => void;
  syncDevPinStreams: (devPinKeys: Record<string, string>) => Promise<void>;
  resetAll: () => void;
}

// Module-scoped, not zustand state, so devtools/persist never touch it — dev bundle bytes
// must never persist into app state, only the pin string does (invariant #14, HANDOFF-NISHIDH.md).
const activeStreams = new Map<string, AbortController | null>(); // `${libraryId}:${userId}` -> AbortController

// Bumped on every syncDevPinStreams call so a call can tell if it's been superseded by the
// time its async work resolves — otherwise a stale call could undo a newer one's result.
let syncGeneration = 0;

// Dedupes concurrent fetchLibraries() calls (e.g. the RightSideBar tab and the dev-pin
// sync effect both running around the same time) into a single request.
let inFlightFetch: Promise<CustomComponentLibrary[]> | null = null;

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
      devPreviewEmails: {},
      devBundleUpdatedAt: {},

      // Cache-first: only the first caller hits the network, same staleness contract as a
      // published version (no polling). Pass force:true to bypass the cache (Retry, delete).
      fetchLibraries: async ({ force = false } = {}) => {
        const { libraries } = get();
        if (!force && libraries !== null) return libraries;
        if (inFlightFetch) return inFlightFetch;

        inFlightFetch = customComponentLibrariesService
          .list()
          .then((result) => {
            set({ libraries: result, loadFailed: false }, false, 'fetchLibraries');
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

      // Reconciles streams/badges against the current dev pins. Only opens a live-reload stream
      // for pins where the viewer IS the pinned developer (resolveDevPins) — everyone else still
      // gets the right badge/content, just without hot reload. Driven by the persisted pin, not
      // a UI click, so a teammate who never opened VersionPicker still sees the right dev bundle.
      syncDevPinStreams: async (devPinKeys) => {
        const myGeneration = ++syncGeneration;

        if (!Object.keys(devPinKeys).length) {
          closeAllStreams();
          set({ devBundleUpdatedAt: {}, devPreviewEmails: {} }, false, 'syncDevPinStreams:empty');
          return;
        }

        let libraries;
        try {
          libraries = await get().fetchLibraries();
        } catch {
          return; // transient failure — retried once the cache is forced or invalidated
        }

        // A newer call started (and possibly already reconciled) while fetchLibraries() was in
        // flight — applying this stale result would fight it, so bail out.
        if (myGeneration !== syncGeneration) return;

        const currentUserId = (authenticationService.currentSessionValue as { current_user?: { id?: string } })
          ?.current_user?.id;
        const { emails, ownPins } = resolveDevPins(libraries, devPinKeys, currentUserId);
        const { toClose, toOpen } = diffStreamKeys(Array.from(activeStreams.keys()), ownPins);

        toClose.forEach(closeStream);
        toOpen.forEach(([libraryId, userId]) =>
          openStream(libraryId, userId, () =>
            set(
              (state: CustomComponentLibrariesState) => ({
                devBundleUpdatedAt: { ...state.devBundleUpdatedAt, [libraryId]: Date.now() },
              }),
              false,
              'devBundleUpdated'
            )
          )
        );

        set(
          (state: CustomComponentLibrariesState) => ({ devPreviewEmails: { ...state.devPreviewEmails, ...emails } }),
          false,
          'syncDevPinStreams'
        );
      },

      // Closes every stream and clears all dev-preview + library-list state — call on app
      // switch/unmount so connections don't leak and the next app sees a fresh library list.
      resetAll: () =>
        set(
          () => {
            closeAllStreams();
            return { devPreviewEmails: {}, devBundleUpdatedAt: {}, libraries: null, loadFailed: false };
          },
          false,
          'resetAll'
        ),
    }),
    { name: 'customComponentLibrariesStore' }
  )
);
