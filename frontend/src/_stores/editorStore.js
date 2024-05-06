import _ from 'lodash';
import { create } from './utils';
import { v4 as uuid } from 'uuid';
import { useResolveStore } from './resolverStore';
const STORE_NAME = 'Editor';

export const EMPTY_ARRAY = [];

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
  selectedComponent: null,
  canUndo: false,
  canRedo: false,
  currentVersion: {},
  noOfVersionsSupported: 100,
  appDefinition: {},
  isUpdatingEditorStateInProcess: false,
  saveError: false,
  isLoading: true,
  defaultComponentStateComputed: false,
  showLeftSidebar: true,
  queryConfirmationList: [],
  currentPageId: null,
  currentSessionId: uuid(),
  componentsNeedsUpdateOnNextRender: [],
  appMode: 'auto',
  editorCanvasWidth: 1092,
};

export const useEditorStore = create(
  //Redux Dev tools for this store are disabled since its freezing chrome tab
  (set, get) => ({
    ...initialState,
    actions: {
      setShowComments: (showComments) =>
        set({ showComments }, false, {
          type: ACTIONS.SET_HOVERED_COMPONENT,
          showComments,
        }),
      setCanvasWidth: (editorCanvasWidth) => set({ editorCanvasWidth }),
      toggleComments: () =>
        set({ showComments: !get().showComments }, false, {
          type: ACTIONS.TOGGLE_COMMENTS,
        }),
      toggleCurrentLayout: (currentLayout) => {
        set({ selectedComponents: EMPTY_ARRAY });
        set({ currentLayout }, false, {
          type: ACTIONS.TOGGLE_CURRENT_LAYOUT,
          currentLayout,
        });
      },
      setIsEditorActive: (isEditorActive) => set(() => ({ isEditorActive })),
      updateEditorState: (state) => set((prev) => ({ ...prev, ...state })),
      updateCurrentStateDiff: (currentStateDiff) => set(() => ({ currentStateDiff })),
      updateComponentsNeedsUpdateOnNextRender: (componentsNeedsUpdateOnNextRender) => {
        set(() => ({ componentsNeedsUpdateOnNextRender }));
      },
      flushComponentsNeedsUpdateOnNextRender: (toRemoveIds = []) => {
        const currentComponents = get().componentsNeedsUpdateOnNextRender;

        if (currentComponents.length === 0 || toRemoveIds.length === 0) return;

        const updatedComponents = currentComponents.filter((item) => !toRemoveIds.includes(item));

        set(() => ({ componentsNeedsUpdateOnNextRender: updatedComponents }));
      },

      updateQueryConfirmationList: (queryConfirmationList) => set({ queryConfirmationList }),
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
      setSelectedComponents: (selectedComponents, isMulti = false) => {
        const newSelectedComponents = isMulti
          ? [...get().selectedComponents, ...selectedComponents]
          : selectedComponents;

        set({
          selectedComponents: newSelectedComponents,
        });
      },
      setCurrentPageId: (currentPageId) => set({ currentPageId }),
      setAppMode: (appMode) => set({ appMode }),
    },
  }),
  { name: STORE_NAME }
);

export const useEditorActions = () => useEditorStore((state) => state.actions);
export const useEditorState = () => useEditorStore((state) => state);

export const getComponentsToRenders = () => {
  return useEditorStore.getState().componentsNeedsUpdateOnNextRender;
};

export const flushComponentsToRender = (componentIds = []) => {
  if (!componentIds.length) return;

  useEditorStore.getState().actions.flushComponentsNeedsUpdateOnNextRender(componentIds);
  useResolveStore.getState().actions.flushLastUpdatedRefs();
};
