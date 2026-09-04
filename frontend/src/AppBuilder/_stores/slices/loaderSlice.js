const initialState = {
  loaderStore: {
    modules: {
      canvas: {
        isEditorLoading: true,
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
