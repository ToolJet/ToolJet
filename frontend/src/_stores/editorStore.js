import { create, zustandDevTools } from './utils';

const STORE_NAME = 'Editor';

const ACTIONS = {
  SET_SHOW_COMMENTS: 'SET_SHOW_COMMENTS',
  SET_HOVERED_COMPONENT: 'SET_HOVERED_COMPONENT',
  TOGGLE_COMMENTS: 'TOGGLE_COMMENTS',
  TOGGLE_CURRENT_LAYOUT: 'TOGGLE_CURRENT_LAYOUT',
  SET_SELECTION_IN_PROGRESS: 'SET_SELECTION_IN_PROGRESS',
  SET_SELECTED_COMPONENTS: 'SET_SELECTED_COMPONENTS',
  SET_IS_EDITOR_ACTIVE: 'SET_IS_EDITOR_ACTIVE',
};

const initialState = {
  currentLayout: 'desktop',
  showComments: false,
  hoveredComponent: '',
  selectionInProgress: false,
  selectedComponents: [],
  isEditorActive: false,
};

export const useEditorStore = create(
  zustandDevTools(
    (set, get) => ({
      ...initialState,
      actions: {
        setShowComments: (showComments) =>
          set({ showComments }, false, {
            type: ACTIONS.SET_HOVERED_COMPONENT,
            showComments,
          }),
        toggleComments: () =>
          set({ showComments: !get().showComments }, false, {
            type: ACTIONS.TOGGLE_COMMENTS,
          }),
        toggleCurrentLayout: (currentLayout) =>
          set({ currentLayout }, false, {
            type: ACTIONS.TOGGLE_CURRENT_LAYOUT,
            currentLayout,
          }),
        setIsEditorActive: (isEditorActive) => set(() => ({ isEditorActive })),
        setHoveredComponent: (hoveredComponent) =>
          set({ hoveredComponent }, false, {
            type: ACTIONS.SET_HOVERED_COMPONENT,
            hoveredComponent,
          }),
        setSelectionInProgress: (isSelectionInProgress) => {
          set(
            {
              isSelectionInProgress,
            },
            false,
            { type: ACTIONS.SET_SELECTION_IN_PROGRESS }
          );
        },
        setSelectedComponents: (selectedComponents) => {
          set(
            {
              selectedComponents,
            },
            false,
            { type: ACTIONS.SET_SELECTED_COMPONENTS }
          );
        },
      },
    }),
    { name: STORE_NAME }
  )
);
