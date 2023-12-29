import { create, zustandDevTools } from './utils';
import { shallow } from 'zustand/shallow';

const initialState = {
  draggedElement: null,
  activeGrid: null,
  noOfGrid: 43,
  draggedSubContainer: false,
  resizingComponentId: null,
  draggingComponentId: null,
};

export const useGridStore = create(
  zustandDevTools(
    (set, get) => ({
      ...initialState,
      actions: {
        setActiveGrid: (gridId) => set({ activeGrid: gridId }),
        setNoOfGrid: (noOfGrid) => set({ noOfGrid }),
        setDraggedSubContainer: (draggedSubContainer) => set({ draggedSubContainer }),
        setResizingComponentId: (id) => set({ resizingComponentId: id }),
        setDraggingComponentId: (id) => set({ draggingComponentId: id }),
      },
    }),
    { name: 'Grid Store' }
  )
);

export const useActiveGrid = () => useGridStore((state) => state.activeGrid, shallow);
export const useNoOfGrid = () => useGridStore((state) => [state.noOfGrid, state.actions.setNoOfGrid]);
export const useDraggedSubContainer = () =>
  useGridStore((state) => [state.draggedSubContainer, state.actions.setDraggedSubContainer]);
export const useGridStoreActions = () => useGridStore((state) => state.actions, shallow);
