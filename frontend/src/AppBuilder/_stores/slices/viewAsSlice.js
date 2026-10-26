// "View as" in preview: `target` is the user or group picked in Preview settings ({ kind, id,
// label }), `identity` is how the server describes who it simulated (see _helpers/viewAs.js).
// Both are null when previewing as yourself. Only the canvas app is simulated, never modules.
const initialState = {
  viewAs: { target: null, identity: null },
};

export const createViewAsSlice = (set) => ({
  ...initialState,
  setViewAs: (target, identity) => {
    set((state) => {
      state.viewAs = { target, identity };
    });
  },
});
