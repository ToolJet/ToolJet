import { create, zustandDevTools } from './utils';
import { customComponentLibrariesService } from '@/_services/customComponentLibraries.service';

// Module-scoped, NOT zustand state — one AbortController per active (libraryId, userId) SSE
// connection. Deliberately kept outside the store so it's never touched by devtools/persist
// machinery (invariant #14: dev preview stays session-local, never persisted).
const activeStreams = new Map(); // `${libraryId}:${userId}` -> AbortController

const userIdFromDevValue = (value) => value?.slice(4); // 'dev:{userId}' -> '{userId}'
const streamKey = (libraryId, userId) => `${libraryId}:${userId}`;

function closeStream(libraryId, value) {
  if (!value) return;
  const key = streamKey(libraryId, userIdFromDevValue(value));
  activeStreams.get(key)?.abort();
  activeStreams.delete(key);
}

export const useCustomComponentPreviewStore = create(
  zustandDevTools(
    (set, get) => ({
      devPreviews: {}, // { [libraryId]: 'dev:{userId}' }
      devPreviewEmails: {}, // { [libraryId]: email } — feeds the canvas "dev: email" badge (P8)
      devBundleUpdatedAt: {}, // { [libraryId]: number } — nonce bumped on each live-reload push

      setDevPreview: (libraryId, value, email) => {
        const prevValue = get().devPreviews?.[libraryId];

        if (prevValue !== value) {
          closeStream(libraryId, prevValue);

          const userId = userIdFromDevValue(value);
          const key = streamKey(libraryId, userId);
          if (!activeStreams.has(key)) {
            // Reserve the slot synchronously so a second widget instance of the same library
            // rendering before the promise resolves doesn't open a duplicate connection.
            activeStreams.set(key, null);
            customComponentLibrariesService
              .streamDevBundleUpdates(libraryId, userId, {
                onMessage: () =>
                  set(
                    (state) => ({ devBundleUpdatedAt: { ...state.devBundleUpdatedAt, [libraryId]: Date.now() } }),
                    false,
                    'devBundleUpdated'
                  ),
                onError: () => {}, // fetchEventSource auto-retries; nothing to do here
              })
              .then((controller) => {
                if (activeStreams.has(key)) activeStreams.set(key, controller);
                else controller.abort(); // slot was closed before the connection finished opening
              });
          }
        }

        set(
          (state) => ({
            devPreviews: { ...state.devPreviews, [libraryId]: value },
            devPreviewEmails: { ...state.devPreviewEmails, [libraryId]: email ?? null },
          }),
          false,
          'setDevPreview'
        );
      },

      clearDevPreview: (libraryId) =>
        set(
          (state) => {
            closeStream(libraryId, state.devPreviews?.[libraryId]);
            const { [libraryId]: _removed, ...rest } = state.devPreviews;
            const { [libraryId]: _removedEmail, ...restEmails } = state.devPreviewEmails;
            const { [libraryId]: _removedNonce, ...restNonce } = state.devBundleUpdatedAt;
            return { devPreviews: rest, devPreviewEmails: restEmails, devBundleUpdatedAt: restNonce };
          },
          false,
          'clearDevPreview'
        ),

      // Closes every active stream and clears all dev-preview state — call on app switch/
      // unmount so connections don't leak across apps (see PENDING.md P8 verification note).
      resetAllDevPreviews: () =>
        set(
          (state) => {
            Object.entries(state.devPreviews ?? {}).forEach(([libraryId, value]) => closeStream(libraryId, value));
            return { devPreviews: {}, devPreviewEmails: {}, devBundleUpdatedAt: {} };
          },
          false,
          'resetAllDevPreviews'
        ),
    }),
    { name: 'customComponentPreviewStore' }
  )
);
