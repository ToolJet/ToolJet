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
  setTemporaryLayouts: (layouts) => set((state) => ({ temporaryLayouts: { ...state.temporaryLayouts, ...layouts } })),
  getTemporaryLayouts: () => get().temporaryLayouts,
  clearTemporaryLayouts: () => set(() => ({ temporaryLayouts: {} })),
  deleteTemporaryLayouts: (componentId) => {
    const { temporaryLayouts } = get();
    const newLayouts = { ...temporaryLayouts };
    delete newLayouts[componentId];
    set(() => ({ temporaryLayouts: newLayouts }));
  },
  deleteContainerTemporaryLayouts: (containerId) => {
    const { deleteTemporaryLayouts, getCurrentPageComponents, currentLayout = 'desktop' } = get();
    deleteTemporaryLayouts(containerId);
    const currentPageComponents = getCurrentPageComponents();
    const height = currentPageComponents[containerId].layouts[currentLayout].height;
    const element = document.querySelector(`.ele-${containerId}`);
    if (element) {
      element.style.height = `${height}px`;
    }
  },

  adjustComponentPositions: (componentId, currentLayout = 'desktop', shouldReset = false, isContainer = false) => {
    const {
      getResolvedValue,
      getCurrentPageComponents,
      setTemporaryLayouts,
      toggleCanvasUpdater,
      temporaryLayouts,
      deleteContainerTemporaryLayouts,
      adjustComponentPositions,
    } = get();

    try {
      const currentPageComponents = getCurrentPageComponents();
      let maxHeight = 0;
      console.log(currentPageComponents[componentId]);

      if (isContainer) {
        const componentLayouts = get()
          .getContainerChildrenMapping(componentId)
          .reduce((acc, id) => {
            const component = currentPageComponents[id];
            if (!component) return acc;
            return {
              ...acc,
              [id]: component.layouts[currentLayout],
            };
          }, {});

        const element = document.querySelector(`.dynamic-${componentId}`);
        if (!element) {
          deleteContainerTemporaryLayouts(componentId);
          return;
        }

        const filteredTemporaryLayouts = Object.keys(componentLayouts).reduce((acc, id) => {
          return {
            ...acc,
            ...(temporaryLayouts[id] && { [id]: temporaryLayouts[id] }),
          };
        }, {});

        const mergedLayouts = { ...componentLayouts, ...filteredTemporaryLayouts };

        const currentMax = Object.values(mergedLayouts).reduce((max, layout) => {
          if (!layout) {
            return max;
          }
          const sum = layout.top + layout.height;
          return Math.max(max, sum);
        }, 100);

        // const temporaryLayoutsMaxHeight = Object.values(temporaryLayouts).reduce((max, layout) => {
        //   const sum = layout.top + layout.height;
        //   return Math.max(max, sum);
        // }, 0);

        maxHeight = currentMax + 20;
      }

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
      const newHeight = shouldReset ? 0 : isContainer ? maxHeight : componentElement.offsetHeight;
      const oldHeight = temporaryLayouts?.[componentId]?.height ?? changedComponent.layouts[currentLayout].height;

      // Update the changed component's height in layouts
      const updatedLayouts = {
        [componentId]: {
          ...changedComponent.layouts[currentLayout],
          ...temporaryLayouts?.[componentId],
          height: newHeight,
        },
      };

      const changedCompLeft = changedComponent.layouts[currentLayout].left;
      const changedCompWidth = changedComponent.layouts[currentLayout].width;
      const changedCompRight = changedCompLeft + changedCompWidth;
      const changedCompTop = temporaryLayouts?.[componentId]?.top ?? changedComponent.layouts[currentLayout].top;
      const changedCompBottom = changedCompTop + newHeight;
      const dynamicHeightDifference = newHeight - oldHeight;

      const componentsToAdjust = boxList
        .filter((box) => {
          if (box.id === componentId) return false;
          const sameParent = box.component?.parent === changedComponent.component?.parent;
          const isBelow =
            (temporaryLayouts?.[box.id]?.top ?? box.layouts[currentLayout].top) + box.layouts[currentLayout].height >=
            changedCompTop;
          return sameParent && isBelow;
        })
        .sort(
          (a, b) =>
            (temporaryLayouts?.[a.id]?.top ?? a.layouts[currentLayout].top) -
            (temporaryLayouts?.[b.id]?.top ?? b.layouts[currentLayout].top)
        );

      let realDiff = 0;
      for (let component of componentsToAdjust) {
        const compLeft = component.layouts[currentLayout].left;
        const compWidth = component.layouts[currentLayout].width;
        const compRight = compLeft + compWidth;
        // const compBottom =
        //   (temporaryLayouts?.[component.id]?.top ?? component.layouts[currentLayout].top) +
        //   component.layouts[currentLayout].height;
        const hasHorizontalOverlap =
          (compLeft <= changedCompLeft && compRight >= changedCompRight) || // Completely contains
          (compLeft >= changedCompLeft && compRight <= changedCompRight) || // Completely contained
          (compLeft <= changedCompLeft && compRight >= changedCompLeft) || // Left edge overlaps
          (compLeft <= changedCompRight && compRight >= changedCompRight); // Right edge overlaps
        if (hasHorizontalOverlap) {
          const difference =
            changedCompBottom - (temporaryLayouts?.[component.id]?.top ?? component.layouts[currentLayout].top);
          realDiff = Math.ceil(difference / 10) * 10;
          break;
        }
      }

      let currentLeft = changedCompLeft;
      let currentRight = changedCompRight;
      let currentBottom = changedCompBottom;
      for (let component of componentsToAdjust) {
        const element = document.querySelector(`.ele-${component.id}`);
        if (!element) continue;
        const compLeft = component.layouts[currentLayout].left;
        const compWidth = component.layouts[currentLayout].width;
        const compRight = compLeft + compWidth;
        // const compTop = temporaryLayouts?.[component.id]?.top ?? component.layouts[currentLayout].top;

        const hasHorizontalOverlap =
          (compLeft <= currentLeft && compRight >= currentRight) || // Completely contains
          (compLeft >= currentLeft && compRight <= currentRight) || // Completely contained
          (compLeft <= currentLeft && compRight >= currentLeft) || // Left edge overlaps
          (compLeft <= currentRight && compRight >= currentRight); // Right edge overlaps

        // const isUnderNewHeight = currentBottom >= compTop;
        if (hasHorizontalOverlap) {
          if (realDiff > 0) {
            const newTop = (temporaryLayouts?.[component.id]?.top ?? component.layouts[currentLayout].top) + realDiff;
            const currentTransform = window.getComputedStyle(element).transform;

            const matrix = new DOMMatrix(currentTransform);
            const currentX = matrix.m41;
            element.style.transform = `translate(${currentX}px, ${newTop}px)`;

            updatedLayouts[component.id] = {
              ...component.layouts[currentLayout],
              ...temporaryLayouts?.[component.id],
              top: newTop,
            };
            const newBottom =
              newTop + (temporaryLayouts?.[component.id]?.height ?? component.layouts[currentLayout].height);
            if (newBottom > currentBottom) {
              currentBottom = newBottom;
            }
            if (compLeft < currentLeft) {
              currentLeft = compLeft;
            }
            if (compRight > currentRight) {
              currentRight = compRight;
            }
          } else if (dynamicHeightDifference < 0 && realDiff < 0) {
            let newTop =
              (temporaryLayouts?.[component.id]?.top ?? component.layouts[currentLayout].top) + dynamicHeightDifference;
            if (component.layouts[currentLayout].top > newTop) {
              newTop = component.layouts[currentLayout].top;
            }
            const currentTransform = window.getComputedStyle(element).transform;
            const matrix = new DOMMatrix(currentTransform);
            const currentX = matrix.m41;
            element.style.transform = `translate(${currentX}px, ${newTop}px)`;

            updatedLayouts[component.id] = {
              ...component.layouts[currentLayout],
              ...temporaryLayouts?.[component.id],
              top: newTop,
            };

            const newBottom =
              newTop + (temporaryLayouts?.[component.id]?.height ?? component.layouts[currentLayout].height);
            if (newBottom < currentBottom) {
              currentBottom = newBottom;
            }
            if (compLeft < currentLeft) {
              currentLeft = compLeft;
            }
            if (compRight > currentRight) {
              currentRight = compRight;
            }
          }
        }
      }

      // componentsToAdjust.forEach((component) => {
      //   const element = document.querySelector(`.ele-${component.id}`);
      //   if (!element) return;

      //   const newTop =
      //     (temporaryLayouts?.[component.id]?.top ?? component.layouts[currentLayout].top) +
      //     Math.ceil(heightDifference / 10) * 10;

      //   const currentTransform = window.getComputedStyle(element).transform;
      //   const matrix = new DOMMatrix(currentTransform);
      //   const currentX = matrix.m41;
      //   element.style.transform = `translate(${currentX}px, ${newTop}px)`;

      //   updatedLayouts[component.id] = {
      //     ...component.layouts[currentLayout],
      //     top: newTop,
      //   };
      // });

      // // Filter components that need adjustment
      // const componentsToAdjust = boxList
      //   .filter((box) => {
      //     if (box.id === componentId) return false;

      //     const sameParent = box.component?.parent === changedComponent.component?.parent;
      //     const isBelow =
      //       (temporaryLayouts?.[box.id]?.top ?? box.layouts[currentLayout].top) >= changedCompTop + oldHeight;

      //     const boxLeft = temporaryLayouts?.[box.id]?.left ?? box.layouts[currentLayout].left;
      //     const boxRight = boxLeft + (temporaryLayouts?.[box.id]?.width ?? box.layouts[currentLayout].width);
      //     const hasHorizontalOverlap =
      //       (boxLeft >= changedCompLeft && boxLeft < changedCompRight) || // Left edge overlaps
      //       (boxRight > changedCompLeft && boxRight <= changedCompRight) || // Right edge overlaps
      //       (boxLeft <= changedCompLeft && boxRight >= changedCompRight); // Completely contains'

      //     return sameParent && isBelow && hasHorizontalOverlap;
      //   })
      //   .sort((a, b) => a.layouts[currentLayout].top - b.layouts[currentLayout].top);

      // // Update positions of affected components

      // componentsToAdjust.forEach((component) => {
      //   const element = document.querySelector(`.ele-${component.id}`);
      //   if (!element) return;

      //   const newTop =
      //     (temporaryLayouts?.[component.id]?.top ?? component.layouts[currentLayout].top) +
      //     Math.ceil(heightDifference / 10) * 10;

      //   const currentTransform = window.getComputedStyle(element).transform;
      //   const matrix = new DOMMatrix(currentTransform);
      //   const currentX = matrix.m41;
      //   element.style.transform = `translate(${currentX}px, ${newTop}px)`;

      //   updatedLayouts[component.id] = {
      //     ...component.layouts[currentLayout],
      //     top: newTop,
      //   };
      // });

      if (shouldReset) {
        setTemporaryLayouts(updatedLayouts);
      } else {
        if (isContainer) {
          const element = document.querySelector(`.ele-${componentId}`);
          element.style.height = `${newHeight}px`;
        }
        setTemporaryLayouts(updatedLayouts);
      }

      toggleCanvasUpdater();
      if (changedComponent.component?.parent) {
        console.log('Adjusting parent component positions', changedComponent.component?.parent);
        console.log('Updated layouts:', changedComponent.component?.parent?.slice(0, 36));
        adjustComponentPositions(changedComponent.component?.parent?.slice(0, 36), currentLayout, shouldReset, true);
      }
      return updatedLayouts;
    } catch (error) {
      console.error('Error adjusting component positions:', error);
      return null;
    }
  },
});
