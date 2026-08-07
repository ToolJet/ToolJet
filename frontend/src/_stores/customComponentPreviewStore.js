import { create, zustandDevTools } from './utils';

// F5: LOCAL dev-preview overrides for custom component libraries.
// Design 38-4040: "Dev preview @email · preview only" — selecting a dev bundle is a
// SESSION-ONLY override (never written to the app's pin / never autosaved), which is
// also why the viewer (a fresh session) can never render a dev bundle.
export const useCustomComponentPreviewStore = create(
  zustandDevTools(
    (set) => ({
      devPreviews: {}, // { [libraryId]: 'dev:{userId}' }
      setDevPreview: (libraryId, value) =>
        set((state) => ({ devPreviews: { ...state.devPreviews, [libraryId]: value } }), false, 'setDevPreview'),
      clearDevPreview: (libraryId) =>
        set(
          (state) => {
            const { [libraryId]: _removed, ...rest } = state.devPreviews;
            return { devPreviews: rest };
          },
          false,
          'clearDevPreview'
        ),
    }),
    { name: 'customComponentPreviewStore' }
  )
);
