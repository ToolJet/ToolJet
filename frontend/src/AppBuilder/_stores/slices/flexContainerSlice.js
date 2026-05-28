import { deepClone } from '@/_helpers/utilities/utils.helpers';
import {
  getNextFlexChildOrderOnInsert,
  insertId,
  moveId,
  normalizeChildOrder,
  removeId,
} from '@/AppBuilder/Widgets/FlexContainer/flexContainer.utils';

const getDefinitionWithoutRuntimeFields = (component = {}) => {
  const filteredDefinition = { ...(component.definition || {}) };
  delete filteredDefinition.events;
  delete filteredDefinition.exposedVariables;
  return filteredDefinition;
};

const getChildOrderValue = (component) => {
  const value = component?.definition?.properties?.childOrder?.value;
  return Array.isArray(value) ? value : [];
};

const buildFlexChildOrderComponentDiff = (component, childOrder) => ({
  component: {
    ...component,
    definition: {
      ...getDefinitionWithoutRuntimeFields(component),
      properties: {
        ...(component.definition?.properties ?? {}),
        childOrder: { value: childOrder },
      },
    },
  },
});

const writeChildOrder = (component, childOrder) => {
  if (!component) return;
  if (!component.definition.properties) component.definition.properties = {};
  component.definition.properties.childOrder = { value: childOrder };
};

