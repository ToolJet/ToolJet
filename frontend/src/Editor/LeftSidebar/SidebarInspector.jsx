import React, { useMemo } from 'react';
import { HeaderSection } from '@/_ui/LeftSidebar';
import JSONTreeViewer from '@/_ui/JSONTreeViewer';
import _ from 'lodash';
import { toast } from 'react-hot-toast';
import Icon from '@/_ui/Icon/solidIcons/index';
import { useGlobalDataSources, useSampleDataSource } from '@/_stores/dataSourcesStore';
import { useDataQueries } from '@/_stores/dataQueriesStore';
import { useCurrentState } from '@/_stores/currentStateStore';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { shallow } from 'zustand/shallow';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { useEditorStore } from '@/_stores/editorStore';
import DataSourceIcon from '@/Editor/QueryManager/Components/DataSourceIcon';
import { useQueryPanelActions } from '@/_stores/queryPanelStore';

const staticDataSources = [
  { kind: 'tooljetdb', id: 'null', name: 'Tooljet Database' },
  { kind: 'restapi', id: 'null', name: 'REST API' },
  { kind: 'runjs', id: 'runjs', name: 'Run JavaScript code' },
  { kind: 'runpy', id: 'runpy', name: 'Run Python code' },
  { kind: 'workflows', id: 'null', name: 'Run Workflow' },
];

export const LeftSidebarInspector = ({
  darkMode,
  appDefinition,
  setSelectedComponent,
  removeComponent,
  runQuery,
  setPinned,
  pinned,
}) => {
  const dataSources = useGlobalDataSources();
  const sampleDataSource = useSampleDataSource();
  const { setSelectedQuery } = useQueryPanelActions();

  const dataQueries = useDataQueries();
  const { isVersionReleased, isEditorFreezed } = useAppVersionStore(
    (state) => ({
      isVersionReleased: state.isVersionReleased,
      isEditorFreezed: state.isEditorFreezed,
    }),
    shallow
  );
  const { selectedComponents } = useEditorStore(
    (state) => ({
      selectedComponents: state.selectedComponents,
    }),
    shallow
  );
  const currentState = useCurrentState();

  const componentDefinitions = JSON.parse(JSON.stringify(appDefinition))['components'];

  const selectedComponent = React.useMemo(() => {
    const _selectedComponent = selectedComponents[selectedComponents.length - 1];

    return {
      id: _selectedComponent?.id,
      component: _selectedComponent?.component?.name,
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedComponents]);

  const memoizedJSONData = React.useMemo(() => {
    const { queries: currentQueries } = currentState;

    const jsontreeData = { ...currentState, queries: currentQueries };
    delete jsontreeData.errors;
    delete jsontreeData.client;
    delete jsontreeData.server;
    delete jsontreeData.actions;
    delete jsontreeData.succededQuery;
    delete jsontreeData.layout;

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

  const queryIcons = dataQueries.map((query) => {
    const allDs = [...staticDataSources, ...dataSources, ...(sampleDataSource ? [sampleDataSource] : [])];
    const source = allDs.find((ds) => ds.kind === query.kind);
    return { iconName: query.name, jsx: () => <DataSourceIcon source={source} height={16} /> };
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
  const exposedVariablesIcon = Object.entries(currentState['components'])
    .map(([key, value]) => {
      const component = componentDefinitions[value.id]?.component ?? {};
      const componentExposedVariables = value;

      if (!_.isEmpty(component) && component.component === 'TextInput') {
        const icons = [];

        if (componentExposedVariables.disable) {
          icons.push({
            iconName: 'disable',
            jsx: () => <Icon name={'warning'} height={16} width={16} fill="#DB4324" />,
            className: 'component-icon',
            tooltipMessage: 'This function will be deprecated soon, You can use setDisable as an alternative',
            isInfoIcon: true,
          });
        }

        if (componentExposedVariables.visibility) {
          icons.push({
            iconName: 'visibility',
            jsx: () => <Icon name={'warning'} height={16} width={16} fill="#DB4324" />,
            className: 'component-icon',
            tooltipMessage: 'This function will be deprecated soon, You can use setVisibility as an alternative',
            isInfoIcon: true,
          });
        }

        return icons;
      }
      if (!_.isEmpty(component) && component.component === 'Checkbox') {
        const icons = [];

        if (componentExposedVariables.setChecked) {
          icons.push({
            iconName: 'setChecked',
            jsx: () => <Icon name={'warning'} height={16} width={16} fill="#DB4324" />,
            className: 'component-icon',
            tooltipMessage: 'This function will be deprecated soon, You can use setValue as an alternative',
            isInfoIcon: true,
          });
        }

        return icons;
      }

      if (!_.isEmpty(component) && component.component === 'Button') {
        const icons = [];

        if (componentExposedVariables.disable) {
          icons.push({
            iconName: 'disable',
            jsx: () => <Icon name={'warning'} height={16} width={16} fill="#DB4324" />,
            className: 'component-icon',
            tooltipMessage: 'This function will be deprecated soon, You can use setDisable as an alternative',
            isInfoIcon: true,
          });
        }

        if (componentExposedVariables.visibility) {
          icons.push({
            iconName: 'visibility',
            jsx: () => <Icon name={'warning'} height={16} width={16} fill="#DB4324" />,
            className: 'component-icon',
            tooltipMessage: 'This function will be deprecated soon, You can use setVisibility as an alternative',
            isInfoIcon: true,
          });
        }

        if (componentExposedVariables.loading) {
          icons.push({
            iconName: 'loading',
            jsx: () => <Icon name={'warning'} height={16} width={16} fill="#DB4324" />,
            className: 'component-icon',
            tooltipMessage: 'This function will be deprecated soon, You can use setLoading as an alternative',
            isInfoIcon: true,
          });
        }

        return icons;
      }

      if (!_.isEmpty(component) && component.component === 'Text' && componentExposedVariables?.visibility) {
        return [
          {
            iconName: 'visibility',
            jsx: () => <Icon name={'warning'} height={16} width={16} fill="#DB4324" />,
            className: 'component-icon',
            tooltipMessage: 'This function will be deprecated soon, You can use setVisibility as an alternative',
            isInfoIcon: true,
          },
        ];
      }

      return [];
    })
    .flat()
    .filter((value) => value !== undefined); // Remove undefined values

  const iconsList = useMemo(
    () => [...queryIcons, ...componentIcons, ...exposedVariablesIcon],
    [queryIcons, componentIcons, exposedVariablesIcon]
  );
  const handleRemoveComponent = (component) => {
    removeComponent(component.id);
  };

  const handleSelectComponentOnEditor = (component) => {
    setSelectedComponent(component.id, component);
  };

  const handleRunQuery = (query, currentNode) => {
    setSelectedQuery(query.id);
    const additionalArgs = {
      confirmed: undefined,
      mode: 'edit',
      userSuppliedParameters: {},
      shouldSetPreviewData: true,
    };
    runQuery(query.id, currentNode, additionalArgs);
  };

  const copyToClipboard = (data) => {
    const stringified = JSON.stringify(data, null, 2).replace(/\\/g, '');
    navigator.clipboard.writeText(stringified);
    return toast.success('Value copied to clipboard', { position: 'top-center' });
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
        ...(!isVersionReleased && !isEditorFreezed
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
          selectedComponent={selectedComponent}
          treeType="inspector"
          darkMode={darkMode}
        />
      </div>
    </div>
  );
};
