import { v4 as uuidv4 } from 'uuid';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import { componentTypes } from '../WidgetManager';
import useStore from '@/AppBuilder/_stores/store';
import { toast } from 'react-hot-toast';
import _, { debounce } from 'lodash';
import { useGridStore } from '@/_stores/gridStore';
import { findHighestLevelofSelection } from './Grid/gridUtils';
import { CANVAS_WIDTHS, NO_OF_GRIDS, WIDGETS_WITH_DEFAULT_CHILDREN } from './appCanvasConstants';

export function snapToGrid(canvasWidth, x, y) {
  const gridX = canvasWidth / 43;

  const snappedX = Math.round(x / gridX) * gridX;
  const snappedY = Math.round(y / 10) * 10;
  return [snappedX, snappedY];
}

//TODO: componentTypes should be a key value pair and get the definition directly by passing the componentType
export const addNewWidgetToTheEditor = (componentType, eventMonitorObject, currentLayout, realCanvasRef, parentId) => {
  const canvasBoundingRect = realCanvasRef?.current?.getBoundingClientRect();
  const componentMeta = componentTypes.find((component) => component.component === componentType);
  const componentName = computeComponentName(componentType, useStore.getState().getCurrentPageComponents());

  const componentData = deepClone(componentMeta);
  const defaultWidth = componentData.defaultSize.width;
  const defaultHeight = componentData.defaultSize.height;

  const offsetFromTopOfWindow = canvasBoundingRect?.top;
  const offsetFromLeftOfWindow = canvasBoundingRect?.left;
  const currentOffset = eventMonitorObject?.getSourceClientOffset();
  const subContainerWidth = canvasBoundingRect?.width;

  let left = Math.round(currentOffset?.x - offsetFromLeftOfWindow);
  let top = Math.round(currentOffset?.y - offsetFromTopOfWindow);

  [left, top] = snapToGrid(subContainerWidth, left, top);

  const gridWidth = subContainerWidth / NO_OF_GRIDS;
  left = Math.round(left / gridWidth);

  if (currentLayout === 'mobile') {
    componentData.definition.others.showOnDesktop.value = `{{false}}`;
    componentData.definition.others.showOnMobile.value = `{{true}}`;
  }

  const nonActiveLayout = currentLayout === 'desktop' ? 'mobile' : 'desktop';
  const newComponent = {
    id: uuidv4(),
    name: componentName,
    component: {
      ...componentData,
      parent: parentId === 'canvas' ? null : parentId,
    },
    layouts: {
      [currentLayout]: {
        top: top,
        left: left,
        width: defaultWidth,
        height: defaultHeight,
      },
      [nonActiveLayout]: {
        top: top,
        left: left,
        width: defaultWidth,
        height: defaultHeight,
      },
    },
    withDefaultChildren: WIDGETS_WITH_DEFAULT_CHILDREN.includes(componentData.component),
  };

  return newComponent;
};

