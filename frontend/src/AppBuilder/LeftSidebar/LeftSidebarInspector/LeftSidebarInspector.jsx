import React, { useEffect, useMemo, useRef, useState } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { HeaderSection } from '@/_ui/LeftSidebar';
import JSONTreeViewer from '@/_ui/JSONTreeViewer';
import JSONTreeViewerV2 from './JSONTreeViewerV2';
import _ from 'lodash';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import useIconList from './useIconList';
import { Button as ButtonComponent } from '@/components/ui/Button/Button';
import { formatInspectorDataMisc, formatInspectorQueryData } from './utils';

import './styles.scss';

const LeftSidebarInspector = ({ darkMode, pinned, setPinned, moduleId, appType }) => {
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
          metadata: { path: 'queries' },
        },
        {
          id: 'components',
          name: 'Components',
          children: sortedComponents,
          metadata: { path: 'components' },
        },
        {
          id: 'globals',
          name: 'Globals',
          children: sortedGlobalVariables,
          metadata: { path: 'globals' },
        },
        {
          id: 'variables',
          name: 'Variables',
          children: sortedVariables,
          metadata: { path: 'variables' },
        },
        {
          id: 'page',
          name: 'Page',
          children: sortedPageVariables,
          metadata: { path: 'page' },
        },
        {
          id: 'constants',
          name: 'Constants',
          children: sortedConstants,
          metadata: { path: 'constants' },
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

    return jsontreeData;
  }, [sortedComponents, sortedQueries, sortedVariables, sortedConstants, sortedPageVariables, sortedGlobalVariables, sortedModuleInputs]);

  return (
    <div
      className={`left-sidebar-inspector ${darkMode && 'dark-theme'}`}
      style={{ resize: 'horizontal', minWidth: 288 }}
    >
      <HeaderSection darkMode={darkMode}>
        <HeaderSection.PanelHeader title="State inspector">
          <div className="d-flex justify-content-end">
            <ButtonComponent
              iconOnly
              leadingIcon={pinned ? 'unpin' : 'pin'}
              onClick={() => setPinned(!pinned)}
              variant="ghost"
              fill="var(--icon-strong,#6A727C)"
              size="medium"
            />
          </div>
        </HeaderSection.PanelHeader>
      </HeaderSection>

      <div className="card-body p-1 pb-5">
        <JSONTreeViewerV2
          data={memoizedJSONData}
          iconsList={iconsList}
          darkMode={darkMode}
          searchablePaths={searchablePaths.current}
        />
      </div>
    </div>
  );
};

export default LeftSidebarInspector;
