const initialState = {
  isEditorLoading: true,
  isCanvasLoading: false,
};

export const createLoaderSlice = (set) => ({
  ...initialState,
  setEditorLoading: (status) => set(() => ({ isEditorLoading: status }), false, 'setEditorLoading'),
  setCanvasLoading: (status) => set(() => ({ isCanvasLoading: status }), false, 'setCanvasLoading'),
});
