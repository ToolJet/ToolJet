const initialState = {
  selectedNodes: new Set(),
  searchedNodes: new Set(),
  inspectorSearchValue: '',
  inspectorSearchResults: new Set(),
  selectedNodePath: null,
};

export const createInspectorSlice = (set, get) => ({
  ...initialState,
  getSelectedNodes: () => {
    const selectedNodes = get().selectedNodes;
    return Array.from(selectedNodes);
  },
  setSelectedNodes: (node) => {
    const selectedNodes = get().selectedNodes;
    const newSelectedNodes = new Set(selectedNodes);
    if (newSelectedNodes.has(node)) {
      newSelectedNodes.delete(node);
    } else {
      newSelectedNodes.add(node);
    }
    set({ selectedNodes: newSelectedNodes });
  },
  getInspectorSearchResults: () => {
    const inspectorSearchResults = get().inspectorSearchResults;
    return Array.from(inspectorSearchResults);
  },
  setInspectorSearchValue: (value) => {
    set({ inspectorSearchValue: value });
  },
  setInspectorSearchResults: (results) => {
    set({ inspectorSearchResults: results });
  },
  setSelectedNodePath: (path) => {
    set({ selectedNodePath: path });
  },
  getAllComponentChildrenById: (id) => {
    const { getComponentDefinition, getResolvedComponent } = get();
    const component = getComponentDefinition(id);
    const componentType = component?.component?.component;
    switch (componentType) {
      case 'Container':
      case 'Form':
      case 'ModalV2':
        return [
          ...get().getContainerChildrenMapping(id),
          ...get().getContainerChildrenMapping(`${id}-header`),
          ...get().getContainerChildrenMapping(`${id}-footer`),
        ];
      case 'Tabs': {
        const tabs = getResolvedComponent(id)?.properties?.tabs;
        const children = Array.isArray(tabs) ? tabs : [];
        const res = children
          ?.map((tab) => {
            const tabId = `${id}-${tab.id}`;
            return get().getContainerChildrenMapping(tabId);
          })
          .reduce((acc, curr) => {
            return [...acc, ...curr];
          }, []);
        return res;
      }
      default:
        return get().getContainerChildrenMapping(id);
    }
  },

  formatInspectorComponentData: (
    componentIdNameMapping,
    exposedComponentsVariables,
    searchablePaths = new Set(),
    moduleId = 'canvas'
  ) => {
    const { getComponentDefinition, getAllComponentChildrenById } = get();
    const data = Object.entries(componentIdNameMapping)
      .filter(([key]) => {
        const component = getComponentDefinition(key, moduleId);
        return !component?.component?.parent;
      })
      .map(([key, name]) => {
        const component = getComponentDefinition(key, moduleId);
        let parentComponentType = null;
        if (component?.component?.parent) {
          const parentComponent = getComponentDefinition(component.component.parent, moduleId);
          parentComponentType = parentComponent?.component?.component;
        }
        return {
          key,
          name: name || key,
          parentType: parentComponentType,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

    const reduceData = (obj, path = 'components', level = 1) => {
      let data = obj;
      if (!obj || typeof obj !== 'object') return [];

      return data
        .filter((item) => item.name)
        .reduce((acc, { key, name, parentType }) => {
          const currentPath = `components.${name}`;
          const actualPath = `${path}.${name}`;
          searchablePaths.add(actualPath);
          const children = getAllComponentChildrenById(key).map((childKey) => {
            const childComponent = getComponentDefinition(childKey);
            let parentComponentType = null;
            if (childComponent?.component?.parent) {
              const parentComponent = getComponentDefinition(childComponent.component.parent);
              parentComponentType = parentComponent?.component?.component;
            }
            return {
              key: childKey,
              name: childComponent?.component?.name,
              parentType: parentComponentType,
            };
          });

          return [
            ...acc,
            {
              id: actualPath,
              name,
              children: reduceData(children, actualPath, level + 1),
              metadata: {
                type: 'components',
                path: currentPath,
                parentType: parentType,
                actualPath,
              },
            },
          ];
        }, []);
    };

    return reduceData(data);
  },
});
