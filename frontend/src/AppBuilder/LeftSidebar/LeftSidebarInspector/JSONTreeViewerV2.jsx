import React, { useMemo } from 'react';
import TreeView, { flattenTree } from 'react-accessible-treeview';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import Fuse from 'fuse.js';
import JSONViewer from './JSONViewer';
import { Node } from './Node';
import { v4 as uuidv4 } from 'uuid';
import InputComponent from '@/components/ui/Input/Index';
import { isEmpty } from 'lodash';

const JSONTreeViewerV2 = ({ data = {}, iconsList = [], darkMode, searchablePaths = new Set() }) => {
  const searchValue = useStore((state) => state.inspectorSearchValue, shallow);
  const getComponentIdFromName = useStore((state) => state.getComponentIdFromName, shallow);
  const getComponentDefinition = useStore((state) => state.getComponentDefinition, shallow);
  const getResolvedValue = useStore((state) => state.getResolvedValue, shallow);
  const setSearchValue = useStore((state) => state.setInspectorSearchValue, shallow);
  const selectedNodePath = useStore((state) => state.selectedNodePath, shallow);
  const setSelectedNodePath = useStore((state) => state.setSelectedNodePath, shallow);

  const selectedNodes = useStore((state) => state.selectedNodes, shallow);

  function fuzzySearch(query, searchablePaths) {
    const list = Array.from(searchablePaths);
    const fuse = new Fuse(list, {
      threshold: 0.2,
      minMatchCharLength: 2,
      includeScore: true,
      distance: 1000,
      tokenize: true,
      matchAllTokens: true,
    });
    return fuse.search(query).map((result) => result.item);
  }

  const [searchedSet, pathSet] = useMemo(() => {
    const result = fuzzySearch(searchValue, searchablePaths);
    const expandedIdSet = new Set();
    result.forEach((id) => {
      const pathArray = id.split('.');
      for (let i = pathArray.length - 1; i > 0; i--) {
        const parentPath = pathArray.slice(0, i).join('.');
        if (!expandedIdSet.has(parentPath)) {
          expandedIdSet.add(parentPath);
        }
      }
    });
    return [new Set(result), expandedIdSet];
  }, [searchValue, JSON.stringify(searchablePaths)]);

  // Do not remove this code, once we have the data in the correct format, we can use this function to filter the data
  // const recursiveFn = (obj) => {
  //   if (!obj || typeof obj !== 'object') return [];
  //   let isCompletelyExposed = false;
  //   obj?.children?.forEach((child) => {
  //     const { id } = child;
  //     if (searchedSet.has(id)) {
  //       isCompletelyExposed = true;
  //     }
  //   });
  //   const newChildren =
  //     obj?.children
  //       ?.filter((child) => {
  //         return isCompletelyExposed || pathSet.has(child.id);
  //       })
  //       ?.map((child) => {
  //         return recursiveFn(child);
  //       }) || [];

  //   return {
  //     ...obj,
  //     children: newChildren,
  //   };
  // };

  // const formattedData = useMemo(() => {
  //   return searchValue ? recursiveFn(data) : data;
  // }, [data, searchValue]);

  const key = useMemo(() => {
    return uuidv4();
  }, [JSON.stringify(data), selectedNodePath]);

  const flattendedData = flattenTree(data);

  const backFn = () => {
    setSelectedNodePath(null);
  };

  const selectedData = (() => {
    if (selectedNodePath?.startsWith('components.')) {
      // Split the selectedNode path using . and grab the second element if it exists
      const pathArray = selectedNodePath.split('.');
      const componentName = pathArray?.[1];
      const componentId = getComponentIdFromName(componentName);
      const component = getComponentDefinition(componentId);
      const parent = component?.component?.parent;
      if (parent) {
        const parentComponent = getComponentDefinition(parent);
        const parentType = parentComponent?.component?.component;
        if (parentType === 'Form') {
          return {
            id: componentId,
          };
        }
      }
    }
    return selectedNodePath ? getResolvedValue(`{{${selectedNodePath}}}`) : {};
  })();

  const expandedIds = [...Array.from(pathSet), ...selectedNodes];

  const filteredIds = useMemo(() => {
    const expandedIdsSet = new Set(expandedIds);
    const filtered = flattendedData.filter((item) => {
      const { metadata } = item || {};
      const { actualPath, path } = metadata || {};
      return expandedIdsSet.has(actualPath || path);
    });

    return filtered
      .map((item) => item.id)
      .filter((path) => {
        const pathArray = path.split('.');
        // One by one combine and check if the path is in expandedIds or not
        for (let i = pathArray.length - 1; i > 0; i--) {
          const parentPath = pathArray.slice(0, i).join('.');
          if (!expandedIdsSet.has(parentPath)) {
            return false;
          }
        }
        return true;
      });
  }, [flattendedData, expandedIds]);

  return (
    <>
      {!selectedNodePath || (typeof selectedData == 'object' && isEmpty(selectedData)) ? (
        <div>
          <div style={{ margin: '8px 16px 12px 16px' }}>
            {/* <SearchBox
              dataCy={`inspector-search`}
              initialValue={searchValue}
              callBack={(e) => setSearchValue(e.target.value)}
              onClearCallback={() => setSearchValue('')}
              placeholder={`Search`}
              customClass={`tj-inspector-search-input  tj-text-xsm`}
              showClearButton={false}
              width={300}
            /> */}

            <InputComponent
              leadingIcon="search01"
              onChange={(e) => setSearchValue(e.target.value)}
              onClear={() => setSearchValue('')}
              size="medium"
              placeholder="Search"
              value={searchValue}
              {...(searchValue && { trailingAction: 'clear' })}
            />
          </div>
          <div className="json-tree-view">
            <TreeView
              data={flattendedData}
              className="basic"
              aria-label="basic example tree"
              defaultExpandedIds={selectedNodes}
              expandedIds={filteredIds}
              key={key}
              nodeRenderer={(props) => {
                const { element } = props;
                const { metadata } = element || {};
                const { path } = metadata || {};
                const data = {
                  nodeName: element.name,
                  selectedNodePath: path,
                };

                return (
                  <Node
                    {...props}
                    darkMode={darkMode}
                    setSelectedNodePath={setSelectedNodePath}
                    searchValue={searchValue}
                    iconsList={iconsList}
                    data={data}
                  />
                );
              }}
            />
          </div>
        </div>
      ) : (
        <JSONViewer
          data={selectedData}
          iconsList={iconsList}
          darkMode={darkMode}
          path={selectedNodePath}
          backFn={backFn}
        />
      )}
    </>
  );
};

export default JSONTreeViewerV2;
