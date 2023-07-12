import { create, zustandDevTools } from './utils';

const STORE_NAME = 'Editor';
const ACTIONS = {
  SET_SHOW_COMMENTS: 'SET_SHOW_COMMENTS',
  SET_HOVERED_COMPONENT: 'SET_HOVERED_COMPONENT',
  TOGGLE_COMMENTS: 'TOGGLE_COMMENTS',
  TOGGLE_CURRENT_LAYOUT: 'TOGGLE_CURRENT_LAYOUT',
  SET_SELECTION_IN_PROGRESS: 'SET_SELECTION_IN_PROGRESS',
};

const initialState = {
  currentLayout: 'desktop',
  showComments: false,
  hoveredComponent: '',
  selectionInProgress: false,
};

export const useEditorDataStore = create(
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
      },
    }),
    { name: STORE_NAME }
  )
);