export const createFlexContainerSlice = (set, get) => ({
  buildFlexChildOrderComponentDiff,

  addFlexContainerChildOrderToDraft: ({ state, page, parentId, childId, flexChildOrderUpdates }) => {
    const parentComponent = page.components[parentId]?.component;
    if (parentComponent?.component !== 'FlexContainer') return;

    const actualChildIds = state.containerChildrenMapping[parentId] ?? [];
    const lockedTarget = state.flexContainerDropTarget;
    const targetIndex = lockedTarget?.flexContainerId === parentId ? lockedTarget.index : actualChildIds.length;
    const nextOrder = getNextFlexChildOrderOnInsert({
      childOrder: getChildOrderValue(parentComponent),
      actualChildIds,
      childId,
      targetIndex,
    });

    writeChildOrder(parentComponent, nextOrder);
    flexChildOrderUpdates[parentId] = nextOrder;
  },

  removeDeletedComponentFromFlexChildOrdersInDraft: ({ page, childId, toDeleteComponents, flexChildOrderUpdates }) => {
    Object.entries(page.components).forEach(([componentId, pageComponent]) => {
      if (toDeleteComponents.includes(componentId)) return;
      if (pageComponent?.component?.component !== 'FlexContainer') return;
      const childOrder = getChildOrderValue(pageComponent.component);
      if (!childOrder.includes(childId)) return;

      const nextOrder = removeId(flexChildOrderUpdates[componentId] ?? childOrder, childId);
      flexChildOrderUpdates[componentId] = nextOrder;
      writeChildOrder(pageComponent.component, nextOrder);
    });
  },

  removeFlexContainerChildOrderFromDraft: ({ page, parentId, childId, flexChildOrderUpdates }) => {
    const parent = page.components[parentId]?.component;
    if (!parent) return;

    const nextOrder = removeId(getChildOrderValue(parent), childId);
    writeChildOrder(parent, nextOrder);
    flexChildOrderUpdates[parentId] = nextOrder;
  },

  moveFlexContainerChild: ({
    childId,
    sourceContainerId,
    targetContainerId,
    targetIndex,
    moduleId = 'canvas',
    layoutPatch = {},
    updateParent = true,
    saveAfterAction = true,
    skipUndoRedo = false,
  }) => {
    if (!childId || !sourceContainerId || !targetContainerId) return;
    const {
      getCurrentPageIndex,
      getCurrentMode,
      saveComponentChanges,
      withUndoRedo,
      getComponentDefinition,
      setResolvedComponent,
      getResolvedComponent,
    } = get();
    const currentPageIndex = getCurrentPageIndex(moduleId);
    const currentMode = getCurrentMode(moduleId);
    const updatedChildOrders = {};
    let parentChanged = false;

    set(
      withUndoRedo((state) => {
        const page = state.modules[moduleId].pages[currentPageIndex];
        const source = page?.components?.[sourceContainerId]?.component;
        const target = page?.components?.[targetContainerId]?.component;
        const child = page?.components?.[childId];
        if (!page || !source || !target || !child) return;

        const sourceChildren = state.containerChildrenMapping[sourceContainerId] ?? [];
        const targetChildren = state.containerChildrenMapping[targetContainerId] ?? [];

        if (sourceContainerId === targetContainerId) {
          const normalized = normalizeChildOrder(getChildOrderValue(source), sourceChildren);
          updatedChildOrders[sourceContainerId] = moveId(normalized, childId, targetIndex);
        } else {
          const sourceOrder = normalizeChildOrder(getChildOrderValue(source), sourceChildren);
          const targetOrder = normalizeChildOrder(
            getChildOrderValue(target),
            targetChildren.filter((id) => id !== childId)
          );
          updatedChildOrders[sourceContainerId] = removeId(sourceOrder, childId);
          updatedChildOrders[targetContainerId] = insertId(targetOrder, childId, targetIndex);

          if (updateParent && child.component.parent !== targetContainerId) {
            parentChanged = true;
            if (child.component.parent && state.containerChildrenMapping[child.component.parent]) {
              state.containerChildrenMapping[child.component.parent] = state.containerChildrenMapping[
                child.component.parent
              ].filter((id) => id !== childId);
            }
            if (!state.containerChildrenMapping[targetContainerId]) {
              state.containerChildrenMapping[targetContainerId] = [];
            }
            if (!state.containerChildrenMapping[targetContainerId].includes(childId)) {
              state.containerChildrenMapping[targetContainerId].push(childId);
            }
            child.component.parent = targetContainerId;
          }
        }

        Object.entries(updatedChildOrders).forEach(([containerId, childOrder]) => {
          const container = page.components[containerId]?.component;
          writeChildOrder(container, childOrder);
        });

        if (Object.keys(layoutPatch).length > 0) {
          child.layouts[state.currentLayout] = {
            ...child.layouts[state.currentLayout],
            ...layoutPatch,
          };
          delete child.layouts[state.currentLayout].top;
          delete child.layouts[state.currentLayout].left;
          delete child.layouts[state.currentLayout].width;
        }
      }, skipUndoRedo),
      false,
      'moveFlexContainerChild'
    );

    Object.entries(updatedChildOrders).forEach(([containerId, childOrder]) => {
      const resolvedComponent = deepClone(getResolvedComponent(containerId, null, moduleId) ?? {});
      resolvedComponent.properties = {
        ...(resolvedComponent.properties ?? {}),
        childOrder,
      };
      setResolvedComponent(containerId, resolvedComponent, moduleId);
    });

    if (currentMode !== 'view' && saveAfterAction && Object.keys(updatedChildOrders).length > 0) {
      const componentUpdates = Object.entries(updatedChildOrders).reduce((acc, [containerId, childOrder]) => {
        const component = getComponentDefinition(containerId, moduleId)?.component;
        if (component) acc[containerId] = buildFlexChildOrderComponentDiff(component, childOrder);
        return acc;
      }, {});

      const layoutDiff = {
        [childId]: {
          ...(parentChanged ? { component: { parent: targetContainerId } } : {}),
          ...(Object.keys(layoutPatch).length > 0
            ? {
                layouts: {
                  [get().currentLayout]: {
                    ...layoutPatch,
                  },
                },
              }
            : {}),
        },
      };

      saveComponentChanges(
        {
          update: { diff: componentUpdates },
          ...(parentChanged || Object.keys(layoutPatch).length > 0 ? { layout: { diff: layoutDiff } } : {}),
        },
        'components/batch',
        'update',
        moduleId
      );
      get().multiplayer.broadcastUpdates({ childId, sourceContainerId, targetContainerId }, 'components', 'update');
    }
  },
});
