import { RIGHT_SIDE_BAR_TAB } from '@/AppBuilder/RightSideBar/rightSidebarConstants';

const initialState = {
  activeRightSideBarTab: null,
  isRightSidebarOpen: false,
  isRightSidebarPinned: false,
  isCanvasHeaderSelected: false,
  isCanvasFooterSelected: false,
  // What the configuration panel is showing: { type: 'component', id } | { type: 'header' } | { type: 'footer' }.
  // Set when something is selected on the canvas; clearing the selection (an empty-canvas click)
  // leaves it alone, so the right side never changes on its own.
  rightPanelSubject: null,
  variablePanelContext: null,
  variablePanelRevision: 0,
};

export const createRightSideBarSlice = (set, get) => ({
  ...initialState,
  setActiveRightSideBarTab: (tab) => {
    set(() => ({ activeRightSideBarTab: tab }), false, 'setActiveRightSideBarTab');
  },
  toggleRightSidebar: () =>
    set((state) => ({ isRightSidebarOpen: !state.isRightSidebarOpen }), false, 'toggleRightSidebar'),
  setRightSidebarOpen: (open) => set(() => ({ isRightSidebarOpen: open }), false, 'setRightSidebarOpen'),
  openVariablePanel: ({ mode = 'detail', scope = 'app', name, runtimeKey } = {}, moduleId = 'canvas') => {
    set((state) => {
      state.variablePanelRevision += 1;
      state.variablePanelContext = {
        revision: state.variablePanelRevision,
        mode,
        scope,
        name,
        runtimeKey,
        moduleId,
        pageId: get().getCurrentPageId(moduleId),
        versionId: get().currentVersionId,
      };
      state.rightPanelSubject = { type: 'variable' };
      state.activeRightSideBarTab = RIGHT_SIDE_BAR_TAB.VARIABLES;
      state.isRightSidebarOpen = true;
    });
  },
  // A late create/rename completion must not reopen a closed panel or replace another selection.
  showSavedVariablePanel: (context, scope, name) => {
    if (
      get().variablePanelContext !== context ||
      !get().isRightSidebarOpen ||
      get().activeRightSideBarTab !== RIGHT_SIDE_BAR_TAB.VARIABLES ||
      get().currentVersionId !== context.versionId
    )
      return;
    set((state) => {
      state.variablePanelContext = { ...context, mode: 'detail', scope, name, runtimeKey: undefined };
    });
  },
  closeVariablePanel: (context) => {
    if (context && get().variablePanelContext !== context) return;
    if (get().activeRightSideBarTab !== RIGHT_SIDE_BAR_TAB.VARIABLES) return;
    set((state) => {
      state.isRightSidebarOpen = false;
      state.activeRightSideBarTab = null;
    });
  },
  toggleRightSidebarPin: () =>
    set((state) => ({ isRightSidebarPinned: !state.isRightSidebarPinned }), false, 'toggleRightSidebarPin'),
  setCanvasHeaderSelected: (selected) => {
    set(
      (state) => {
        state.isCanvasHeaderSelected = selected;
        state.isCanvasFooterSelected = false;
        state.selectedComponents = [];
        if (selected) {
          state.rightPanelSubject = { type: 'header' };
          state.activeRightSideBarTab = RIGHT_SIDE_BAR_TAB.CONFIGURATION;
          if (!state.isRightSidebarOpen) {
            state.isRightSidebarOpen = true;
          }
        }
      },
      false,
      'setCanvasHeaderSelected'
    );
  },
  setCanvasFooterSelected: (selected) => {
    set(
      (state) => {
        state.isCanvasFooterSelected = selected;
        state.isCanvasHeaderSelected = false;
        state.selectedComponents = [];
        if (selected) {
          state.rightPanelSubject = { type: 'footer' };
          state.activeRightSideBarTab = RIGHT_SIDE_BAR_TAB.CONFIGURATION;
          if (!state.isRightSidebarOpen) {
            state.isRightSidebarOpen = true;
          }
        }
      },
      false,
      'setCanvasFooterSelected'
    );
  },
});
