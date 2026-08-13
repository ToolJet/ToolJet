import { create, zustandDevTools } from './utils';

export const useCustomComponentPreviewStore = create(
  zustandDevTools(
    (set) => ({
      devPreviews: {}, // { [libraryId]: 'dev:{userId}' }
      devPreviewEmails: {}, // { [libraryId]: email } — feeds the canvas "dev: email" badge (P8)
      setDevPreview: (libraryId, value, email) =>
        set(
          (state) => ({
            devPreviews: { ...state.devPreviews, [libraryId]: value },
            devPreviewEmails: { ...state.devPreviewEmails, [libraryId]: email ?? null },
          }),
          false,
          'setDevPreview'
        ),
      clearDevPreview: (libraryId) =>
        set(
          (state) => {
            const { [libraryId]: _removed, ...rest } = state.devPreviews;
            const { [libraryId]: _removedEmail, ...restEmails } = state.devPreviewEmails;
            return { devPreviews: rest, devPreviewEmails: restEmails };
          },
          false,
          'clearDevPreview'
        ),
    }),
    { name: 'customComponentPreviewStore' }
  )
);
