import { v4 as uuidv4 } from 'uuid';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import { componentTypes } from '../WidgetManager';
import useStore from '@/AppBuilder/_stores/store';
import { toast } from 'react-hot-toast';
import { CANVAS_WIDTHS, NO_OF_GRIDS, WIDGETS_WITH_DEFAULT_CHILDREN } from './appCanvasConstants';
import _ from 'lodash';

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
  if (isCloning) {
    const parentId = allComponents[selectedComponents[0]?.id]?.parent ?? undefined;
    pasteComponents(parentId, newComponentObj);
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

const updateComponentLayout = (components, parentId, isCut = false) => {
  let prevComponent;
  let _components = deepClone(components);
  _components.forEach((component, index) => {
    Object.keys(component.layouts).map((layout) => {
      if (
        (parentId !== undefined && !component?.component?.parent) ||
        (component?.component?.parent === parentId && !isCut)
      ) {
        if (index > 0) {
          component.layouts[layout].top = prevComponent.layouts[layout].top + prevComponent.layouts[layout].height;
          component.layouts[layout].left = 0;
        } else {
          component.layouts[layout].top = 0;
          component.layouts[layout].left = 0;
        }
        prevComponent = component;
      } else if (!isCut && !component.component.parent) {
        component.layouts[layout].top = component.layouts[layout].top + component.layouts[layout].height;
      }
    });
  });
  return _components;
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

export function pasteComponents(parentId, copiedComponentObj) {
  const finalComponents = [];
  const componentMap = {};
  let parentComponent = undefined;
  const components = useStore.getState().getCurrentPageComponents();
  const currentPageId = useStore.getState().getCurrentPageId();
  const { isCut = false, newComponents: pastedComponents = [], pageId, isCloning = false } = copiedComponentObj;
  // Prevent pasting if the parent subcontainer was deleted during a cut operation
  if (
    parentId &&
    !Object.keys(components).find(
      (key) =>
        parentId === key ||
        (components?.[key]?.component.component === 'Tabs' && parentId?.split('-')?.slice(0, -1)?.join('-') === key)
    )
  ) {
    return;
  }
  if (parentId) {
    const id = Object.keys(components).filter((key) => parentId.startsWith(key));
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
    let isChild = isParentAlsoCopied ? component.component.parent : parentId;

    const componentMeta = componentTypes.find((comp) => comp.component === component?.component?.component);
    const componentData = _.merge({}, componentMeta, component.component);
    if (parentId && !componentData.parent) {
      isChild = component.component.parent;
    }

    if (!parentComponent && !isParentAlsoCopied && !isCloning) {
      isChild = undefined;
      componentData.parent = null;
    }
    if (parentComponent && !component.isParentTabORCalendar) {
      componentData.parent = isParentAlsoCopied ?? parentId;
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
    const finalComponentWithUpdatedLayout = updateComponentLayout(filteredFinalComponents, parentId, isCut);
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
