import { create, zustandDevTools } from './utils';

const initialState = {
  draggedElement: null,
  activeGrid: null,
  noOfGrid: 43,
};

export const useGridStore = create(
  zustandDevTools(
    (set, get) => ({
      ...initialState,
      actions: {
        setActiveGrid: (gridId) => set({ activeGrid: gridId }),
        setNoOfGrid: (noOfGrid) => set({ noOfGrid }),
      },
    }),
    { name: 'Grid Store' }
  )
);

export const useActiveGrid = () => useGridStore((state) => [state.activeGrid, state.actions.setActiveGrid]);
export const useNoOfGrid = () => useGridStore((state) => [state.noOfGrid, state.actions.setNoOfGrid]);
