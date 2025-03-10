import { NO_OF_GRIDS } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import { debounce } from 'lodash';

const initialState = {
  hoveredComponentForGrid: '',
  hoveredComponentBoundaryId: '',
  triggerCanvasUpdater: false,
  lastCanvasIdClick: '',
  lastCanvasClickPosition: null,
};

export const createGridSlice = (set, get) => ({
  ...initialState,
  setHoveredComponentForGrid: (id) =>
    set(() => ({ hoveredComponentForGrid: id }), false, { type: 'setHoveredComponentForGrid', id }),
  getHoveredComponentForGrid: () => get().hoveredComponentForGrid,
  setHoveredComponentBoundaryId: (id) =>
    set(() => ({ hoveredComponentBoundaryId: id }), false, { type: 'setHoveredComponentBoundaryId', id }),
  toggleCanvasUpdater: () =>
    set((state) => ({ triggerCanvasUpdater: !state.triggerCanvasUpdater }), false, { type: 'toggleCanvasUpdater' }),
  debouncedToggleCanvasUpdater: debounce(() => {
    get().toggleCanvasUpdater();
  }, 200),
  moveComponentPosition: (direction) => {
    const { setComponentLayout, currentLayout, getSelectedComponentsDefinition, debouncedToggleCanvasUpdater } = get();
    let layouts = {};
    const selectedComponents = getSelectedComponentsDefinition();
    selectedComponents.forEach((selectedComponent) => {
      const componentId = selectedComponent?.id;

      let top = selectedComponent.layouts?.[currentLayout].top;
      let left = selectedComponent?.layouts?.[currentLayout].left;
      const width = selectedComponent?.layouts?.[currentLayout]?.width;

      switch (direction) {
        case 'ArrowLeft':
          left = left - 1;
          break;
        case 'ArrowRight':
          left = left + 1;
          break;
        case 'ArrowDown':
          top = top + 10;
          break;
        case 'ArrowUp':
          top = top - 10;
          break;
      }

      if (left < 0 || top < 0 || left + width > NO_OF_GRIDS) {
        return;
      }

      const movedElement = document.getElementById(componentId);
      const parentElm = movedElement.closest('.real-canvas');
      if (selectedComponent?.component?.parent && parentElm.clientHeight < top + movedElement.clientHeight) {
        return;
      }
      layouts = {
        ...layouts,
        [componentId]: {
          top,
          left,
        },
      };
    });
    setComponentLayout(layouts);
    debouncedToggleCanvasUpdater();
  },
  setLastCanvasIdClick: (id) => set(() => ({ lastCanvasIdClick: id })),
  setLastCanvasClickPosition: (position) => {
    set({ lastCanvasClickPosition: position });
  },
});
