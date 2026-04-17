export const createLibrarySlice = (set, get) => ({
  jsLibraryRegistry: {},
  jsLibraryLoading: false,
  jsLibraryError: null,

  setJsLibraryRegistry: (registry) => set(() => ({ jsLibraryRegistry: registry }), false, 'setJsLibraryRegistry'),

  setJsLibraryLoading: (loading) => set(() => ({ jsLibraryLoading: loading }), false, 'setJsLibraryLoading'),

  setJsLibraryError: (error) => set(() => ({ jsLibraryError: error }), false, 'setJsLibraryError'),

  getJsLibraryRegistry: () => get().jsLibraryRegistry,
});
