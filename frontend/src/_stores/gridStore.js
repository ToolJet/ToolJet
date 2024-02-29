import { create, zustandDevTools } from './utils';
import { shallow } from 'zustand/shallow';

const initialState = {
  draggedElement: null,
  activeGrid: null,
  noOfGrid: 43,
  draggedSubContainer: false,
  resizingComponentId: null,
  draggingComponentId: null,
  dragTarget: null,
  isGroupHandleHoverd: false,
  idGroupDragged: false,
  openModalWidgetId: null,
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
        setDragTarget: (dragTarget) => set({ dragTarget }),
        setIsGroupHandleHoverd: (isGroupHandleHoverd) => set({ isGroupHandleHoverd }),
        setIdGroupDragged: (idGroupDragged) => set({ idGroupDragged }),
        setOpenModalWidgetId: (openModalWidgetId) => set({ openModalWidgetId }),
      },
    }),
    { name: 'Grid Store' }
  )
);

useGridStore.subscribe(({ draggingComponentId }) => {
  if (draggingComponentId) {
    document.querySelector(`[target-id='${draggingComponentId}']`).classList.add('visible-movable-control-box');
  } else if (document.querySelector(`.visible-movable-control-box`)) {
    document.querySelector(`.visible-movable-control-box`).classList.remove('visible-movable-control-box');
  }
});

export const useActiveGrid = () => useGridStore((state) => state.activeGrid, shallow);
export const useNoOfGrid = () => useGridStore((state) => state.noOfGrid, shallow);
export const useDraggedSubContainer = () => useGridStore((state) => state.draggedSubContainer, shallow);
export const useGridStoreActions = () => useGridStore((state) => state.actions, shallow);
export const useDragTarget = () => useGridStore((state) => state.dragTarget, shallow);
export const useResizingComponentId = () => useGridStore((state) => state.resizingComponentId, shallow);
export const useIsGroupHandleHoverd = () => useGridStore((state) => state.isGroupHandleHoverd, shallow);
export const useOpenModalWidgetId = () => useGridStore((state) => state.openModalWidgetId, shallow);
