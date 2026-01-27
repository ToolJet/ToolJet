import { NO_OF_GRIDS, HIDDEN_COMPONENT_HEIGHT } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import { debounce } from 'lodash';
import { isProperNumber } from '../utils';
import { isTruthyOrZero } from '@/_helpers/appUtils';
import { RIGHT_SIDE_BAR_TAB } from '@/AppBuilder/RightSideBar/rightSidebarConstants';

const initialState = {
  hoveredComponentForGrid: '',
  hoveredComponentBoundaryId: '',
  triggerCanvasUpdater: 0,
  lastCanvasIdClick: '',
  lastCanvasClickPosition: null,
  temporaryLayouts: {},
  draggingComponentId: null,
  resizingComponentId: null,
  isGroupDragging: false,
  isGroupResizing: false,
  reorderContainerChildren: {
    containerId: null,
    triggerUpdate: 0,
  },
};

export const createGridSlice = (set, get) => ({
  ...initialState,
  setHoveredComponentForGrid: (id) =>
    set(() => ({ hoveredComponentForGrid: id }), false, { type: 'setHoveredComponentForGrid', id }),
  getHoveredComponentForGrid: () => get().hoveredComponentForGrid,
  checkHoveredComponentDynamicHeight: (id) => {
    const { getResolvedComponent } = get();
    const resolvedProperties = getResolvedComponent(id)?.properties;
    const { dynamicHeight } = resolvedProperties || {};
    return dynamicHeight;
  },
  setHoveredComponentBoundaryId: (id) =>
    set(() => ({ hoveredComponentBoundaryId: id }), false, { type: 'setHoveredComponentBoundaryId', id }),
  incrementCanvasUpdater: () =>
    set((state) => ({ triggerCanvasUpdater: state.triggerCanvasUpdater + 1 }), false, {
      type: 'incrementCanvasUpdater',
    }),
  debouncedIncrementCanvasUpdater: debounce(() => {
    get().incrementCanvasUpdater();
  }, 200),
  setDraggingComponentId: (id) => set(() => ({ draggingComponentId: id })),
  setResizingComponentId: (id) => set(() => ({ resizingComponentId: id })),
  setIsGroupDragging: (isGroupDragging) => set(() => ({ isGroupDragging: isGroupDragging })),
  setIsGroupResizing: (isGroupResizing) => set(() => ({ isGroupResizing: isGroupResizing })),
  moveComponentPosition: (direction) => {
    const { setComponentLayout, currentLayout, getSelectedComponentsDefinition, debouncedIncrementCanvasUpdater } =
      get();
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
    debouncedIncrementCanvasUpdater();
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
    const height = currentPageComponents?.[containerId].layouts[currentLayout].height;
    const element = document.querySelector(`.ele-${containerId}`);
    if (element) {
      element.style.height = `${height}px`;
    }
  },

  adjustComponentPositions: (componentId, currentLayout = 'desktop', isContainer = false, subContainerIndex = null) => {
    const {
      getResolvedValue,
      getCurrentPageComponents,
      setTemporaryLayouts,
      incrementCanvasUpdater,
      temporaryLayouts,
      adjustComponentPositions,
      getResolvedComponent,
      getComponentTypeFromId,
      getComponentDefinition,
      getExposedValueOfComponent,
    } = get();

    try {
      // Getting all the components on the current page
      const currentPageComponents = getCurrentPageComponents();

      // This is done in order to modify the component id if the sub container index exists
      const doesSubContainerIndexExist = isTruthyOrZero(subContainerIndex);

      // If the component parent is a subcontainer, we need to transform the component id and use this id when we are dealing with temporary layouts everywhere
      let transformedComponentId = doesSubContainerIndexExist ? `${componentId}-${subContainerIndex}` : componentId;

      // If the component is a container, we need to calculate the height of the container
      let containerHeight = currentPageComponents?.[componentId]?.layouts[currentLayout]?.height;
      const componentType = getComponentTypeFromId(componentId);

      // If the component is a modal, change id further to include the body
      if (componentType === 'ModalV2') {
        transformedComponentId = `${transformedComponentId}-body`;
      }

      // Determine component visibility by checking multiple sources in priority order
      const component = getResolvedComponent(componentId, isContainer ? null : subContainerIndex);
      const displayProperty = currentLayout === 'mobile' ? 'showOnMobile' : 'showOnDesktop';
      const componentDisplay = component?.others?.[displayProperty];

      if (componentType === 'Listview' && doesSubContainerIndexExist) {
        const rowHeight = component?.properties.rowHeight;
        containerHeight = rowHeight;
      }

      // Priority: exposed visibility > component properties > component styles
      const componentExposedVisibility = getExposedValueOfComponent(componentId)?.isVisible;
      let visibility = componentExposedVisibility ?? component?.properties?.visibility ?? component?.styles?.visibility;

      // Override visibility if component is set to not display on current layout
      if (componentDisplay === false) {
        visibility = false;
      }

      // If the component is a container, we go to each and every child component and calculate the height of the container
      if (isContainer && (componentType !== 'Listview' || doesSubContainerIndexExist)) {
        let contentHeight = 0;
        const element = document.querySelector(`.dynamic-${componentId}`);
        // If the component is not a dynamic component, we use the height of the component from the layouts
        if (!element) {
          contentHeight = visibility
            ? currentPageComponents?.[componentId]?.layouts[currentLayout]?.height
            : HIDDEN_COMPONENT_HEIGHT;
        } else {
          // If component is not visible, we set the height to HIDDEN_COMPONENT_HEIGHT (10px)
          if (!visibility) {
            contentHeight = HIDDEN_COMPONENT_HEIGHT;
          } else {
            // If the component is a tabs, we need to get the active tab
            let modifiedComponentId = componentId;
            if (componentType === 'Tabs') {
              const activeTab = element?.getAttribute('activetab');
              modifiedComponentId = `${componentId}-${activeTab}`;
            }

            // The normal component layouts
            const componentLayouts = get()
              .getContainerChildrenMapping(modifiedComponentId)
              .reduce((acc, id) => {
                const component = currentPageComponents[id];
                if (!component) return acc;
                return {
                  ...acc,
                  [id]: component.layouts[currentLayout],
                };
              }, {});

            // Dynamic height layouts
            const filteredTemporaryLayouts = Object.keys(componentLayouts).reduce((acc, id) => {
              const transformedId = doesSubContainerIndexExist ? `${id}-${subContainerIndex}` : id;
              return {
                ...acc,
                ...(temporaryLayouts[transformedId] && { [transformedId]: temporaryLayouts[transformedId] }),
              };
            }, {});

            const mergedLayouts = { ...componentLayouts, ...filteredTemporaryLayouts };

            // Calculate the height of the container
            let currentMax = Object.values(mergedLayouts).reduce((max, layout) => {
              if (!layout) {
                return max;
              }
              const sum = layout.top + layout.height;
              return Math.max(max, sum);
            }, 0);

            let extraHeight = 0;

            // If the component is a container, we need to get the header height
            if (componentType === 'Container') {
              const { properties = {} } = getResolvedComponent(modifiedComponentId) || {};
              const { showHeader, headerHeight } = properties;
              if (showHeader && isProperNumber(headerHeight)) {
                extraHeight += headerHeight - HIDDEN_COMPONENT_HEIGHT;
              }

              // If the component is a form, we need to get the header and footer height
            } else if (componentType === 'Form') {
              const { properties = {}, styles = {} } = getResolvedComponent(modifiedComponentId) || {};
              const { component } = getComponentDefinition(modifiedComponentId);
              const generateFormFrom = component?.definition?.properties?.generateFormFrom?.value;
              const resolvedGenerateFormFrom = getResolvedValue(generateFormFrom);
              const { showHeader, showFooter, headerHeight, footerHeight } = properties;
              if (resolvedGenerateFormFrom === 'jsonSchema') {
                //Inside element go inside fieldset and then find the last element and get the height
                const lastElement = element.querySelector('fieldset:last-child');
                if (lastElement) {
                  currentMax = lastElement.offsetHeight;
                }
              } else {
                if (showHeader && isProperNumber(headerHeight)) {
                  extraHeight += headerHeight;
                }
                if (showFooter && isProperNumber(footerHeight)) {
                  extraHeight += footerHeight;
                }
                extraHeight += 20;
              }

              // If the component is a tabs, we add 20px for the bottom
            } else if (componentType === 'Tabs') {
              extraHeight = 40;
            } else if (componentType === 'Listview' && isTruthyOrZero(subContainerIndex)) {
              extraHeight -= 40;
            }
            contentHeight = currentMax + 50 + extraHeight;
          }
        }
        if (visibility) {
          containerHeight = Math.max(contentHeight, containerHeight);
        } else {
          containerHeight = HIDDEN_COMPONENT_HEIGHT;
        }
      }

      // Get all the component layouts
      const boxList = Object.keys(currentPageComponents).map((key) => {
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
      });

      // If the component is not found in the box list, we return
      const changedComponent = boxList.find((box) => box.id === componentId);
      if (!changedComponent) return;

      const componentElement =
        doesSubContainerIndexExist && componentType !== 'Listview'
          ? document.querySelector(`.ele-${componentId}[subcontainer-id="${subContainerIndex}"]`)
          : document.querySelector(`.ele-${componentId}`);

      if (!componentElement) return;

      // Get the actual new height from the DOM
      // If the component is a container, we use the container height calculated above
      // If the component is not a container, we use the offset height of the component
      const newHeight =
        isContainer && (componentType !== 'Listview' || isTruthyOrZero(subContainerIndex))
          ? containerHeight
          : visibility
            ? componentElement.offsetHeight
            : HIDDEN_COMPONENT_HEIGHT;

      // Get the old height of the component either from the temporary layout if exists (moved previously) or from the layouts
      const oldHeight = temporaryLayouts?.[componentId]?.height ?? changedComponent.layouts[currentLayout].height;
      const dynamicHeightDifference = newHeight - oldHeight;

      // If the dynamic height difference is 0 and the component is not a container, we return
      if (dynamicHeightDifference === 0 && !isContainer) return;

      // Update the changed component's height in layouts
      const updatedLayouts = {
        [transformedComponentId]: {
          ...changedComponent.layouts[currentLayout],
          ...temporaryLayouts?.[transformedComponentId],
          height: newHeight,
        },
      };

      // Calculate the new top, bottom, left, right of the changed component
      // Left and Width are always the same as normal component layouts
      const changedCompLeft = changedComponent.layouts[currentLayout].left;
      const changedCompWidth = changedComponent.layouts[currentLayout].width;
      const changedCompRight = changedCompLeft + changedCompWidth;
      const changedCompTop =
        temporaryLayouts?.[transformedComponentId]?.top ?? changedComponent.layouts[currentLayout].top;
      const changedCompBottom = changedCompTop + newHeight;
      const oldChangedCompTop =
        temporaryLayouts?.[transformedComponentId]?.top ?? changedComponent.layouts[currentLayout].top;
      const oldChangedCompHeight =
        temporaryLayouts?.[transformedComponentId]?.height ?? changedComponent.layouts[currentLayout].height;
      const oldChangedCompBottom = oldChangedCompTop + oldChangedCompHeight;

      //Fetch all the components that are below the changed component
      const componentsToAdjust = boxList.filter((box) => {
        if (box.id === componentId) return false;

        // Only checking components below that have the same parent
        const sameParent = box.component?.parent === changedComponent.component?.parent;

        // Checking if changed component initial bottom is below the initial box top
        const boxTop = temporaryLayouts?.[box.id]?.top ?? box.layouts[currentLayout].top;
        const isBelow = oldChangedCompBottom <= boxTop;
        return sameParent && isBelow;
      });

      const isHorizontallyOverlapping = (element1Left, element1Right, element2Left, element2Right) => {
        return (
          (element1Left <= element2Left && element1Right >= element2Right) || // Completely contains
          (element1Left >= element2Left && element1Right <= element2Right) || // Completely contained
          (element1Left < element2Left && element1Right > element2Left) || // Left edge of dynamic height component overlaps
          (element1Left < element2Right && element1Right > element2Right) // Right edge of dynamic height component overlaps
        );
      };

      let currentLeft = changedCompLeft;
      let currentRight = changedCompRight;
      let currentBottom = changedCompBottom;

      const componentsToAdjustSorted = componentsToAdjust.sort((a, b) => {
        const transformedAId = doesSubContainerIndexExist ? `${a.id}-${subContainerIndex}` : a.id;
        const transformedBId = subContainerIndex !== null ? `${b.id}-${subContainerIndex}` : b.id;
        return (
          (temporaryLayouts?.[transformedAId]?.top ?? a.layouts[currentLayout].top) -
          (temporaryLayouts?.[transformedBId]?.top ?? b.layouts[currentLayout].top)
        );
      });

      const targetComponents = componentsToAdjustSorted.filter((component) => {
        const compLeft = component.layouts[currentLayout].left;
        const compWidth = component.layouts[currentLayout].width;
        const compRight = compLeft + compWidth;
        const hasHorizontalOverlap = isHorizontallyOverlapping(compLeft, compRight, currentLeft, currentRight);
        if (hasHorizontalOverlap) {
          if (compLeft < currentLeft) {
            currentLeft = compLeft;
          }
          if (compRight > currentRight) {
            currentRight = compRight;
          }
        }
        return hasHorizontalOverlap;
      });

      for (let index = 0; index < targetComponents.length; index++) {
        const component = targetComponents[index];
        const element = document.querySelector(`.ele-${component.id}`);
        if (!element) continue;
        const transformedTargetComponentId = doesSubContainerIndexExist
          ? `${component.id}-${subContainerIndex}`
          : component.id;

        const verticalGap =
          (temporaryLayouts?.[transformedTargetComponentId]?.top ?? component.layouts[currentLayout].top) -
          oldChangedCompBottom;
        const newTop = changedCompBottom + verticalGap;

        updatedLayouts[transformedTargetComponentId] = {
          ...component.layouts[currentLayout],
          ...temporaryLayouts?.[transformedTargetComponentId],
          top: newTop,
        };
        const newBottom =
          newTop +
          (temporaryLayouts?.[transformedTargetComponentId]?.height ?? component.layouts[currentLayout].height);
        if (newBottom > currentBottom) {
          currentBottom = newBottom;
        }
      }

      if (isContainer) {
        if (componentType !== 'Listview' && componentType !== 'ModalV2') {
          const element = document.querySelector(`.ele-${componentId}`);
          element.style.height = `${newHeight}px`;
        }
      }

      setTemporaryLayouts(updatedLayouts);

      incrementCanvasUpdater();
      if (changedComponent.component?.parent || (componentType === 'Listview' && doesSubContainerIndexExist)) {
        adjustComponentPositions(
          isContainer && isTruthyOrZero(subContainerIndex)
            ? componentId
            : changedComponent.component?.parent?.slice(0, 36),
          currentLayout,
          true,
          componentType === 'Listview' ? null : subContainerIndex
        );
      }
      return updatedLayouts;
    } catch (error) {
      console.error('Error adjusting component positions:', error);
      return null;
    }
  },

  setReorderContainerChildren: (containerId) => {
    // Function to trigger reordering of specific container for tab navigation
    set((state) => ({
      reorderContainerChildren: { containerId, triggerUpdate: state.reorderContainerChildren.triggerUpdate + 1 },
    }));
  },
  handleCanvasContainerMouseUp: (e) => {
    const {
      clearSelectedComponents,
      setActiveRightSideBarTab,
      isRightSidebarOpen,
      isGroupResizing,
      isGroupDragging,
      activeRightSideBarTab,
    } = get();
    const selectedText = window.getSelection().toString();
    const isClickedOnSubcontainer =
      e.target.getAttribute('component-id') !== null && e.target.getAttribute('component-id') !== 'canvas';

    // Check if any inspector popover is currently open
    const isInspectorPopoverOpen = () => {
      const selector = [
        '#codehinter-preview-box-popover',
        '.inspector-select-options-popover',
        '.inspector-event-manager-popover',
        '.inspector-steps-options-popover',
        '.table-column-popover',
        '.table-action-popover',
        '.codebuilder-color-swatches-popover',
        '.boxshadow-picker-popover',
        '.color-picker-popover',
        '.dropdown-menu-container',
        '.inspector-select.react-select__menu-list',
        '.icon-widget-popover',
        '.inspector-header-actions-menu',
      ].join(',');
      return !!document.querySelector(selector);
    };
    if (
      !isClickedOnSubcontainer &&
      ['rm-container', 'real-canvas', 'modal'].includes(e.target.id) &&
      !selectedText &&
      !isInspectorPopoverOpen() &&
      !isGroupResizing &&
      !isGroupDragging
    ) {
      clearSelectedComponents();
      if (isRightSidebarOpen) {
        activeRightSideBarTab === RIGHT_SIDE_BAR_TAB.PAGES
          ? setActiveRightSideBarTab(RIGHT_SIDE_BAR_TAB.PAGES)
          : setActiveRightSideBarTab(RIGHT_SIDE_BAR_TAB.COMPONENTS);
      }
    }
  },
});
