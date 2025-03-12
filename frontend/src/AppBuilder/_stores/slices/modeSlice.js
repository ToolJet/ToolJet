const initialState = {
  currentMode: 'view',
};

export const createModeSlice = (set) => ({
  ...initialState,
  setCurrentMode: (currentMode) => set(() => ({ currentMode }), false, 'setCurrentMode'),
});
