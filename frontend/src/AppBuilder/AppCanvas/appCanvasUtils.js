import { v4 as uuidv4 } from 'uuid';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import { componentTypes } from '../WidgetManager';
import useStore from '@/AppBuilder/_stores/store';
import _ from 'lodash';
import { useGridStore } from '@/_stores/gridStore';
import { getMouseDistanceFromParentDiv } from './Grid/gridUtils';
import {
  CANVAS_WIDTHS,
  NO_OF_GRIDS,
  WIDGETS_WITH_DEFAULT_CHILDREN,
  CONTAINER_FORM_CANVAS_PADDING,
  SUBCONTAINER_CANVAS_BORDER_WIDTH,
  BOX_PADDING,
  TAB_CANVAS_PADDING,
  MODAL_CANVAS_PADDING,
  LISTVIEW_CANVAS_PADDING,
  HOVER_CLICK_OUTLINE_BORDER,
} from './appCanvasConstants';
import { createDefaultFlexChildLayout } from '@/AppBuilder/Widgets/FlexContainer/flexContainer.utils';

export function snapToGrid(canvasWidth, x, y) {
  const gridX = canvasWidth / 43;

  const snappedX = Math.round(x / gridX) * gridX;
  const snappedY = Math.round(y / 10) * 10;
  return [snappedX, snappedY];
}

