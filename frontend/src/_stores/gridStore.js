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
    (set) => ({
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
    document.querySelector(`.dragged-movable-control-box`)?.classList?.remove('dragged-movable-control-box');
    document.querySelector(`[target-id='${draggingComponentId}']`).classList.add('dragged-movable-control-box');
  } else if (document.querySelector(`.dragged-movable-control-box`)) {
    document.querySelector(`.dragged-movable-control-box`)?.classList.remove('dragged-movable-control-box');
  }
});

// useEditorStore.subscribe(({ hoveredComponent }) => {
//   console.log('hoveredComponent--', hoveredComponent);
//   if (hoveredComponent) {
//     document.querySelector(`[data-hovered-control]`)?.removeAttribute('data-hovered-control');
//     document.querySelector(`[target-id='${hoveredComponent}']`)?.setAttribute('data-hovered-control', true);
//   } else if (document.querySelector(`[data-hovered-control]`)) {
//     document.querySelector(`[data-hovered-control]`)?.removeAttribute('data-hovered-control');
//   }
// });

export const useActiveGrid = () => useGridStore((state) => state.activeGrid, shallow);
export const useNoOfGrid = () => useGridStore((state) => state.noOfGrid, shallow);
export const useDraggedSubContainer = () => useGridStore((state) => state.draggedSubContainer, shallow);
export const useGridStoreActions = () => useGridStore((state) => state.actions, shallow);
export const useDragTarget = () => useGridStore((state) => state.dragTarget, shallow);
export const useResizingComponentId = () => useGridStore((state) => state.resizingComponentId, shallow);
export const useIsGroupHandleHoverd = () => useGridStore((state) => state.isGroupHandleHoverd, shallow);
export const useOpenModalWidgetId = () => useGridStore((state) => state.openModalWidgetId, shallow);
