import { create, zustandDevTools } from './utils';

const initialState = {
  appId: null,
  currentLayout: 'desktop',
  showComments: false,
  isEditorActive: false,
};

export const useEditorStore = create(
  zustandDevTools(
    (set, get) => ({
      ...initialState,
      actions: {
        setShowComments: (showComments) => set({ showComments }),
        toggleComments: () => set({ showComments: !get().showComments }),
        toggleCurrentLayout: (currentLayout) => set({ currentLayout }),
        setIsEditorActive: (isEditorActive) => set(() => ({ isEditorActive })),
        setAppId: (appId) => set(() => ({ appId })),
      },
    }),
    { name: 'Editor Store' }
  )
);