export function addChildrenWidgetsToParent(componentType, parentId, currentLayout) {
  // Logic to add default child components
  const componentMeta = componentTypes.find((component) => component.component === componentType);
  const childrenWidgets = [];

  if (componentMeta.defaultChildren) {
    const parentMeta = componentMeta;
    const widgetResolvables = Object.freeze({
      Listview: 'listItem',
    });
    const customResolverVariable = widgetResolvables[parentMeta?.component];
    const defaultChildren = deepClone(parentMeta)['defaultChildren'];

    defaultChildren.forEach((child) => {
      const { componentName, layout, incrementWidth, properties, accessorKey, tab, defaultValue, styles } = child;

      const componentMeta = deepClone(componentTypes.find((component) => component.component === componentName));
      const componentData = JSON.parse(JSON.stringify(componentMeta));
      const allComponents = {
        ...useStore.getState().getCurrentPageComponents(),
        ...Object.fromEntries(childrenWidgets.map((component) => [component.id, component])),
      };

      const widgetName = computeComponentName(componentName, allComponents);
      const width = layout.width ? layout.width : (componentMeta.defaultSize.width * 100) / NO_OF_GRIDS;
      const height = layout.height ? layout.height : componentMeta.defaultSize.height;
      const top = layout.top ? layout.top : 0;
      const left = layout.left ? layout.left : 0;
      const newComponentDefinition = {
        ...componentData.definition.properties,
      };

      if (_.isArray(properties) && properties.length > 0) {
        properties.forEach((prop) => {
          const accessor = customResolverVariable
            ? `{{${customResolverVariable}.${accessorKey}}}`
            : defaultValue[prop] || '';

          _.set(newComponentDefinition, prop, {
            value: accessor,
          });
        });
        _.set(componentData, 'definition.properties', newComponentDefinition);
      }

      if (_.isArray(styles) && styles.length > 0) {
        styles.forEach((prop) => {
          const accessor = customResolverVariable
            ? `{{${customResolverVariable}.${accessorKey}}}`
            : defaultValue[prop] || '';

          _.set(newComponentDefinition, prop, {
            value: accessor,
          });
        });
        _.set(componentData, 'definition.styles', newComponentDefinition);
      }

      if (currentLayout === 'mobile') {
        componentData.definition.others.showOnDesktop.value = `{{false}}`;
        componentData.definition.others.showOnMobile.value = `{{true}}`;
      }

      const nonActiveLayout = currentLayout === 'desktop' ? 'mobile' : 'desktop';
      const _parent = getParentComponentIdByType(child, parentMeta.component, parentId);

      const newChildComponent = {
        id: uuidv4(),
        name: widgetName,
        component: {
          ...componentData,
          parent: getParentComponentIdByType(child, parentMeta.component, parentId),
        },
        layouts: {
          [currentLayout]: {
            top,
            left,
            width: incrementWidth ? width * incrementWidth : width,
            height: height,
          },
          [nonActiveLayout]: {
            top,
            left,
            width: incrementWidth ? width * incrementWidth : width,
            height: height,
          },
        },
      };
      childrenWidgets.push(newChildComponent);
    });
  }
  return childrenWidgets;
}

export function computeComponentName(componentType, currentComponents) {
  const currentComponentsForKind = Object.values(currentComponents).filter(
    (component) => component.component.component === componentType
  );
  let found = false;
  const componentName = componentTypes.find((component) => component?.component === componentType)?.name;
  let currentNumber = currentComponentsForKind.length + 1;
  let _componentName = '';
  while (!found) {
    _componentName = `${componentName?.toLowerCase()}${currentNumber}`;
    if (
      Object.values(currentComponents).find((component) => component.component.name === _componentName) === undefined
    ) {
      found = true;
    }
    currentNumber = currentNumber + 1;
  }
  return _componentName;
}

export const getAllChildComponents = (allComponents, parentId) => {
  const childComponents = [];
  Object.keys(allComponents).forEach((componentId) => {
    const componentParentId = allComponents[componentId].component?.parent;

    const isParentTabORCalendar =
      allComponents[parentId]?.component?.component === 'Tabs' ||
      allComponents[parentId]?.component?.component === 'Calendar' ||
      allComponents[parentId]?.component?.component === 'Kanban' ||
      allComponents[parentId]?.component?.component === 'Container';

    if (componentParentId && isParentTabORCalendar) {
      let childComponent = deepClone(allComponents[componentId]);
      childComponent.id = componentId;
      const childTabId = componentParentId.split('-').at(-1);
      if (componentParentId === `${parentId}-${childTabId}`) {
        childComponent.isParentTabORCalendar = true;
        childComponents.push(childComponent);
        // Recursively find children of the current child component
        const childrenOfChild = getAllChildComponents(allComponents, componentId);
        childComponents.push(...childrenOfChild);
      }
    }

    if (componentParentId === parentId) {
      let childComponent = deepClone(allComponents[componentId]);
      childComponent.id = componentId;
      childComponents.push(childComponent);

      // Recursively find children of the current child component
      const childrenOfChild = getAllChildComponents(allComponents, componentId);
      childComponents.push(...childrenOfChild);
    }
  });

  return childComponents;
};

const getSelectedText = () => {
  let selectedText = '';
  if (window.getSelection) {
    selectedText = window.getSelection().toString();
  } else if (window.document.selection) {
    selectedText = document.selection.createRange().text;
  }
  return selectedText || null;
};

