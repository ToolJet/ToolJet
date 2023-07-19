import { create, zustandDevTools } from './utils';

const initialState = {
  currentLayout: 'desktop',
  showComments: false,
};

export const useEditorStore = create(
  zustandDevTools(
    (set, get) => ({
      ...initialState,
      actions: {
        setShowComments: (showComments) => set({ showComments }),
        toggleComments: () => set({ showComments: !get().showComments }),
        toggleCurrentLayout: (currentLayout) => set({ currentLayout }),
      },
    }),
    { name: 'Editor Store' }
  )
);
