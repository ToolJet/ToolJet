import { create, zustandDevTools } from './utils';
import { shallow } from 'zustand/shallow';

const initialState = {
  draggedElement: null,
  activeGrid: null,
  noOfGrid: 43,
  draggedSubContainer: false,
  resizingComponentId: null,
  dragTarget: null,
  isGroupHandleHoverd: false,
  idGroupDragged: false,
  openModalWidgetId: null,
  subContainerWidths: {},
  reorderContainerChildren: {
    containerId: null,
    triggerUpdate: 0,
  },
};

export const useGridStore = create(
  zustandDevTools(
    (set) => ({
      ...initialState,
      actions: {
        setResizingComponentId: (id) => set({ resizingComponentId: id }),
        setDragTarget: (dragTarget) => set({ dragTarget }),
        setIsGroupHandleHoverd: (isGroupHandleHoverd) => set({ isGroupHandleHoverd }),
        setIdGroupDragged: (idGroupDragged) => set({ idGroupDragged }),
        setOpenModalWidgetId: (openModalWidgetId) => set({ openModalWidgetId }),
        setSubContainerWidths: (id, width) =>
          set((state) => ({ subContainerWidths: { ...state.subContainerWidths, [id]: width } })),
        setReorderContainerChildren: (containerId) =>
          // Function to trigger reordering of specific container for tab navigation
          set((state) => ({
            reorderContainerChildren: { containerId, triggerUpdate: state.reorderContainerChildren.triggerUpdate + 1 },
          })),
      },
    }),
    { name: 'Grid Store' }
  )
);

useGridStore.subscribe(({ draggingComponentId }) => {
  if (draggingComponentId) {
    document.querySelector(`.dragged-movable-control-box`)?.classList?.remove('dragged-movable-control-box');
    document.querySelector(`[target-id='${draggingComponentId}']`)?.classList.add('dragged-movable-control-box');
  } else if (document.querySelector(`.dragged-movable-control-box`)) {
    document.querySelector(`.dragged-movable-control-box`)?.classList.remove('dragged-movable-control-box');
  }
});

export const useIsGroupHandleHoverd = () => useGridStore((state) => state.isGroupHandleHoverd, shallow);
export const useOpenModalWidgetId = () => useGridStore((state) => state.openModalWidgetId, shallow);
