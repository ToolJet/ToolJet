import { create, zustandDevTools } from './utils';

const initialState = {
  currentLayout: 'desktop',
  showComments: false,
};

export const useEditorDataStore = create(
  zustandDevTools((set, get) => ({
    ...initialState,
    actions: {
      setShowComments: (showComments) => set({ showComments }),
      toggleComments: () => set({ showComments: !get().showComments }),
      toggleCurrentLayout: (currentLayout) => set({ currentLayout }),
    },
  }))
);
