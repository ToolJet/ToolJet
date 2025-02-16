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
      // Getting all the components on the current page
      const currentPageComponents = getCurrentPageComponents();

      // If the component is a container, we need to calculate the height of the container
      let maxHeight = 0;

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

        // Calculate the maximum height of the container
        const currentMax = Object.values(mergedLayouts).reduce((max, layout) => {
          if (!layout) {
            return max;
          }
          const sum = layout.top + layout.height;
          return Math.max(max, sum);
        }, 100);

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
      const dynamicHeightDifference = newHeight - oldHeight;

      if (dynamicHeightDifference === 0) return;

      // Update the changed component's height in layouts
      const updatedLayouts = {
        [componentId]: {
          ...changedComponent.layouts[currentLayout],
          ...temporaryLayouts?.[componentId],
          height: newHeight,
        },
      };

      // Calculate the new top, bottom, left, right of the changed component
      const changedCompLeft = changedComponent.layouts[currentLayout].left;
      const changedCompWidth = changedComponent.layouts[currentLayout].width;
      const changedCompRight = changedCompLeft + changedCompWidth;
      const changedCompTop = temporaryLayouts?.[componentId]?.top ?? changedComponent.layouts[currentLayout].top;
      const changedCompBottom = changedCompTop + newHeight;

      //Fetch all the components that are below the changed component
      const componentsToAdjust = boxList.filter((box) => {
        if (box.id === componentId) return false;
        const sameParent = box.component?.parent === changedComponent.component?.parent;
        const isBelow =
          (temporaryLayouts?.[box.id]?.top ?? box.layouts[currentLayout].top) + box.layouts[currentLayout].height >=
          changedCompTop;
        return sameParent && isBelow;
      });

      let realDiff = 0;
      let minimumDist = Infinity;

      const isHorizontallyOverlapping = (element1Left, element1Right, element2Left, element2Right) => {
        return (
          (element1Left <= element2Left && element1Right >= element2Right) || // Completely contains
          (element1Left >= element2Left && element1Right <= element2Right) || // Completely contained
          (element1Left <= element2Left && element1Right >= element2Left) || // Left edge overlaps
          (element1Left <= element2Right && element1Right >= element2Right) // Right edge overlaps
        );
      };

      //Find the distance by which to move the components up or down
      for (let component of componentsToAdjust) {
        const compLeft = component.layouts[currentLayout].left;
        const compWidth = component.layouts[currentLayout].width;
        const compRight = compLeft + compWidth;
        const hasHorizontalOverlap = isHorizontallyOverlapping(compLeft, compRight, changedCompLeft, changedCompRight);
        const currentDist =
          (temporaryLayouts?.[component.id]?.top ?? component.layouts[currentLayout].top) - changedCompTop;

        const isInitialTopAboveChangedBottom =
          component.layouts[currentLayout].top <
          changedComponent.layouts[currentLayout].top + changedComponent.layouts[currentLayout].height;

        if (hasHorizontalOverlap && currentDist < minimumDist && !isInitialTopAboveChangedBottom) {
          const difference =
            changedCompBottom - (temporaryLayouts?.[component.id]?.top ?? component.layouts[currentLayout].top);
          realDiff = Math.ceil(difference / 10) * 10;
          minimumDist = currentDist;
        }
      }

      let currentLeft = changedCompLeft;
      let currentRight = changedCompRight;
      let currentBottom = changedCompBottom;

      if (realDiff > 0) {
        const componentsToAdjustSorted = componentsToAdjust.sort(
          (a, b) =>
            (temporaryLayouts?.[a.id]?.top ?? a.layouts[currentLayout].top) -
            (temporaryLayouts?.[b.id]?.top ?? b.layouts[currentLayout].top)
        );

        for (let component of componentsToAdjustSorted) {
          const element = document.querySelector(`.ele-${component.id}`);
          if (!element) continue;
          const compLeft = component.layouts[currentLayout].left;
          const compWidth = component.layouts[currentLayout].width;
          const compRight = compLeft + compWidth;
          const hasHorizontalOverlap = isHorizontallyOverlapping(compLeft, compRight, currentLeft, currentRight);
          if (hasHorizontalOverlap) {
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
          }
        }
      } else if (dynamicHeightDifference < 0 && realDiff < 0) {
        const componentsToAdjustSorted = componentsToAdjust.sort((a, b) => {
          const aBottom =
            (temporaryLayouts?.[a.id]?.top ?? a.layouts[currentLayout].top) +
            (temporaryLayouts?.[a.id]?.height ?? a.layouts[currentLayout].height);
          const bBottom =
            (temporaryLayouts?.[b.id]?.top ?? b.layouts[currentLayout].top) +
            (temporaryLayouts?.[b.id]?.height ?? b.layouts[currentLayout].height);
          return aBottom - bBottom;
        });

        componentsToAdjustSorted.forEach((component, index) => {
          const element = document.querySelector(`.ele-${component.id}`);
          if (!element) return;
          const compLeft = component.layouts[currentLayout].left;
          const compWidth = component.layouts[currentLayout].width;
          const compRight = compLeft + compWidth;
          const hasHorizontalOverlap = isHorizontallyOverlapping(compLeft, compRight, currentLeft, currentRight);

          const componentInitialTop = component.layouts[currentLayout].top;
          const componentInitialBottom = componentInitialTop + component.layouts[currentLayout].height;

          if (hasHorizontalOverlap) {
            let newTop =
              (temporaryLayouts?.[component.id]?.top ?? component.layouts[currentLayout].top) + dynamicHeightDifference;

            //Situations to accomodate the case when there is a component above the current component
            if (index > 0) {
              let prevIndex = index - 1;
              while (prevIndex >= 0) {
                const currentComponentLeft = component.layouts[currentLayout].left;
                const currentComponentRight = currentComponentLeft + component.layouts[currentLayout].width;
                const prevComponent = componentsToAdjustSorted[prevIndex];
                const prevTop = temporaryLayouts?.[prevComponent.id]?.top ?? prevComponent.layouts[currentLayout].top;
                const prevBottom =
                  prevTop +
                  (temporaryLayouts?.[prevComponent.id]?.height ?? prevComponent.layouts[currentLayout].height);
                if (newTop >= prevBottom) {
                  break;
                } else {
                  const prevCompLeft = prevComponent.layouts[currentLayout].left;
                  const prevCompWidth = prevComponent.layouts[currentLayout].width;
                  const prevCompRight = prevCompLeft + prevCompWidth;
                  const prevCompInitialTop = prevComponent.layouts[currentLayout].top;
                  const prevCompInitialBottom = prevCompInitialTop + prevComponent.layouts[currentLayout].height;

                  const hasHorizontalOverlap = isHorizontallyOverlapping(
                    prevCompLeft,
                    prevCompRight,
                    currentComponentLeft,
                    currentComponentRight
                  );

                  const hasInitialVerticalOverlap =
                    (componentInitialTop < prevCompInitialBottom && componentInitialBottom > prevCompInitialTop) || //  Bottom of the current component is above the top of the previous component
                    (componentInitialTop > prevCompInitialTop && componentInitialBottom < prevCompInitialBottom) || // Current component is completely inside the previous component
                    (componentInitialTop < prevCompInitialTop && componentInitialBottom > prevCompInitialTop) || // Top of the current component is below the bottom of the previous component
                    (componentInitialTop < prevCompInitialBottom && componentInitialBottom > prevCompInitialBottom); // Bottom of the current component is below the bottom of the previous component

                  if (hasHorizontalOverlap && !hasInitialVerticalOverlap) {
                    newTop = prevBottom;
                    break;
                  }
                }
                prevIndex--;
              }
            }

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
        });
      }

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
        adjustComponentPositions(changedComponent.component?.parent?.slice(0, 36), currentLayout, shouldReset, true);
      }
      return updatedLayouts;
    } catch (error) {
      console.error('Error adjusting component positions:', error);
      return null;
    }
  },
});
