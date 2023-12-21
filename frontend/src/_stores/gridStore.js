import { create, zustandDevTools } from './utils';

const initialState = {
  draggedElement: null,
  activeGrid: null,
  noOfGrid: 43,
  draggedSubContainer: false,
};

export const useGridStore = create(
  zustandDevTools(
    (set, get) => ({
      ...initialState,
      actions: {
        setActiveGrid: (gridId) => set({ activeGrid: gridId }),
        setNoOfGrid: (noOfGrid) => set({ noOfGrid }),
        setDraggedSubContainer: (draggedSubContainer) => set({ draggedSubContainer }),
      },
    }),
    { name: 'Grid Store' }
  )
);

export const useActiveGrid = () => useGridStore((state) => [state.activeGrid, state.actions.setActiveGrid]);
export const useNoOfGrid = () => useGridStore((state) => [state.noOfGrid, state.actions.setNoOfGrid]);
export const useDraggedSubContainer = () =>
  useGridStore((state) => [state.draggedSubContainer, state.actions.setDraggedSubContainer]);