// TODO: Move this function to componentSlice
export const copyComponents = ({ isCut = false, isCloning = false }) => {
  const selectedComponents = useStore.getState().getSelectedComponentsDefinition();
  if (selectedComponents.length < 1) return getSelectedText();
  const allComponents = useStore.getState().getCurrentPageComponents();
  const currentPageId = useStore.getState().getCurrentPageId();
  // if parent is selected, then remove the parent from the selected components
  const filteredSelectedComponents = selectedComponents.filter((selectedComponent) => {
    const parentComponentId = isChildOfTabsOrCalendar(selectedComponent, allComponents)
      ? selectedComponent.component.parent.split('-').slice(0, -1).join('-')
      : selectedComponent?.component?.parent;

    if (parentComponentId) {
      // Check if the parent component is also selected
      const isParentSelected = selectedComponents.some((comp) => comp.id === parentComponentId);

      // If the parent is selected, filter out the child component
      if (isParentSelected) {
        return false;
      }
    }
    return true;
  });

  let newComponents = [],
    newComponentObj = {},
    addedComponentId = new Set();

  for (let selectedComponent of filteredSelectedComponents) {
    if (addedComponentId.has(selectedComponent.id)) continue;
    const events = useStore.getState().eventsSlice.getEventsByComponentsId(selectedComponent.id);
    const component = {
      component: allComponents[selectedComponent.id]?.component,
      layouts: allComponents[selectedComponent.id]?.layouts,
      parent: allComponents[selectedComponent.id]?.component?.parent,
      id: selectedComponent.id,
      events,
    };
    // Skip if this component has already been processed
    addedComponentId.add(selectedComponent.id);

    newComponents.push(component);
    const children = getAllChildComponents(allComponents, selectedComponent.id);

    if (children.length > 0) {
      newComponents.push(...children);
    }

    newComponentObj = {
      newComponents,
      isCut,
      isCloning,
      pageId: currentPageId,
    };
  }
  useStore.getState().setLastCanvasClickPosition(null);
  if (isCloning) {
    const parentId = allComponents[selectedComponents[0]?.id]?.parent ?? undefined;
    debouncedPasteComponents(parentId, newComponentObj);
    toast.success('Component cloned succesfully');
  } else if (isCut) {
    navigator.clipboard.writeText(JSON.stringify(newComponentObj));
    useStore.getState().deleteComponents(
      selectedComponents.map((component) => component.id),
      'canvas',
      { isCut }
    );
  } else {
    navigator.clipboard.writeText(JSON.stringify(newComponentObj));
    const successMessage =
      newComponentObj?.newComponents?.length > 1 ? 'Components copied successfully' : 'Component copied successfully';
    toast.success(successMessage);
  }
};

const isChildOfTabsOrCalendar = (component, allComponents = [], componentParentId = undefined) => {
  const parentId = componentParentId ?? component.component?.parent?.match(/([a-fA-F0-9-]{36})-(.+)/)?.[1];
  const parentComponent = allComponents?.[parentId];

  if (parentComponent) {
    return (
      parentComponent.component.component === 'Tabs' ||
      parentComponent.component.component === 'Calendar' ||
      parentComponent.component.component === 'Container'
    );
  }

  return false;
};

function calculateComponentPosition(component, existingComponents, layout, targetParentId) {
  const MAX_ITERATIONS = 1000;
  let safetyCounter = 0;

  const parentId = component.component?.parent ? component.component.parent : 'canvas';
  const gridWidth = useGridStore.getState().subContainerWidths[parentId];
  const lastCanvasClickPosition = useStore.getState().lastCanvasClickPosition;

  // Initialize position either from click or component layout
  let newLeft = component.layouts[layout].left;
  let newTop = component.layouts[layout].top;
  // console.log(
  //   { lastCanvasClickPosition, component, existingComponents, layout, targetParentId },
  //   'lastCanvasClickPosition'
  // );
  if (lastCanvasClickPosition && (!component.component?.parent || component.component?.parent === targetParentId)) {
    console.log(lastCanvasClickPosition, 'renderrrrrr');
    newLeft = Math.round(lastCanvasClickPosition.x / gridWidth);
    newTop = Math.round(lastCanvasClickPosition.y / 10) * 10;
  }
  // Ensure component stays within bounds
  if (newLeft + component.layouts[layout].width > NO_OF_GRIDS) {
    newLeft = NO_OF_GRIDS - component.layouts[layout].width;
  }
  newLeft = Math.max(0, newLeft);
  newTop = Math.max(0, newTop);

  // Sort components once for efficient overlap checking
  const sortedComponents = existingComponents.sort((a, b) => {
    return a.layouts[layout].top - b.layouts[layout].top;
  });

  let foundSpace = false;
  while (!foundSpace && safetyCounter < MAX_ITERATIONS) {
    foundSpace = true;
    safetyCounter++;

    const hasOverlap = sortedComponents.some((existing) => {
      // Skip distant components
      if (Math.abs(existing.layouts[layout].top - newTop) > 1000) {
        return false;
      }

      const existingTop = existing.layouts[layout].top;
      const existingBottom = existingTop + existing.layouts[layout].height;
      const existingLeft = existing.layouts[layout].left;
      const existingRight = existingLeft + existing.layouts[layout].width;
      const newBottom = newTop + component.layouts[layout].height;
      const newRight = newLeft + component.layouts[layout].width;

      return newTop < existingBottom && newBottom > existingTop && newLeft < existingRight && newRight > existingLeft;
    });

    if (hasOverlap) {
      foundSpace = false;
      newTop += 10;
    }
  }

  // Safety fallback
  if (safetyCounter >= MAX_ITERATIONS) {
    console.warn('Position calculation safety limit reached');
    newTop = 0;
    newLeft = 0;
  }

  return { newTop, newLeft };
}

