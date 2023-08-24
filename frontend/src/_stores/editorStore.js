import { create, zustandDevTools } from './utils';

const initialState = {
  currentLayout: 'desktop',
  showComments: false,
  isEditorActive: false,
  currentSidebarTab: 2,
  selectedComponents: [],
  selectedComponent: null,
  scrollOptions: {
    container: null,
    throttleTime: 0,
    threshold: 0,
  },
  canUndo: false,
  canRedo: false,
  currentVersion: {},
  noOfVersionsSupported: 100,
  appDefinition: {},
  // isSaving: false,
  isUpdatingEditorStateInProcess: false,
  saveError: false,
  isLoading: true,
  defaultComponentStateComputed: false,
  showLeftSidebar: true,
  queryConfirmationList: [],
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
        updateEditorState: (state) => set((prev) => ({ ...prev, ...state })),
        updateQueryConfirmationList: (queryConfirmationList) => set({ queryConfirmationList }),
      },
    }),
    { name: 'Editor Store' }
  )
);

export const useEditorActions = () => useEditorStore((state) => state.actions);
export const useEditorState = () => useEditorStore((state) => state);