//TODO: componentTypes should be a key value pair and get the definition directly by passing the componentType
export const addNewWidgetToTheEditor = (
  componentType,
  currentLayout,
  realCanvasRef,
  parentId,
  moduleInfo = undefined
) => {
  const canvasBoundingRect = realCanvasRef?.getBoundingClientRect();
  const componentMeta = componentTypes.find((component) => component.component === componentType);
  const componentName = computeComponentName(componentType, useStore.getState().getCurrentPageComponents());
  const parentCanvasType = realCanvasRef?.getAttribute('component-type');
  const componentData = deepClone(componentMeta);
  const defaultWidth = componentData.defaultSize.width;
  const defaultHeight = componentData.defaultSize.height;

  const { e, frozenTargetRect } = useGridStore.getState().getGhostDragPosition();
  const subContainerWidth = canvasBoundingRect?.width;

  const { left: _left, top: _top } = getMouseDistanceFromParentDiv(
    e,
    parentId === 'canvas' ? 'real-canvas' : parentId,
    parentCanvasType,
    frozenTargetRect
  );
  const scrollTop = realCanvasRef?.scrollTop;
  const subContainerWidths = useGridStore.getState().subContainerWidths;
  const targetCanvasId = parentId && parentId !== 'canvas' ? parentId : 'canvas';
  const fallbackGridWidth = subContainerWidth ? subContainerWidth / NO_OF_GRIDS : subContainerWidths.canvas || 1;
  const gridWidth = subContainerWidths[targetCanvasId] || fallbackGridWidth;
  let [left, top] = snapToGrid(gridWidth * NO_OF_GRIDS, _left, _top + scrollTop);

  left = Math.round(left / gridWidth);

  // Adjust widget width based on the dropping canvas width
  const mainCanvasGridWidth = subContainerWidths.canvas || gridWidth;
  let width = Math.round((defaultWidth * mainCanvasGridWidth) / gridWidth);

  let customLayouts = undefined;

  if (moduleInfo) {
    // Pin the dragged ModuleViewer to the module's current version's module_reference_id
    // (a stable cross-instance id from the modules list). Falls back to '' (unpinned) if
    // the module has no version yet. Users can opt into follow-latest semantics via the
    // inspector ("Current branch" option writes '' back to value).
    componentData.definition.properties.moduleAppId = { value: moduleInfo.moduleId };
    componentData.definition.properties.moduleVersionId = {
      value: moduleInfo.versionId ?? '',
      versionName: moduleInfo.versionName ?? '',
    };
    componentData.definition.properties.visibility = { value: true };
    customLayouts = moduleInfo?.moduleContainer?.layouts;

    const inputItems = Object.values(
      moduleInfo.moduleContainer?.component.definition.properties?.input_items?.value ?? {}
    );

    for (const { name, default_value } of inputItems) {
      componentData.definition.properties[name] = { value: default_value };
    }

    // Module editor's additional-action settings act as the instance defaults;
    // the instance properties stay editable in the app (override). API responses
    // snake_case definition keys (see input_items above), so check both forms.
    const moduleContainerProperties = moduleInfo.moduleContainer?.component.definition.properties;
    const copyModuleDefault = (snakeKey, camelKey) => {
      const defaultValue = moduleContainerProperties?.[snakeKey]?.value ?? moduleContainerProperties?.[camelKey]?.value;
      if (defaultValue !== undefined) {
        componentData.definition.properties[camelKey] = { value: defaultValue };
      }
    };
    copyModuleDefault('dynamic_height', 'dynamicHeight');
    copyModuleDefault('collapse_when_hidden', 'collapseWhenHidden');
  }

  // Ensure minimum width
  width = Math.max(width, 1);

  // Adjust position and width if exceeding grid bounds
  if (width + left > NO_OF_GRIDS) {
    left = Math.max(0, NO_OF_GRIDS - width);
    width = Math.min(width, NO_OF_GRIDS);
  }

  if (currentLayout === 'mobile') {
    componentData.definition.others.showOnDesktop.value = `{{false}}`;
    componentData.definition.others.showOnMobile.value = `{{true}}`;
  }

  const nonActiveLayout = currentLayout === 'desktop' ? 'mobile' : 'desktop';

  // When dropping into a FlexContainer, use flex layout fields instead of grid fields
  const parentComponentType =
    parentId && parentId !== 'canvas' ? useStore.getState().getComponentTypeFromId(parentId) : null;
  const isFlexContainerParent = parentComponentType === 'FlexContainer';

  let activeLayoutData;
  let nonActiveLayoutData;

  if (isFlexContainerParent) {
    const dropHeightPx = customLayouts ? customLayouts[currentLayout].height : defaultHeight;
    const dropWidthPx = customLayouts ? customLayouts[currentLayout].width * gridWidth : defaultWidth * gridWidth;

    const flexLayout = createDefaultFlexChildLayout({
      widthPx: dropWidthPx,
      height: dropHeightPx,
    });
    activeLayoutData = flexLayout;
    nonActiveLayoutData = { ...flexLayout };
  } else {
    activeLayoutData = {
      top: top,
      left: left,
      width: customLayouts ? customLayouts[currentLayout].width : width,
      height: customLayouts ? customLayouts[currentLayout].height : defaultHeight,
    };
    nonActiveLayoutData = {
      top: top,
      left: left,
      width: customLayouts ? customLayouts[nonActiveLayout].width : width,
      height: customLayouts ? customLayouts[nonActiveLayout].height : defaultHeight,
    };
  }

  const newComponent = {
    id: uuidv4(),
    name: componentName,
    component: {
      ...componentData,
      parent: parentId === 'canvas' ? null : parentId,
    },
    layouts: {
      [currentLayout]: activeLayoutData,
      [nonActiveLayout]: nonActiveLayoutData,
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
      const { componentName, layout, incrementWidth, properties, accessorKey, tab, defaultValue, styles, slotName } =
        child;

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
      const newComponentProperties = {
        ...componentData.definition.properties,
      };
      const newComponentStyles = {
        ...componentData.definition.styles,
      };

      if (_.isArray(properties) && properties.length > 0) {
        properties.forEach((prop) => {
          const accessor = customResolverVariable
            ? `{{${customResolverVariable}.${accessorKey}}}`
            : defaultValue[prop] || '';

          _.set(newComponentProperties, prop, {
            value: accessor,
          });
        });
        _.set(componentData, 'definition.properties', newComponentProperties);
      }

      if (_.isArray(styles) && styles.length > 0) {
        styles.forEach((prop) => {
          const accessor = customResolverVariable
            ? `{{${customResolverVariable}.${accessorKey}}}`
            : defaultValue[prop] || '';

          _.set(newComponentStyles, prop, {
            value: accessor,
          });
        });
        _.set(componentData, 'definition.styles', newComponentStyles);
      }

      if (currentLayout === 'mobile') {
        componentData.definition.others.showOnDesktop.value = `{{false}}`;
        componentData.definition.others.showOnMobile.value = `{{true}}`;
      }

      const nonActiveLayout = currentLayout === 'desktop' ? 'mobile' : 'desktop';
      const _parent = getParentComponentIdByType({
        child,
        parentComponent: parentMeta.component,
        parentId,
        slotName,
      });

      const newChildComponent = {
        id: uuidv4(),
        name: widgetName,
        component: {
          ...componentData,
          parent: _parent,
          name: widgetName,
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

// Walks the ancestor chain of `newParentId`; returns true if `componentId`
// appears anywhere along it (assigning it as the new parent would close a
// cycle), or if the chain is already cyclic (defensive — protects against
// corrupt trees from past multiplayer races / git-sync merges).
export const wouldCreateParentCycle = (componentId, newParentId, allComponents, getBaseParentId) => {
  if (!componentId || !newParentId) return false;
  const toBase = (id) => (getBaseParentId ? getBaseParentId(id) || id : id);
  const visited = new Set();
  let currentId = toBase(newParentId);
  while (currentId) {
    if (currentId === componentId) return true;
    if (visited.has(currentId)) return true;
    visited.add(currentId);
    const parentRef = allComponents[currentId]?.component?.parent;
    if (!parentRef) return false;
    currentId = toBase(parentRef);
  }
  return false;
};

// Internal worker that threads `visited` across recursion. A cyclic parent
// chain (multiplayer race / git-sync merge / legacy corrupt data) would
// otherwise infinite-loop and freeze the editor.
const collectChildComponents = (allComponents, parentId, visited) => {
  if (!parentId || visited.has(parentId)) return [];
  visited.add(parentId);

  const childComponents = [];

  Object.keys(allComponents).forEach((componentId) => {
    if (visited.has(componentId)) return;
    const componentParentId = allComponents[componentId].component?.parent;

    const isParentTabORCalendar =
      allComponents[parentId]?.component?.component === 'Tabs' ||
      allComponents[parentId]?.component?.component === 'Calendar' ||
      allComponents[parentId]?.component?.component === 'Kanban' ||
      allComponents[parentId]?.component?.component === 'Container' ||
      allComponents[parentId]?.component?.component === 'Accordion' ||
      allComponents[parentId]?.component?.component === 'Form' ||
      allComponents[parentId]?.component?.component === 'ModalV2';

    if (componentParentId && isParentTabORCalendar) {
      let childComponent = deepClone(allComponents[componentId]);
      childComponent.id = componentId;
      const childTabId = componentParentId.split('-').at(-1);
      if (componentParentId === `${parentId}-${childTabId}`) {
        childComponent.isParentTabORCalendar = true;
        childComponent.events = useStore.getState().eventsSlice.getEventsByComponentsId(componentId);
        childComponents.push(childComponent);
        const childrenOfChild = collectChildComponents(allComponents, componentId, visited);
        childComponents.push(...childrenOfChild);
      }
    }

    if (componentParentId === parentId) {
      let childComponent = deepClone(allComponents[componentId]);
      childComponent.id = componentId;
      childComponent.events = useStore.getState().eventsSlice.getEventsByComponentsId(componentId);
      childComponents.push(childComponent);

      const childrenOfChild = collectChildComponents(allComponents, componentId, visited);
      childComponents.push(...childrenOfChild);
    }
  });

  return childComponents;
};

export const getAllChildComponents = (allComponents, parentId) => {
  return collectChildComponents(allComponents, parentId, new Set());
};

export const getCanvasWidth = (moduleId = 'canvas') => {
  if (moduleId !== 'canvas') {
    return '100%';
  }

  // if (currentLayout === 'mobile') {
  //   return CANVAS_WIDTHS.deviceWindowWidth;
  // }
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

export const getParentComponentIdByType = ({ child, parentComponent, parentId, slotName }) => {
  const { tab } = child;

  if (parentComponent === 'Tabs') return `${parentId}-${tab}`;
  else if (
    slotName &&
    (parentComponent === 'Form' ||
      parentComponent === 'Container' ||
      parentComponent === 'Accordion' ||
      parentComponent === 'ModalV2')
  ) {
    return `${parentId}-${slotName}`;
  }
  return parentId;
};

export const getParentWidgetFromId = (parentType, parentId) => {
  const isAddingToSlot = parentId?.includes('-header') || parentId?.includes('-footer');

  if (parentType === 'ModalV2' && isAddingToSlot) {
    return 'ModalSlot';
  } else if (parentType === 'Kanban') {
    return 'Kanban_card';
  }
  return parentType;
};

export const getDropTargetLabel = (widgetType, slotType) =>
  slotType === 'header' || slotType === 'footer' ? slotType : widgetType;

export const getTabId = (parentId) => {
  return parentId.split('-').slice(0, -1).join('-');
};

export const getSubContainerIdWithSlots = (parentId) => {
  let cleanParentId = parentId;
  if (parentId) {
    if (parentId.includes('header')) {
      cleanParentId = parentId.replace('-header', '');
    } else if (parentId.includes('footer')) {
      cleanParentId = parentId.replace('-footer', '');
    }
  }
  return cleanParentId;
};

export const getSubContainerWidthAfterPadding = (canvasWidth, componentType, componentId, realCanvasRef) => {
  let padding = 2; //Need to update this 2 to correct value for other subcontainers
  if (
    componentType === 'Container' ||
    componentType === 'Form' ||
    componentType === 'Accordion' ||
    componentType === 'FlexContainer'
  ) {
    padding =
      2 * CONTAINER_FORM_CANVAS_PADDING +
      2 * SUBCONTAINER_CANVAS_BORDER_WIDTH +
      2 * BOX_PADDING +
      2 * HOVER_CLICK_OUTLINE_BORDER;
  }
  if (componentType === 'ModalV2') {
    const isModalHeader = componentId?.includes('header');
    if (isModalHeader) {
      const isModalHeaderCloseBtnHidden = useStore.getState().getResolvedComponent(componentId.slice(0, 36))
        ?.properties?.hideCloseButton;
      padding = 2 * (MODAL_CANVAS_PADDING + 2 * HOVER_CLICK_OUTLINE_BORDER) + (isModalHeaderCloseBtnHidden ? 0 : 56);
    } else {
      padding = 2 * MODAL_CANVAS_PADDING + 2 * HOVER_CLICK_OUTLINE_BORDER;
    }
  }
  if (componentType === 'Listview') {
    padding = 2 * LISTVIEW_CANVAS_PADDING + 2 * SUBCONTAINER_CANVAS_BORDER_WIDTH + 5 + 2 * HOVER_CLICK_OUTLINE_BORDER; // 5 is accounting for scrollbar
  }
  if (componentType === 'Tabs') {
    padding =
      2 * TAB_CANVAS_PADDING + 2 * BOX_PADDING + 2 * SUBCONTAINER_CANVAS_BORDER_WIDTH + 2 * HOVER_CLICK_OUTLINE_BORDER;
  }

  return canvasWidth - padding;
};

export const getSubContainerHeightAfterPadding = (componentType) => {
  let height = '100%';
  if (componentType === 'Tabs') {
    height = `calc(100% + ${HOVER_CLICK_OUTLINE_BORDER}px + 2.5px)`;
  } else {
    height = `calc(100% + ${HOVER_CLICK_OUTLINE_BORDER}px)`;
  }
  return height;
};

export const addDefaultButtonIdToForm = (formComponent, defaultChildComponents) => {
  const { id } = defaultChildComponents[defaultChildComponents.length - 1]; // Assuming the last child is the button
  formComponent.component.definition.properties.buttonToSubmit = { value: id };
  return formComponent;
};
