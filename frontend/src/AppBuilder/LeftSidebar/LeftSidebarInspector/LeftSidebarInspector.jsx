import React, { useMemo, useRef } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import JSONTreeViewerV2 from './JSONTreeViewerV2';
import useIconList from './useIconList';
import InspectorHeader from './InspectorHeader';
import { formatInspectorDataMisc, formatInspectorQueryData, noDataFoundChildDataFormat } from './utils';
import ErrorBoundary from '@/_ui/ErrorBoundary';

import './styles.scss';

const LeftSidebarInspector = ({ darkMode, onClose, moduleId, appType }) => {
  const exposedComponentsVariables = useStore((state) => state.getAllExposedValues().components, shallow);
  const exposedQueries = useStore((state) => state.getAllExposedValues().queries || {}, shallow);
  const exposedVariables = useStore((state) => state.getAllExposedValues().variables || {}, shallow);
  const exposedConstants = useStore((state) => state.getAllExposedValues().constants || {}, shallow);
  const exposedPageVariables = useStore((state) => state.getAllExposedValues().page || {}, shallow);
  const exposedGlobalVariables = useStore((state) => state.getAllExposedValues().globals || {}, shallow);
  const exposedModuleInputs = useStore((state) => state.getAllExposedValues(moduleId).input || {}, shallow);
  const componentIdNameMapping = useStore((state) => state.getComponentIdNameMapping(), shallow);
  const formatInspectorComponentData = useStore((state) => state.formatInspectorComponentData, shallow);
  const queryNameIdMapping = useStore((state) => state.getQueryNameIdMapping(), shallow);
  const searchablePaths = useRef(new Set(['queries', 'components', 'globals', 'variables', 'page', 'constants']));

  // Search state from store
  const searchValue = useStore((state) => state.inspectorSearchValue, shallow);
  const setSearchValue = useStore((state) => state.setInspectorSearchValue, shallow);

  const iconsList = useIconList({
    exposedComponentsVariables,
    componentIdNameMapping,
    exposedQueries,
  });

  const sortedComponents = useMemo(() => {
    return formatInspectorComponentData(componentIdNameMapping, exposedComponentsVariables, searchablePaths.current);
  }, [exposedComponentsVariables, componentIdNameMapping]);

  const sortedQueries = useMemo(() => {
    return formatInspectorQueryData(queryNameIdMapping, exposedQueries, searchablePaths.current);
  }, [exposedQueries, queryNameIdMapping]);

  const sortedVariables = useMemo(
    () => formatInspectorDataMisc(exposedVariables, 'variables', searchablePaths.current),
    [exposedVariables]
  );

  const sortedConstants = useMemo(
    () => formatInspectorDataMisc(exposedConstants, 'constants', searchablePaths.current),
    [exposedConstants]
  );

  const sortedPageVariables = useMemo(
    () => formatInspectorDataMisc(exposedPageVariables, 'page', searchablePaths.current),
    [exposedPageVariables]
  );

  const sortedGlobalVariables = useMemo(
    () => formatInspectorDataMisc(exposedGlobalVariables, 'globals', searchablePaths.current),
    [exposedGlobalVariables]
  );

  const sortedModuleInputs = useMemo(
    () => formatInspectorDataMisc(exposedModuleInputs, 'input', searchablePaths.current),
    [exposedModuleInputs]
  );

  const memoizedJSONData = React.useMemo(() => {
    const jsontreeData = {
      name: '',
      children: [
        {
          id: 'queries',
          name: 'Queries',

          children: sortedQueries,
          metadata: { type: 'queries', path: 'queries' },
        },
        {
          id: 'components',
          name: 'Components (current page)',

          children: sortedComponents,
          metadata: { type: 'components', path: 'components' },
        },
        {
          id: 'globals',
          name: 'Globals',

          children: sortedGlobalVariables,
          metadata: { type: 'globals', path: 'globals' },
        },
        {
          id: 'variables',
          name: 'Variables',

          children: sortedVariables,
          metadata: { type: 'variables', path: 'variables' },
        },
        {
          id: 'page',
          name: 'Page',

          children: sortedPageVariables,
          metadata: { type: 'page', path: 'page' },
        },
        {
          id: 'constants',
          name: 'Constants',
          children: sortedConstants,
          metadata: { type: 'constants', path: 'constants' },
        },
      ],
    };

    if (appType === 'module') {
      jsontreeData.children.push({
        id: 'input',
        name: 'Input',
        children: sortedModuleInputs,
        metadata: { path: 'input' },
      });
    }

    const addNoDataChild = (data) => {
      const types = data.children;
      types.forEach((type) => {
        if (type.children.length === 0) {
          type.children.push(noDataFoundChildDataFormat(type.metadata.type));
        }
      });
    };

    addNoDataChild(jsontreeData);

    return jsontreeData;
  }, [
    sortedComponents,
    sortedQueries,
    sortedVariables,
    sortedConstants,
    sortedPageVariables,
    sortedGlobalVariables,
    sortedModuleInputs,
  ]);

  return (
    <div
      className={`left-sidebar-inspector ${darkMode && 'dark-theme'}`}
      style={{ resize: 'horizontal', minWidth: 288 }}
    >
      <InspectorHeader
        darkMode={darkMode}
        onClose={onClose}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onSearchClear={() => setSearchValue('')}
      />

      <div className="card-body p-1 pb-5">
        <ErrorBoundary>
          <JSONTreeViewerV2
            data={memoizedJSONData}
            iconsList={iconsList}
            darkMode={darkMode}
            searchablePaths={searchablePaths.current}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default LeftSidebarInspector;
