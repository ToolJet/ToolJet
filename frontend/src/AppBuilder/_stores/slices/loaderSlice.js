const initialState = {
  loaderStore: {
    modules: {
      canvas: {
        isEditorLoading: true,
        // Scoped to the canvas widget tree only — keeps the editor chrome (header,
        // sidebars, AI chat) mounted while the app definition is re-fetched.
        isCanvasReloading: false,
      },
    },
  },
};

export const createLoaderSlice = (set, get) => ({
  ...initialState,
  initializeLoaderSlice: (moduleId) => {
    set(
      (state) => {
        state.loaderStore.modules[moduleId] = {
          ...initialState.loaderStore.modules.canvas,
        };
      },
      false,
      'initializeLoaderSlice'
    );
  },
  setEditorLoading: (status, moduleId = 'canvas') =>
    set(
      (state) => {
        state.loaderStore.modules[moduleId].isEditorLoading = status;
      },
      false,
      'setEditorLoading'
    ),
  setCanvasReloading: (status, moduleId = 'canvas') =>
    set(
      (state) => {
        state.loaderStore.modules[moduleId].isCanvasReloading = status;
      },
      false,
      'setCanvasReloading'
    ),
  setIsLoaderLoading: (status, moduleId = 'canvas') =>
    set(
      (state) => {
        state.loaderStore.modules[moduleId] = {
          isLoaderLoading: status,
        };
      },
      false,
      'setIsLoaderLoading'
    ),
  getEditorLoading: (moduleId) => get().loaderStore.modules[moduleId].isEditorLoading,
});