// function calculateGroupPosition(components, existingComponents, layout, targetParentId) {
//   const parentId = targetParentId || 'canvas';
//   const gridWidth = useGridStore.getState().subContainerWidths[parentId];
//   const lastCanvasClickPosition = useStore.getState().lastCanvasClickPosition;
//   // Find the group bounds
//   const groupBounds = components.reduce(
//     (bounds, component) => {
//       const compLayout = component.layouts[layout];
//       return {
//         left: lastCanvasClickPosition
//           ? Math.round(lastCanvasClickPosition.x / gridWidth)
//           : Math.min(bounds.top, compLayout.top),
//         top: lastCanvasClickPosition
//           ? Math.round(lastCanvasClickPosition.y / 10) * 10
//           : Math.min(bounds.left, compLayout.left),
//         right: Math.max(bounds.right, compLayout.left + compLayout.width),
//         bottom: Math.max(bounds.bottom, compLayout.top + compLayout.height),
//       };
//     },
//     { top: Infinity, left: Infinity, right: -Infinity, bottom: -Infinity }
//   );

//   console.log(groupBounds, 'groupBounds');

//   // Calculate group dimensions
//   const groupWidth = groupBounds.right - groupBounds.left;
//   const groupHeight = groupBounds.bottom - groupBounds.top;

//   // Calculate relative positions within group
//   const relativePositions = components.map((component) => ({
//     id: component.id,
//     relativeTop: component.layouts[layout].top - groupBounds.top,
//     relativeLeft: component.layouts[layout].left - groupBounds.left,
//   }));

//   // const gridWidth = useGridStore.getState().subContainerWidths[parentId];
//   // const lastCanvasClickPosition = useStore.getState().lastCanvasClickPosition;

//   // Initialize new group position
//   let newLeft = groupBounds.left;
//   let newTop = groupBounds.top;

//   // Use click position for the entire group if available
//   // if (lastCanvasClickPosition) {
//   //   console.log(lastCanvasClickPosition, 'lastCanvasClickPosition');
//   //   const clickX = Math.round(lastCanvasClickPosition.x / gridWidth);
//   //   const clickY = Math.round(lastCanvasClickPosition.y / 10) * 10;

//   //   // Adjust the entire group position based on click
//   //   const offsetX = clickX - groupBounds.left;
//   //   const offsetY = clickY - groupBounds.top;

//   //   newLeft = offsetX;
//   //   newTop = offsetY;
//   // }

//   // Ensure group stays within bounds
//   if (newLeft + groupWidth > NO_OF_GRIDS) {
//     newLeft = NO_OF_GRIDS - groupWidth;
//   }
//   newLeft = Math.max(0, newLeft);
//   newTop = Math.max(0, newTop);

//   // Find first non-overlapping position
//   let foundSpace = false;
//   const MAX_ITERATIONS = 1000;
//   let safetyCounter = 0;

//   while (!foundSpace && safetyCounter < MAX_ITERATIONS) {
//     foundSpace = true;
//     safetyCounter++;

//     // Check for overlaps with existing components
//     const hasOverlap = existingComponents.some((existing) => {
//       // Skip components that are part of the group being moved
//       if (components.some((comp) => comp.id === existing.id)) {
//         return false;
//       }

//       const existingLayout = existing.layouts[layout];
//       return (
//         newTop < existingLayout.top + existingLayout.height &&
//         newTop + groupHeight > existingLayout.top &&
//         newLeft < existingLayout.left + existingLayout.width &&
//         newLeft + groupWidth > existingLayout.left
//       );
//     });

//     if (hasOverlap) {
//       foundSpace = false;
//       newTop += 10;
//     }
//   }

