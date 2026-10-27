import { create, zustandDevTools } from './utils';
import { shallow } from 'zustand/shallow';

const initialState = {
  openModalWidgetId: null,
  subContainerWidths: {},
  currentDragCanvasId: null,
  ghostDragPosition: null,
};

export const useGridStore = create(
  zustandDevTools(
    (set, get) => ({
      ...initialState,
      actions: {
        setOpenModalWidgetId: (openModalWidgetId) => set({ openModalWidgetId }),
        setSubContainerWidths: (id, width) =>
          set((state) => ({ subContainerWidths: { ...state.subContainerWidths, [id]: width } })),
        setCurrentDragCanvasId: (canvasId) => {
          if (get().currentDragCanvasId === canvasId) return;
          set({ currentDragCanvasId: canvasId });
        },
        setGhostDragPosition: (position) => set({ ghostDragPosition: position }),
      },
      getGhostDragPosition: () => get().ghostDragPosition,
    }),
    { name: 'Grid Store' }
  )
);

export const useOpenModalWidgetId = () => useGridStore((state) => state.openModalWidgetId, shallow);
