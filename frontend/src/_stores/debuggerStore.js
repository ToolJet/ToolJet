import create from 'zustand';

const useDebuggerStore = create((set) => ({
  selectedError: null,
  setSelectedError: (error) => set({ selectedError: error }),
}));

export default useDebuggerStore;
