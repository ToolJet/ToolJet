import React, { useEffect, useMemo } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { HeaderSection } from '@/_ui/LeftSidebar';
import JSONTreeViewer from '@/_ui/JSONTreeViewer';
import JSONTreeViewerV2 from './JSONTreeViewerV2';
import _ from 'lodash';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import useIconList from './useIconList';
import useCallbackActions from './useCallbackActions';
import { formatInspectorComponentData, formatInspectorDataMisc, formatInspectorQueryData } from './utils';

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
  console.log('callbackActions', callbackActions);

  const sortedComponents = useMemo(() => {
    return formatInspectorComponentData(componentIdNameMapping, exposedComponentsVariables);
  }, [exposedComponentsVariables, componentIdNameMapping]);

  const sortedQueries = useMemo(() => {
    return formatInspectorQueryData(queryNameIdMapping, exposedQueries);
  }, [exposedQueries, queryNameIdMapping]);

  const sortedVariables = useMemo(() => formatInspectorDataMisc(exposedVariables), [exposedVariables]);

  const sortedConstants = useMemo(() => formatInspectorDataMisc(exposedConstants), [exposedConstants]);

  const sortedPageVariables = useMemo(() => formatInspectorDataMisc(exposedPageVariables), [exposedPageVariables]);

  const sortedGlobalVariables = useMemo(
    () => formatInspectorDataMisc(exposedGlobalVariables),
    [exposedGlobalVariables]
  );

  const memoizedJSONData = React.useMemo(() => {
    const jsontreeData = {
      name: '',
      children: [
        {
          name: 'Queries',
          children: sortedQueries,
        },
        {
          name: 'Components',
          children: sortedComponents,
        },
        {
          name: 'Globals',
          children: sortedGlobalVariables,
        },
        {
          name: 'Variables',
          children: sortedVariables,
        },
        {
          name: 'Page',
          children: sortedPageVariables,
        },
        {
          name: 'Constants',
          children: sortedConstants,
        },
      ],
    };

    return jsontreeData;
  }, [sortedComponents, sortedQueries, sortedVariables, sortedConstants, sortedPageVariables, sortedGlobalVariables]);

  const handleNodeExpansion = (path, data, currentNode) => {
    if (pathToBeInspected && path?.length > 0) {
      const shouldExpand = pathToBeInspected.includes(path[path.length - 1]);

      // Scroll to the component in the inspector
      if (path?.length === 2 && path?.[0] === 'components' && shouldExpand) {
        const target = document.getElementById(`inspector-node-${String(currentNode).toLowerCase()}`);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }

      return shouldExpand;
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
        <JSONTreeViewerV2
          data={memoizedJSONData}
          iconsList={iconsList}
          darkMode={darkMode}
          callbackActions={callbackActions}
        />
        {/* <JSONTreeViewer
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
        /> */}
      </div>
    </div>
  );
};

export default LeftSidebarInspector;
