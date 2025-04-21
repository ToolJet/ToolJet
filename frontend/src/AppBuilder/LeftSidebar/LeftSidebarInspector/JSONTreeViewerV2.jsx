import React, { useMemo, useState } from 'react';
import TreeView, { flattenTree } from 'react-accessible-treeview';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import Fuse from 'fuse.js';
import JSONViewer from './JSONViewer';
import { SearchBox } from '@/_components';
import { Node } from './Node';
import { v4 as uuidv4 } from 'uuid';
import { isEmpty } from 'lodash';

const JSONTreeViewerV2 = ({ data = {}, iconsList = [], darkMode, searchablePaths = new Set() }) => {
  const searchValue = useStore((state) => state.inspectorSearchValue, shallow);
  // const getSelectedNodes = useStore((state) => state.getSelectedNodes, shallow);
  const getResolvedValue = useStore((state) => state.getResolvedValue, shallow);
  const setSearchValue = useStore((state) => state.setInspectorSearchValue, shallow);
  const [selectedNodePath, setSelectedNodePath] = React.useState(null);
  const selectedNodes = useStore((state) => state.selectedNodes, shallow);

  function fuzzySearch(query, searchablePaths) {
    const list = Array.from(searchablePaths);
    const fuse = new Fuse(list, { threshold: 0.3 });
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

  const selectedData = selectedNodePath ? getResolvedValue(`{{${selectedNodePath}}}`) : {};
  const expandedIds = [...Array.from(pathSet), ...selectedNodes];

  const filteredIds = useMemo(() => {
    const expandedIdsSet = new Set(expandedIds);
    const filtered = flattendedData.filter((item) => {
      const { metadata } = item || {};
      const { path } = metadata || {};
      return expandedIdsSet.has(path);
    });
    return filtered.map((item) => item.id);
  }, [flattendedData, expandedIds]);

  console.log('selectedData', selectedData);
  return (
    <>
      {!selectedNodePath || isEmpty(selectedData) ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <SearchBox
              dataCy={`inspector-search`}
              initialValue={searchValue}
              callBack={(e) => setSearchValue(e.target.value)}
              onClearCallback={() => setSearchValue('')}
              placeholder={`Search`}
              customClass={`tj-inspector-search-input  tj-text-xsm`}
              showClearButton={false}
              width={300}
            />
          </div>

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
      ) : (
        <JSONViewer data={selectedData} darkMode={darkMode} path={selectedNodePath} backFn={backFn} />
      )}
    </>
  );
};

export default JSONTreeViewerV2;
