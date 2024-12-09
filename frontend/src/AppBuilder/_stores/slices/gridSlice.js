import { NO_OF_GRIDS } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import { debounce } from 'lodash';

const initialState = {
  hoveredComponentForGrid: '',
  triggerCanvasUpdater: false,
  lastCanvasIdClick: '',
  lastCanvasClickPosition: null,
  temporaryLayouts: {},
};

export const createGridSlice = (set, get) => ({
  ...initialState,
  setHoveredComponentForGrid: (id) =>
    set(() => ({ hoveredComponentForGrid: id }), false, { type: 'setHoveredComponentForGrid', id }),
  getHoveredComponentForGrid: () => get().hoveredComponentForGrid,
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
  setTemporaryLayouts: (layouts) => set(() => ({ temporaryLayouts: layouts })),
  getTemporaryLayouts: () => get().temporaryLayouts,
  clearTemporaryLayouts: () => set(() => ({ temporaryLayouts: {} })),
  adjustComponentPositions: (componentId, currentLayout = 'desktop', shouldPersist = false) => {
    const { getResolvedValue, getCurrentPageComponents, setTemporaryLayouts, setComponentLayout, toggleCanvasUpdater } =
      get();

    try {
      const currentPageComponents = getCurrentPageComponents();
      const boxList = Object.keys(currentPageComponents)
        .map((key) => {
          const widget = currentPageComponents[key];
          return {
            id: key,
            ...widget,
            height: widget?.layouts?.[currentLayout]?.height,
            left: widget?.layouts?.[currentLayout]?.left,
            top: widget?.layouts?.[currentLayout]?.top,
            width: widget?.layouts?.[currentLayout]?.width,
            parent: widget?.component?.parent,
            component: widget?.component,
          };
        })
        .filter((box) =>
          getResolvedValue(
            box?.component?.definition?.others[currentLayout === 'mobile' ? 'showOnMobile' : 'showOnDesktop'].value
          )
        );

      const changedComponent = boxList.find((box) => box.id === componentId);
      if (!changedComponent) return;

      const componentElement = document.querySelector(`.ele-${componentId}`);
      if (!componentElement) return;

      // Get the actual new height from the DOM
      const newHeight = componentElement.offsetHeight;
      const oldHeight = changedComponent.layouts[currentLayout].height;
      const heightDifference = newHeight - oldHeight;

      if (heightDifference === 0) return;

      // Update the changed component's height in layouts
      const updatedLayouts = {
        [componentId]: {
          ...changedComponent.layouts[currentLayout],
          height: newHeight,
        },
      };

      const changedCompLeft = changedComponent.layouts[currentLayout].left;
      const changedCompWidth = changedComponent.layouts[currentLayout].width;
      const changedCompRight = changedCompLeft + changedCompWidth;
      const changedCompTop = changedComponent.layouts[currentLayout].top;

      // Filter components that need adjustment
      const componentsToAdjust = boxList
        .filter((box) => {
          if (box.id === componentId) return false;

          const sameParent = box.component?.parent === changedComponent.component?.parent;
          const isBelow = box.layouts[currentLayout].top >= changedCompTop + oldHeight;

          const boxLeft = box.layouts[currentLayout].left;
          const boxRight = boxLeft + box.layouts[currentLayout].width;
          const hasHorizontalOverlap =
            (boxLeft >= changedCompLeft && boxLeft < changedCompRight) || // Left edge overlaps
            (boxRight > changedCompLeft && boxRight <= changedCompRight) || // Right edge overlaps
            (boxLeft <= changedCompLeft && boxRight >= changedCompRight); // Completely contains

          return sameParent && isBelow && hasHorizontalOverlap;
        })
        .sort((a, b) => a.layouts[currentLayout].top - b.layouts[currentLayout].top);

      // Update positions of affected components
      componentsToAdjust.forEach((component) => {
        const element = document.querySelector(`.ele-${component.id}`);
        if (!element) return;

        const newTop = component.layouts[currentLayout].top + Math.ceil(heightDifference / 10) * 10;

        const currentTransform = window.getComputedStyle(element).transform;
        const matrix = new DOMMatrix(currentTransform);
        const currentX = matrix.m41;
        element.style.transform = `translate(${currentX}px, ${newTop}px)`;

        updatedLayouts[component.id] = {
          ...component.layouts[currentLayout],
          top: newTop,
        };
      });

      if (shouldPersist) {
        setComponentLayout(updatedLayouts);
        get().clearTemporaryLayouts();
      } else {
        setTemporaryLayouts(updatedLayouts);
      }

      toggleCanvasUpdater();
      return updatedLayouts;
    } catch (error) {
      console.error('Error adjusting component positions:', error);
      return null;
    }
  },
});
