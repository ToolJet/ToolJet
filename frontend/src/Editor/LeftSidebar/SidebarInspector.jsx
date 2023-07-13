import React, { useMemo } from 'react';
import { Button, HeaderSection } from '@/_ui/LeftSidebar';
import JSONTreeViewer from '@/_ui/JSONTreeViewer';
import _ from 'lodash';
import { toast } from 'react-hot-toast';
import { getSvgIcon } from '@/_helpers/appUtils';

import { useGlobalDataSources } from '@/_stores/dataSourcesStore';
import { useDataQueries } from '@/_stores/dataQueriesStore';
const staticDataSources = [
  { kind: 'tooljetdb', id: 'null', name: 'Tooljet Database' },
  { kind: 'restapi', id: 'null', name: 'REST API' },
  { kind: 'runjs', id: 'runjs', name: 'Run JavaScript code' },
  { kind: 'runpy', id: 'runpy', name: 'Run Python code' },
];

export const LeftSidebarInspector = ({
  darkMode,
  currentState,
  appDefinition,
  setSelectedComponent,
  removeComponent,
  runQuery,
  setPinned,
  pinned,
  isVersionReleased,
}) => {
  const dataSources = useGlobalDataSources();

  const dataQueries = useDataQueries();
  const componentDefinitions = JSON.parse(JSON.stringify(appDefinition))['components'];
  const selectedComponent = React.useMemo(() => {
    return {
      id: appDefinition['selectedComponent']?.id,
      component: appDefinition['selectedComponent']?.component?.name,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appDefinition['selectedComponent']]);

  const memoizedJSONData = React.useMemo(() => {
    // debugger;
    const updatedQueries = {};
    const { queries: currentQueries } = currentState;
    if (!_.isEmpty(dataQueries)) {
      dataQueries.forEach((query) => {
        if (query.status === 'published') {
          updatedQueries[query.name] = _.merge(currentQueries[query.name], { id: query.id });
        }
      });
    }
    // const data = _.merge(currentState, { queries: updatedQueries });
    const jsontreeData = { ...currentState, queries: updatedQueries };
    delete jsontreeData.errors;
    delete jsontreeData.client;
    delete jsontreeData.server;

    //*Sorted components and queries alphabetically
    const sortedComponents = Object.keys(jsontreeData['components'])
      .sort((a, b) => {
        return a.toLowerCase().localeCompare(b.toLowerCase());
      })
      .reduce((accumulator, key) => {
        accumulator[key] = jsontreeData['components'][key];

        return accumulator;
      }, {});

    const sortedQueries = Object.keys(jsontreeData['queries'])
      .sort((a, b) => {
        return a.toLowerCase().localeCompare(b.toLowerCase());
      })
      .reduce((accumulator, key) => {
        accumulator[key] = jsontreeData['queries'][key];

        return accumulator;
      }, {});

    jsontreeData['components'] = sortedComponents;
    jsontreeData['queries'] = sortedQueries;

    return jsontreeData;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentState, JSON.stringify(dataQueries)]);

  const queryIcons = Object.entries(currentState['queries']).map(([key, value]) => {
    const allDs = [...staticDataSources, ...dataSources];

    const icon = allDs.find((ds) => ds.kind === value.kind);
    const iconFile = icon?.plugin?.iconFile?.data ?? undefined;
    const Icon = () => getSvgIcon(icon?.kind, 16, 16, iconFile ?? undefined);
    return { iconName: key, jsx: () => <Icon style={{ height: 16, width: 16, marginRight: 12 }} /> };
  });

  const componentIcons = Object.entries(currentState['components']).map(([key, value]) => {
    const component = componentDefinitions[value.id]?.component ?? {};

    if (!_.isEmpty(component) && component.name === key) {
      return {
        iconName: key,
        iconPath: `assets/images/icons/widgets/${
          component.component.toLowerCase() === 'radiobutton' ? 'radio-button' : component.component.toLowerCase()
        }.svg`,
        className: 'component-icon',
      };
    }
  });

  const iconsList = useMemo(() => [...queryIcons, ...componentIcons], [queryIcons, componentIcons]);

  const handleRemoveComponent = (component) => {
    removeComponent(component);
  };

  const handleSelectComponentOnEditor = (component) => {
    setSelectedComponent(component.id, component);
  };

  const handleRunQuery = (query, currentNode) => {
    runQuery(query.id, currentNode);
  };

  const copyToClipboard = (data) => {
    const stringified = JSON.stringify(data, null, 2).replace(/\\/g, '');
    navigator.clipboard.writeText(stringified);
    return toast.success('Copied to the clipboard', { position: 'top-center' });
  };

  const callbackActions = [
    {
      for: 'queries',
      actions: [
        {
          name: 'Run Query',
          dispatchAction: handleRunQuery,
          icon: true,
          src: 'assets/images/icons/editor/play.svg',
          width: 8,
          height: 8,
        },
      ],
      enableForAllChildren: false,
      enableFor1stLevelChildren: true,
    },
    {
      for: 'components',
      actions: [
        { name: 'Select Widget', dispatchAction: handleSelectComponentOnEditor, icon: false, onSelect: true },
        ...(!isVersionReleased
          ? [{ name: 'Delete Component', dispatchAction: handleRemoveComponent, icon: true, iconName: 'trash' }]
          : []),
      ],
      enableForAllChildren: false,
      enableFor1stLevelChildren: true,
    },
    {
      for: 'all',
      actions: [{ name: 'Copy value', dispatchAction: copyToClipboard, icon: false }],
    },
  ];

  return (
    <div className={`left-sidebar-inspector`} style={{ resize: 'horizontal', minWidth: 288 }}>
      <HeaderSection darkMode={darkMode}>
        <HeaderSection.PanelHeader title="Inspector">
          <div className="d-flex justify-content-end">
            <Button
              title={`${pinned ? 'Unpin' : 'Pin'}`}
              onClick={() => setPinned(!pinned)}
              darkMode={darkMode}
              size="sm"
              styles={{ width: '28px', padding: 0 }}
              data-cy={`left-sidebar-inspector`}
            >
              <Button.Content
                iconSrc={`assets/images/icons/editor/left-sidebar/pinned${pinned ? 'off' : ''}.svg`}
                direction="left"
              />
            </Button>
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
          currentState={appDefinition}
          actionIdentifier="id"
          expandWithLabels={true}
          selectedComponent={selectedComponent}
          treeType="inspector"
        />
      </div>
    </div>
  );
};