//   // Safety fallback
//   if (safetyCounter >= MAX_ITERATIONS) {
//     console.warn('Group position calculation safety limit reached');
//     newTop = 0;
//     newLeft = 0;
//   }

//   // Return new positions for all components while maintaining relative positions
//   return relativePositions.map((pos) => ({
//     id: pos.id,
//     top: newTop + pos.relativeTop,
//     left: newLeft + pos.relativeLeft,
//   }));
// }

function calculateGroupPosition(components, existingComponents, layout, targetParentId) {
  const parentId = targetParentId || 'canvas';
  const gridWidth = useGridStore.getState().subContainerWidths[parentId];
  const lastCanvasClickPosition = useStore.getState().lastCanvasClickPosition;
  // Find the top-left most component in the group to use as reference point
  const groupBounds = components.reduce(
    (bounds, component) => {
      const compLayout = component.layouts[layout];
      return {
        left: lastCanvasClickPosition
          ? Math.round(lastCanvasClickPosition.x / gridWidth)
          : Math.min(bounds.top, compLayout.top),
        top: lastCanvasClickPosition
          ? Math.round(lastCanvasClickPosition.y / 10) * 10
          : Math.min(bounds.left, compLayout.left),
      };
    },
    { top: Infinity, left: Infinity }
  );

  console.log(groupBounds, 'groupBounds');

  // Calculate relative positions within group to maintain spacing
  const relativePositions = components.map((component) => ({
    id: component.id,
    relativeTop: component.layouts[layout].top - groupBounds.top,
    relativeLeft: component.layouts[layout].left - groupBounds.left,
  }));

  // Create a reference component representing the group's bounds
  const referenceComponent = {
    layouts: {
      [layout]: {
        top: groupBounds.top,
        left: groupBounds.left,
        width: Math.max(...components.map((c) => c.layouts[layout].left + c.layouts[layout].width)) - groupBounds.left,
        height: Math.max(...components.map((c) => c.layouts[layout].top + c.layouts[layout].height)) - groupBounds.top,
      },
    },
  };
  console.log(referenceComponent, 'referenceComponent');
  // Find position for the entire group
  const { newTop, newLeft } = calculateComponentPosition(
    referenceComponent,
    existingComponents,
    layout,
    targetParentId
  );
  console.log(newTop, newLeft, 'newTop, newLeft');
  // Return new positions for all components while maintaining relative positions
  return relativePositions.map((pos) => ({
    id: pos.id,
    top: newTop + pos.relativeTop,
    left: newLeft + pos.relativeLeft,
  }));
}

export const debouncedPasteComponents = debounce(pasteComponents, 300);

