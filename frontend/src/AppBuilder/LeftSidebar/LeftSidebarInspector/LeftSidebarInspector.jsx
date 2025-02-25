import React, { useEffect, useMemo } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { HeaderSection } from '@/_ui/LeftSidebar';
import JSONTreeViewer from '@/_ui/JSONTreeViewer';
import _ from 'lodash';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import useIconList from './useIconList';
import useCallbackActions from './useCallbackActions';

const sortAndReduce = (obj) => {
  return Object.entries(obj)
    .sort((a, b) => a[0].localeCompare(b[0], undefined, { sensitivity: 'base' }))
    .reduce((acc, [name, value]) => {
      acc[name] = value;
      return acc;
    }, {});
};

const LeftSidebarInspector = ({ darkMode, pinned, setPinned }) => {
  const exposedComponentsVariables = useStore((state) => state.getAllExposedValues().components, shallow);
  const exposedQueries = useStore((state) => state.getAllExposedValues().queries || {}, shallow);
  const exposedVariables = useStore((state) => state.getAllExposedValues().variables || {}, shallow);
  const exposedConstants = useStore((state) => state.getAllExposedValues().constants || {}, shallow);
  const exposedPageVariables = useStore((state) => state.getAllExposedValues().page || {}, shallow);
  const exposedGlobalVariables = useStore((state) => state.getAllExposedValues().globals || {}, shallow);
  const componentIdNameMapping = useStore((state) => state.getComponentIdNameMapping(), shallow);
  const queryNameIdMapping = useStore((state) => state.getQueryNameIdMapping(), shallow);
  const pathToBeInspected = useStore((state) => state.pathToBeInspected);
  const iconsList = useIconList({
    exposedComponentsVariables,
    componentIdNameMapping,
    exposedQueries,
  });
  const callbackActions = useCallbackActions();

  const sortedComponents = useMemo(() => {
    return Object.entries(componentIdNameMapping)
      .map(([key, name]) => ({
        key,
        name: name || key,
        value: exposedComponentsVariables[key] ?? { id: key },
      }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
      .reduce((acc, { key, name, value }) => {
        acc[name] = { ...value, id: key };
        return acc;
      }, {});
  }, [exposedComponentsVariables, componentIdNameMapping]);

  const sortedQueries = useMemo(() => {
    // Create a reverse mapping for faster lookups
    const reverseMapping = Object.fromEntries(Object.entries(queryNameIdMapping).map(([name, id]) => [id, name]));

    const _sortedQueries = Object.entries(exposedQueries)
      .map(([key, value]) => ({
        key,
        name: reverseMapping[key] || key,
        value,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
      .reduce((acc, { name, value }) => {
        acc[name] = value;
        return acc;
      }, {});
    return _sortedQueries;
  }, [exposedQueries, queryNameIdMapping]);

  const sortedVariables = useMemo(() => sortAndReduce(exposedVariables), [exposedVariables]);

  const sortedConstants = useMemo(() => sortAndReduce(exposedConstants), [exposedConstants]);

  const sortedPageVariables = useMemo(() => sortAndReduce(exposedPageVariables), [exposedPageVariables]);

  const sortedGlobalVariables = useMemo(() => sortAndReduce(exposedGlobalVariables), [exposedGlobalVariables]);

  const memoizedJSONData = React.useMemo(() => {
    const jsontreeData = {};

    jsontreeData['queries'] = sortedQueries;
    jsontreeData['components'] = sortedComponents;
    jsontreeData['globals'] = sortedGlobalVariables;
    jsontreeData['variables'] = sortedVariables;
    jsontreeData['page'] = sortedPageVariables;
    jsontreeData['constants'] = sortedConstants;

    return jsontreeData;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedComponents, sortedQueries, sortedVariables, sortedConstants, sortedPageVariables, sortedGlobalVariables]);

  const handleNodeExpansion = (path) => {
    if (pathToBeInspected && path?.length > 0) {
      return pathToBeInspected.includes(path[path.length - 1]);
    } else return false;
  };

  return (
    <div
      className={`left-sidebar-inspector ${darkMode && 'dark-theme'}`}
      style={{ resize: 'horizontal', minWidth: 288 }}
    >
      <HeaderSection darkMode={darkMode}>
        <HeaderSection.PanelHeader title="Inspector">
          <div className="d-flex justify-content-end">
            <ButtonSolid
              title={`${pinned ? 'Unpin' : 'Pin'}`}
              onClick={() => setPinned(!pinned)}
              darkMode={darkMode}
              styles={{ width: '28px', padding: 0 }}
              data-cy={`left-sidebar-inspector`}
              variant="tertiary"
              className="left-sidebar-header-btn"
              leftIcon={pinned ? 'unpin' : 'pin'}
              iconWidth="14"
              fill={`var(--slate12)`}
            ></ButtonSolid>
          </div>
        </HeaderSection.PanelHeader>
      </HeaderSection>
      <div className="card-body p-1 pb-5">
        <JSONTreeViewer
          data={memoizedJSONData}
          useIcons={true}
          iconsList={iconsList}
          useIndentedBlock={true}
          enableCopyToClipboard={true}
          useActions={true}
          actionsList={callbackActions}
          actionIdentifier="id"
          expandWithLabels={true}
          shouldExpandNode={handleNodeExpansion}
          // selectedComponent={selectedComponent}
          treeType="inspector"
          darkMode={darkMode}
        />
      </div>
    </div>
  );
};

export default LeftSidebarInspector;
