import { v4 as uuidv4 } from 'uuid';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import { componentTypes } from '../WidgetManager';
import useStore from '@/AppBuilder/_stores/store';
import { toast } from 'react-hot-toast';
import _, { debounce } from 'lodash';
import { useGridStore } from '@/_stores/gridStore';
import { findHighestLevelofSelection } from './Grid/gridUtils';
import { NO_OF_GRIDS } from './appCanvasConstants';
import { computeComponentName, getAllChildComponents } from './appCanvasUtils';

const getSelectedText = () => {
  let selectedText = '';
  if (window.getSelection) {
    selectedText = window.getSelection().toString();
  } else if (window.document.selection) {
    selectedText = document.selection.createRange().text;
  }
  return selectedText || null;
};

/** After a successful cut-paste, same payload as cut but `isCut: false` so the next paste allocates new IDs (copy path). */
function markClipboardAsCopyAfterCutPaste(copiedComponentObj) {
  if (!navigator.clipboard?.writeText) return;
  const clip = {
    ...copiedComponentObj,
    isCut: false,
    isCloning: false,
    pageId: useStore.getState().getCurrentPageId(),
  };
  navigator.clipboard.writeText(JSON.stringify(clip)).catch(() => {});
}

// TODO: Move this function to componentSlice
export const copyComponents = ({ isCut = false, isCloning = false }) => {
  const selectedText = window.getSelection()?.toString().trim();
  if (selectedText) {
    navigator.clipboard.writeText(selectedText);
    return;
  }

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
    const parentId = allComponents[selectedComponents[0]?.id]?.component?.parent ?? undefined;
    debouncedPasteComponents(parentId, newComponentObj);
    toast.success('Component cloned successfully');
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
  const parentId = componentParentId ?? component.component?.parent?.split('-').slice(0, -1).join('-');
  const parentComponent = allComponents?.[parentId];
  if (parentComponent) {
    return (
      parentComponent.component.component === 'Tabs' ||
      parentComponent.component.component === 'Calendar' ||
      parentComponent.component.component === 'Container' ||
      parentComponent.component.component === 'Accordion' ||
      parentComponent.component.component === 'Form' ||
      parentComponent.component.component === 'ModalV2'
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

  if (lastCanvasClickPosition && (!component.component?.parent || component.component?.parent === targetParentId)) {
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

function calculateGroupPosition(components, existingComponents, layout, targetParentId) {
  // Filter top-level components
  const parentComponents = components.filter(
    (c) => !c.component?.parent || c.component?.component?.parent !== targetParentId
  );

  if (parentComponents.length === 0) {
    return components.map((component) => ({
      id: component.id,
      top: component.layouts[layout].top,
      left: component.layouts[layout].left,
    }));
  }
  // Calculate group dimensions
  const bounds = parentComponents.reduce(
    (bounds, component) => {
      const compLayout = component.layouts[layout];
      return {
        minTop: Math.min(bounds.minTop, compLayout.top),
        minLeft: Math.min(bounds.minLeft, compLayout.left),
        maxRight: Math.max(bounds.maxRight, compLayout.left + compLayout.width),
        maxBottom: Math.max(bounds.maxBottom, compLayout.top + compLayout.height),
      };
    },
    { minTop: Infinity, minLeft: Infinity, maxRight: -Infinity, maxBottom: -Infinity }
  );
  const groupDimensions = {
    width: bounds.maxRight - bounds.minLeft,
    height: bounds.maxBottom - bounds.minTop,
  };

  // Create a virtual component representing the entire group
  const virtualGroupComponent = {
    component: {
      parent: targetParentId,
    },
    layouts: {
      [layout]: {
        top: bounds.minTop,
        left: bounds.minLeft,
        width: groupDimensions.width,
        height: groupDimensions.height,
      },
    },
  };

  // Use calculateComponentPosition to find a suitable position for the group
  const { newTop, newLeft } = calculateComponentPosition(
    virtualGroupComponent,
    existingComponents,
    layout,
    targetParentId
  );

  // Calculate position deltas
  const deltaTop = newTop - bounds.minTop;
  const deltaLeft = newLeft - bounds.minLeft;

  // Return updated positions
  return components.map((component) => {
    const compLayout = component.layouts[layout];
    const isPasteTargetParent = component.component?.component?.parent === targetParentId;
    // Only update position for top-level components
    if (!component.component?.parent || !isPasteTargetParent) {
      return {
        id: component.id,
        top: compLayout.top + deltaTop,
        left: compLayout.left + deltaLeft,
      };
    }

    // Keep child components in their relative positions
    return {
      id: component.id,
      top: compLayout.top,
      left: compLayout.left,
    };
  });
}

export const debouncedPasteComponents = debounce(pasteComponents, 300);

export function resolvePastedComponentName({ isCut, isCloning, originalName, componentType, mergedComponents }) {
  if (isCut && !isCloning && typeof originalName === 'string' && originalName.length > 0) {
    const taken = Object.values(mergedComponents).some((c) => c.component.name === originalName);
    if (!taken) {
      return originalName;
    }
  }
  return computeComponentName(componentType, mergedComponents);
}

export async function pasteComponents(targetParentId, copiedComponentObj) {
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
    // Check if targetParentId is deleted from the components
    !Object.keys(components).find(
      (key) =>
        targetParentId === key ||
        (components?.[key]?.component.component === 'Tabs' &&
          targetParentId?.split('-')?.slice(0, -1)?.join('-') === key) ||
        (['Container', 'Form', 'ModalV2', 'Accordion'].includes(components?.[key]?.component.component) &&
          ['header', 'footer'].some((section) => targetParentId.includes(section)))
    )
  ) {
    return;
  }
  if (targetParentId) {
    const id = Object.keys(components).filter((key) => targetParentId.startsWith(key));
    parentComponent = components[id];
  }

  const componentIdMappingSet = new Map(),
    formComponentIds = new Set();

  pastedComponents.forEach((component) => {
    component = deepClone(component);
    const newComponentId = isCut ? component.id : uuidv4();
    if (!isCut) componentIdMappingSet.set(component.id, newComponentId);
    if (component.component.component === 'Form') formComponentIds.add(newComponentId);
    const mergedComponents = {
      ...components,
      ...Object.fromEntries(finalComponents.map((c) => [c.id, c])),
    };

    const componentName = resolvePastedComponentName({
      isCut,
      isCloning,
      originalName: component.component.name,
      componentType: component.component.component,
      mergedComponents,
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
    } else if (targetParentId === 'canvas-header' || targetParentId === 'canvas-footer') {
      componentData.parent = targetParentId;
    }

    const currentLayout = useStore.getState().currentLayout;

    componentData.definition.others.showOnDesktop.value = currentLayout === 'desktop' ? `{{true}}` : `{{false}}`;
    componentData.definition.others.showOnMobile.value = currentLayout === 'mobile' ? `{{true}}` : `{{false}}`;

    // Adjust width only when the widget's immediate layout parent actually changes to a different subcontainer.
    // Skip when the parent is part of the same paste: children stay in that parent's grid (same as copy source).
    // Also compare resolved parents, not targetParentId — children would wrongly use canvas width vs container.
    let width = component.layouts[currentLayout].width;

    const layoutParentBefore = component.component?.parent ?? null;
    const layoutParentAfter = componentData.parent ?? null;

    if (!isCloning && !isParentAlsoCopied && layoutParentBefore !== layoutParentAfter) {
      const newParentKey = layoutParentAfter ?? 'canvas';
      const oldParentKey = layoutParentBefore ?? 'canvas';
      const containerWidth = useGridStore.getState().subContainerWidths[newParentKey];
      const oldContainerWidth = useGridStore.getState().subContainerWidths[oldParentKey];
      if (containerWidth && oldContainerWidth) {
        width = Math.round((width * oldContainerWidth) / containerWidth);
      }
    }

    component.layouts[currentLayout] = {
      ...component.layouts[currentLayout],
      width,
    };

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
  const fc = finalComponents.filter((component) => {
    return canAddToParent(component?.component.parent, component?.component.component);
  });
  const filteredFinalComponents = fc.map((component) => {
    if (formComponentIds.has(component.id)) {
      const fields = component.component.definition?.properties?.fields?.value || [];
      fields.forEach((field) => {
        field.componentId = componentIdMappingSet.get(field.componentId) || field.componentId;
      });
    }
    return component;
  });

  const filteredComponentsCount = filteredFinalComponents.length;

  let pasteSucceeded = false;
  if (filteredComponentsCount < 0) return;

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

    pasteSucceeded = await useStore.getState().pasteComponents(finalComponentWithUpdatedLayout);
  } else {
    pasteSucceeded = await useStore.getState().pasteComponents(filteredFinalComponents);
  }

  if (pasteSucceeded && isCut && !isCloning) {
    markClipboardAsCopyAfterCutPaste(copiedComponentObj);
  }

  pasteSucceeded &&
    filteredComponentsCount > 0 &&
    !isCloning &&
    toast.success(`Component${filteredComponentsCount > 1 ? 's' : ''} pasted successfully`);
}
