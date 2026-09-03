import { create, zustandDevTools } from './utils';
import { customComponentLibrariesService } from '@/_services/customComponentLibraries.service';
import { authenticationService } from '@/_services/authentication.service';
import { streamKey, resolveDevPins, diffStreamKeys } from '@/_helpers/customComponentPreviewStoreUtils';

// Module-scoped, NOT zustand state — one AbortController per active (libraryId, userId) SSE
// connection. Deliberately kept outside the store so it's never touched by devtools/persist
// machinery — dev bundle bytes still never persist into app state, only the pin (a plain
// version-style string, `dev:{userId}`) does; see invariant #14 in HANDOFF-NISHIDH.md.
const activeStreams = new Map(); // `${libraryId}:${userId}` -> AbortController

function closeAllStreams() {
  activeStreams.forEach((controller) => controller?.abort());
  activeStreams.clear();
}

function closeStream(key) {
  activeStreams.get(key)?.abort();
  activeStreams.delete(key);
}

function openStream(libraryId, userId, onMessage) {
  const key = streamKey(libraryId, userId);
  // Reserve the slot synchronously so a second reconcile pass (e.g. another
  // globalSettings write landing before this promise resolves) can't open a duplicate.
  activeStreams.set(key, null);
  customComponentLibrariesService
    .streamDevBundleUpdates(libraryId, userId, { onMessage, onError: () => {} }) // fetchEventSource auto-retries
    .then((controller) => {
      if (activeStreams.has(key)) activeStreams.set(key, controller);
      else controller.abort(); // slot was closed before the connection finished opening
    });
}

export const useCustomComponentPreviewStore = create(
  zustandDevTools(
    (set) => ({
      devPreviewEmails: {}, // { [libraryId]: email } — feeds the canvas "dev: email" badge
      devBundleUpdatedAt: {}, // { [libraryId]: number } — nonce bumped on each live-reload push

      // Reconciles emails/streams against the CURRENT set of dev-pinned libraries.
      // Only opens a live-reload stream for pins where the viewer IS the pinned developer
      // (see resolveDevPins) — everyone else still gets the correct dev content/badge from
      // this same resolve, just without hot reload. Driven by the persisted pin
      // (globalSettings), not a UI click - a teammate who never opened VersionPicker still
      // sees the right dev bundle, they just don't get pushed updates for someone else's work.
      syncDevPinStreams: async (devPinKeys) => {
        if (!Object.keys(devPinKeys).length) {
          closeAllStreams();
          set({ devBundleUpdatedAt: {}, devPreviewEmails: {} }, false, 'syncDevPinStreams:empty');
          return;
        }

        let libraries;
        try {
          libraries = await customComponentLibrariesService.list();
        } catch {
          return; // transient failure — next globalSettings/pin change retries
        }

        const currentUserId = authenticationService.currentSessionValue?.current_user?.id;
        const { emails, ownPins } = resolveDevPins(libraries, devPinKeys, currentUserId);
        const { toClose, toOpen } = diffStreamKeys(Array.from(activeStreams.keys()), ownPins);

        toClose.forEach(closeStream);
        toOpen.forEach(([libraryId, userId]) =>
          openStream(libraryId, userId, () =>
            set(
              (state) => ({ devBundleUpdatedAt: { ...state.devBundleUpdatedAt, [libraryId]: Date.now() } }),
              false,
              'devBundleUpdated'
            )
          )
        );

        set((state) => ({ devPreviewEmails: { ...state.devPreviewEmails, ...emails } }), false, 'syncDevPinStreams');
      },

      // Closes every active stream and clears all dev-preview state — call on app switch/
      // unmount so connections don't leak across apps.
      resetAllDevPreviews: () =>
        set(
          () => {
            closeAllStreams();
            return { devPreviewEmails: {}, devBundleUpdatedAt: {} };
          },
          false,
          'resetAllDevPreviews'
        ),
    }),
    { name: 'customComponentPreviewStore' }
  )
);
