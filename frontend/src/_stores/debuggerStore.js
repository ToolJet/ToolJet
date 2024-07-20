import { create } from './utils';

const useDebuggerStore = create((set) => ({
  selectedError: null,
  setSelectedError: (error) => set({ selectedError: error }),
}));

export default useDebuggerStore;