export function pasteComponents(targetParentId, copiedComponentObj) {
  const finalComponents = [];
  const componentMap = {};
  let parentComponent = undefined;
  const components = useStore.getState().getCurrentPageComponents();
  const currentPageId = useStore.getState().getCurrentPageId();
  const { isCut = false, pageId, isCloning = false, newComponents: pastedComponents = [] } = copiedComponentObj;
  const isGroup = findHighestLevelofSelection(pastedComponents).length > 1;

  // Prevent pasting if the parent subcontainer was deleted during a cut operation
  if (
    targetParentId &&
    !Object.keys(components).find(
      (key) =>
        targetParentId === key ||
        (components?.[key]?.component.component === 'Tabs' &&
          targetParentId?.split('-')?.slice(0, -1)?.join('-') === key)
    )
  ) {
    return;
  }
  if (targetParentId) {
    const id = Object.keys(components).filter((key) => targetParentId.startsWith(key));
    parentComponent = components[id];
  }
  pastedComponents.forEach((component) => {
    const newComponentId = isCut ? component.id : uuidv4();
    const componentName = computeComponentName(component.component.component, {
      ...components,
      ...Object.fromEntries(finalComponents.map((component) => [component.id, component])),
    });
    const parentRef = component.isParentTabORCalendar
      ? component.component.parent.split('-').slice(0, -1).join('-')
      : component.component.parent;
    const isParentAlsoCopied = parentRef && componentMap[parentRef];

    componentMap[component.id] = newComponentId;
    let isChild = isParentAlsoCopied ? component.component.parent : targetParentId;

    const componentMeta = componentTypes.find((comp) => comp.component === component?.component?.component);
    const componentData = _.merge({}, componentMeta, component.component);
    if (targetParentId && !componentData.parent) {
      isChild = component.component.parent;
    }

    if (!parentComponent && !isParentAlsoCopied && !isCloning) {
      isChild = undefined;
      componentData.parent = null;
    }
    if (parentComponent && !component.isParentTabORCalendar) {
      componentData.parent = isParentAlsoCopied ?? targetParentId;
    } else if (isChild && component.isParentTabORCalendar) {
      const parentId = component.component.parent.split('-').slice(0, -1).join('-');
      const childTabId = component.component.parent.split('-').at(-1);
      componentData.parent = `${componentMap[parentId]}-${childTabId}`;
    } else if (isChild) {
      const isParentInMap = componentMap[isChild] !== null;
      componentData.parent = isParentInMap ? componentMap[isChild] : isChild;
    }

    const currentLayout = useStore.getState().currentLayout;

    componentData.definition.others.showOnDesktop.value = currentLayout === 'desktop' ? `{{true}}` : `{{false}}`;
    componentData.definition.others.showOnMobile.value = currentLayout === 'mobile' ? `{{true}}` : `{{false}}`;

    const newComponent = {
      component: {
        ...componentData,
        name: componentName,
      },
      layouts: component.layouts,
      id: newComponentId,
      name: componentName,
      events: component.events,
    };

    finalComponents.push(newComponent);
  });
  const canAddToParent = useStore.getState().canAddToParent;
  const filteredFinalComponents = finalComponents.filter((component) => {
    return canAddToParent(component?.component.parent, component?.component.component);
  });

  const filteredComponentsCount = filteredFinalComponents.length;

  if (currentPageId === pageId) {
    const components = useStore.getState().getCurrentPageComponents();
    const finalComponentWithUpdatedLayout = filteredFinalComponents.map((component) => {
      const layout = useStore.getState().currentLayout;
      let existingComponents = [];

      // Include all components for position calculation
      if (component.component.parent) {
        existingComponents = Object.values(components).filter((c) => c.component.parent === component.component.parent);
      } else {
        existingComponents = Object.values(components);
      }

      // Add already processed components to existingComponents
      const processedComponents = finalComponentWithUpdatedLayout || [];
      existingComponents = [...existingComponents, ...processedComponents];
      if (isGroup) {
        // Handle group positioning
        const groupPositions = calculateGroupPosition(
          filteredFinalComponents,
          existingComponents,
          layout,
          targetParentId
        );
        const position = groupPositions.find((pos) => pos.id === component.id);

        return {
          ...component,
          layouts: {
            ...component.layouts,
            [layout]: {
              ...component.layouts[layout],
              top: position.top,
              left: position.left,
            },
          },
        };
      } else {
        // Handle single component positioning
        const { newTop, newLeft } = calculateComponentPosition(component, existingComponents, layout, targetParentId);
        return {
          ...component,
          layouts: {
            ...component.layouts,
            [layout]: {
              ...component.layouts[layout],
              top: newTop,
              left: newLeft,
            },
          },
        };
      }
    });

    useStore.getState().pasteComponents(finalComponentWithUpdatedLayout);
  } else {
    useStore.getState().pasteComponents(filteredFinalComponents);
  }

  filteredComponentsCount > 0 &&
    !isCloning &&
    toast.success(`Component${filteredComponentsCount > 1 ? 's' : ''} pasted successfully`);
}

export const getCanvasWidth = (currentLayout) => {
  if (currentLayout === 'mobile') {
    return CANVAS_WIDTHS.deviceWindowWidth;
  }
  const windowWidth = window.innerWidth;
  const widthInPx = windowWidth - (CANVAS_WIDTHS.leftSideBarWidth + CANVAS_WIDTHS.rightSideBarWidth);
  const canvasMaxWidth = useStore.getState().globalSettings.canvasMaxWidth;
  const canvasMaxWidthType = useStore.getState().globalSettings.canvasMaxWidthType;

  if (canvasMaxWidthType === 'px') {
    return +canvasMaxWidth;
  }
  if (canvasMaxWidthType === '%') {
    return (widthInPx / 100) * +canvasMaxWidth;
  }
};

export const computeViewerBackgroundColor = (isAppDarkMode, canvasBgColor) => {
  if (['#2f3c4c', '#F2F2F5', '#edeff5'].includes(canvasBgColor)) {
    return isAppDarkMode ? '#2f3c4c' : '#F2F2F5';
  }
  return canvasBgColor;
};

export const getParentComponentIdByType = (child, parentComponent, parentId) => {
  const { tab } = child;

  if (parentComponent === 'Tabs') return `${parentId}-${tab}`;
  else if (parentComponent === 'Container') return `${parentId}-header`;
  return parentId;
};
