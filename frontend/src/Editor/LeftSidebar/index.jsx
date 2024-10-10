import '@/_styles/left-sidebar.scss';
import React, { useState, useImperativeHandle, forwardRef, useEffect, useRef } from 'react';
import _ from 'lodash';
import { LeftSidebarInspector } from './SidebarInspector';
import { LeftSidebarDataSources } from './SidebarDatasources';
import { DarkModeToggle } from '../../_components/DarkModeToggle';
import useRouter from '../../_hooks/use-router';
import { LeftSidebarDebugger } from './SidebarDebugger/SidebarDebugger';
import { LeftSidebarComment } from './SidebarComment';
import LeftSidebarPageSelector from './SidebarPageSelector';
import { ConfirmDialog } from '@/_components';
import config from 'config';
import { LeftSidebarItem } from './SidebarItem';
import Popover from '@/_ui/Popover';
import { usePanelHeight } from '@/_stores/queryPanelStore';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { useEditorStore } from '@/_stores/editorStore';
import { useDataSources } from '@/_stores/dataSourcesStore';
import { shallow } from 'zustand/shallow';
import useDebugger from './SidebarDebugger/useDebugger';
import { GlobalSettings } from '../Header/GlobalSettings';
import cx from 'classnames';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import { toast } from 'react-hot-toast';
import Icon from '@/_ui/Icon/solidIcons/index';
import { useDataQueries } from '@/_stores/dataQueriesStore';
import { useCurrentState } from '@/_stores/currentStateStore';
import DataSourceIcon from '@/Editor/QueryManager/Components/DataSourceIcon';

export const LeftSidebar = forwardRef((props, ref) => {
  const router = useRouter();
  const {
    appId,
    switchDarkMode,
    darkMode = false,
    dataSourcesChanged,
    globalDataSourcesChanged,
    dataQueriesChanged,
    appDefinition,
    setSelectedComponent,
    removeComponent,
    runQuery,
    currentPageId,
    addNewPage,
    switchPage,
    deletePage,
    renamePage,
    hidePage,
    unHidePage,
    updateHomePage,
    updatePageHandle,
    showHideViewerNavigationControls,
    updateOnSortingPages,
    apps,
    clonePage,
    setEditorMarginLeft,
    globalSettingsChanged,
    toggleAppMaintenance,
    app,
    disableEnablePage,
    isMaintenanceOn,
  } = props;

  const staticDataSources = [
    { kind: 'tooljetdb', id: 'null', name: 'Tooljet Database' },
    { kind: 'restapi', id: 'null', name: 'REST API' },
    { kind: 'runjs', id: 'runjs', name: 'Run JavaScript code' },
    { kind: 'runpy', id: 'runpy', name: 'Run Python code' },
  ];
  const dataSources = useDataSources();

  const dataQueries = useDataQueries();
  const prevSelectedSidebarItem = localStorage.getItem('selectedSidebarItem');
  const queryPanelHeight = usePanelHeight();
  const [selectedSidebarItem, setSelectedSidebarItem] = useState(
    dataSources?.length === 0 && prevSelectedSidebarItem === 'datasource' ? 'inspect' : prevSelectedSidebarItem
  );
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDataSourceManagerModal, toggleDataSourceManagerModal] = useState(false);
  const [popoverContentHeight, setPopoverContentHeight] = useState(queryPanelHeight);
  const { isVersionReleased } = useAppVersionStore(
    (state) => ({
      isVersionReleased: state.isVersionReleased,
    }),
    shallow
  );
  const { showComments } = useEditorStore(
    (state) => ({
      showComments: state?.showComments,
      appMode: state?.appMode,
    }),
    shallow
  );
  const [pinned, setPinned] = useState(!!localStorage.getItem('selectedSidebarItem'));

  const { errorLogs, clearErrorLogs, unReadErrorCount, allLog } = useDebugger({
    currentPageId,
    isDebuggerOpen: !!selectedSidebarItem,
  });
  const sideBarBtnRefs = useRef({});

  useEffect(() => {
    setPopoverContentHeight(((window.innerHeight - queryPanelHeight - 45) / window.innerHeight) * 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryPanelHeight]);

  useEffect(() => {
    if (!selectedSidebarItem) {
      setEditorMarginLeft(0);
    } else {
      setEditorMarginLeft(350);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSidebarItem]);

  useImperativeHandle(ref, () => ({
    dataSourceModalToggleStateHandler() {
      toggleDataSourceManagerModal(true);
    },
  }));

  const handleSelectedSidebarItem = (item) => {
    if (item === selectedSidebarItem && !pinned) {
      setSelectedSidebarItem(null);
    } else {
      setSelectedSidebarItem(item);
      pinned && localStorage.setItem('selectedSidebarItem', item);
    }
  };

  const handlePin = (isPin) => {
    isPin
      ? localStorage.setItem('selectedSidebarItem', selectedSidebarItem)
      : localStorage.removeItem('selectedSidebarItem');

    setPinned(isPin);
  };

  const handleInteractOutside = (ev) => {
    const isBtnClicked = Object.values(sideBarBtnRefs.current).some((btnRef) => {
      return btnRef.contains(ev.target);
    });

    if (!isBtnClicked && !pinned) {
      setSelectedSidebarItem(null);
    }
  };

  const setSideBarBtnRefs = (page) => (ref) => {
    sideBarBtnRefs.current[page] = ref;
  };

  const backgroundFxQuery = appDefinition?.globalSettings?.backgroundFxQuery;

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
    const allDs = [...staticDataSources, ...dataSources];
    const source = allDs.find((ds) => ds.kind === query.kind);
    return {
      iconName: query.name,
      jsx: () => <DataSourceIcon source={source} height={16} />,
    };
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
  const getTextInputIcons = (componentExposedVariables) => {
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
  };

  const getCheckboxIcons = (componentExposedVariables) => {
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
  };

  const getButtonIcons = (componentExposedVariables) => {
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
  };

  const getTextIcons = (componentExposedVariables) => {
    if (componentExposedVariables?.visibility) {
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
  };

  const exposedVariablesIcon = Object.entries(currentState['components'])
    .map(([_, value]) => {
      const component = componentDefinitions[value.id]?.component ?? {};
      const componentExposedVariables = value;

      if (!_.isEmpty(component)) {
        switch (component.component) {
          case 'TextInput':
            return getTextInputIcons(componentExposedVariables);
          case 'Checkbox':
            return getCheckboxIcons(componentExposedVariables);
          case 'Button':
            return getButtonIcons(componentExposedVariables);
          case 'Text':
            return getTextIcons(componentExposedVariables);
          default:
            return [];
        }
      }

      return [];
    })
    .flat()
    .filter((value) => value !== undefined); // Remove undefined values

  const iconsList = React.useMemo(
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
    runQuery(query.id, currentNode);
  };

  const copyToClipboard = (data) => {
    const stringified = JSON.stringify(data, null, 2).replace(/\\/g, '');
    navigator.clipboard.writeText(stringified);
    return toast.success('Copied to the clipboard', {
      position: 'top-center',
    });
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
        {
          name: 'Select Widget',
          dispatchAction: handleSelectComponentOnEditor,
          icon: false,
          onSelect: true,
        },
        ...(!isVersionReleased
          ? [
              {
                name: 'Delete Component',
                dispatchAction: handleRemoveComponent,
                icon: true,
                iconName: 'trash',
              },
            ]
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

  const renderPopoverContent = () => {
    if (selectedSidebarItem === null) return null;
    switch (selectedSidebarItem) {
      case 'page':
        return (
          <LeftSidebarPageSelector
            darkMode={darkMode}
            selectedSidebarItem={selectedSidebarItem}
            appDefinition={appDefinition}
            currentPageId={currentPageId}
            addNewPage={addNewPage}
            switchPage={switchPage}
            deletePage={deletePage}
            renamePage={renamePage}
            hidePage={hidePage}
            unHidePage={unHidePage}
            disableEnablePage={disableEnablePage}
            updateHomePage={updateHomePage}
            updatePageHandle={updatePageHandle}
            clonePage={clonePage}
            pages={
              Object.entries(deepClone(appDefinition).pages)
                .map(([id, page]) => ({ id, ...page }))
                .sort((a, b) => a.index - b.index) || []
            }
            homePageId={appDefinition.homePageId}
            showHideViewerNavigationControls={showHideViewerNavigationControls}
            updateOnSortingPages={updateOnSortingPages}
            apps={apps}
            setPinned={handlePin}
            pinned={pinned}
            jsonData={memoizedJSONData}
            iconsList={iconsList}
            actionsList={callbackActions}
            selectedComponent={selectedComponent}
          />
        );
      case 'inspect':
        return (
          <LeftSidebarInspector
            darkMode={darkMode}
            selectedSidebarItem={selectedSidebarItem}
            appDefinition={appDefinition}
            setSelectedComponent={setSelectedComponent}
            removeComponent={removeComponent}
            runQuery={runQuery}
            popoverContentHeight={popoverContentHeight}
            setPinned={handlePin}
            pinned={pinned}
            jsonData={memoizedJSONData}
            iconsList={iconsList}
            actionsList={callbackActions}
            selectedComponent={selectedComponent}
          />
        );
      case 'datasource':
        return (
          <LeftSidebarDataSources
            darkMode={darkMode}
            appId={appId}
            dataSourcesChanged={dataSourcesChanged}
            globalDataSourcesChanged={globalDataSourcesChanged}
            dataQueriesChanged={dataQueriesChanged}
            toggleDataSourceManagerModal={toggleDataSourceManagerModal}
            showDataSourceManagerModal={showDataSourceManagerModal}
            onDeleteofAllDataSources={() => {
              handleSelectedSidebarItem(null);
              handlePin(false);
              delete sideBarBtnRefs.current['datasource'];
            }}
            setPinned={handlePin}
            pinned={pinned}
          />
        );
      case 'debugger':
        return (
          <LeftSidebarDebugger
            darkMode={darkMode}
            errors={errorLogs}
            clearErrorLogs={clearErrorLogs}
            setPinned={handlePin}
            pinned={pinned}
            allLog={allLog}
          />
        );
      case 'settings':
        return (
          <GlobalSettings
            globalSettingsChanged={globalSettingsChanged}
            globalSettings={appDefinition.globalSettings}
            darkMode={darkMode}
            toggleAppMaintenance={toggleAppMaintenance}
            isMaintenanceOn={isMaintenanceOn}
            app={app}
            backgroundFxQuery={backgroundFxQuery}
          />
        );
    }
  };

  return (
    <div className={cx('left-sidebar', { 'dark-theme theme-dark': darkMode })} data-cy="left-sidebar-inspector">
      <LeftSidebarItem
        selectedSidebarItem={selectedSidebarItem}
        onClick={() => handleSelectedSidebarItem('page')}
        icon="page"
        className={`left-sidebar-item left-sidebar-layout left-sidebar-page-selector`}
        tip="Pages"
        ref={setSideBarBtnRefs('page')}
      />

      <LeftSidebarItem
        selectedSidebarItem={selectedSidebarItem}
        onClick={() => handleSelectedSidebarItem('inspect')}
        icon="inspect"
        className={`left-sidebar-item left-sidebar-layout left-sidebar-inspector`}
        tip="Inspector"
        ref={setSideBarBtnRefs('inspect')}
      />

      <LeftSidebarItem
        icon="debugger"
        selectedSidebarItem={selectedSidebarItem}
        // eslint-disable-next-line no-unused-vars
        onClick={(e) => handleSelectedSidebarItem('debugger')}
        className={`left-sidebar-item  left-sidebar-layout`}
        badge={true}
        count={unReadErrorCount.unread}
        tip="Debugger"
        ref={setSideBarBtnRefs('debugger')}
      />
      <LeftSidebarItem
        icon="settings"
        selectedSidebarItem={selectedSidebarItem}
        // eslint-disable-next-line no-unused-vars
        onClick={(e) => handleSelectedSidebarItem('settings')}
        className={`left-sidebar-item  left-sidebar-layout`}
        badge={true}
        tip="Settings"
        ref={setSideBarBtnRefs('settings')}
      />

      {dataSources?.length > 0 && (
        <LeftSidebarItem
          selectedSidebarItem={selectedSidebarItem}
          onClick={() => handleSelectedSidebarItem('datasource')}
          icon="datasource"
          className={`left-sidebar-item left-sidebar-layout sidebar-datasources`}
          tip="Sources"
          ref={setSideBarBtnRefs('datasource')}
        />
      )}

      <Popover
        onInteractOutside={handleInteractOutside}
        open={pinned || !!selectedSidebarItem}
        popoverContentClassName={`p-0 sidebar-h-100-popover ${selectedSidebarItem}`}
        side="right"
        popoverContent={renderPopoverContent()}
        popoverContentHeight={popoverContentHeight}
      />

      <ConfirmDialog
        show={showLeaveDialog}
        message={'The unsaved changes will be lost if you leave the editor, do you want to leave?'}
        onConfirm={() => router.push('/')}
        onCancel={() => setShowLeaveDialog(false)}
        darkMode={darkMode}
      />
      <div className="left-sidebar-stack-bottom">
        <div className="">
          {config.COMMENT_FEATURE_ENABLE && (
            <div
              className={`${isVersionReleased && 'disabled'}`}
              style={{
                maxHeight: '32px',
                maxWidth: '32px',
                marginBottom: '16px',
              }}
            >
              <LeftSidebarComment
                selectedSidebarItem={showComments ? 'comments' : ''}
                currentPageId={currentPageId}
                ref={setSideBarBtnRefs('comments')}
              />
            </div>
          )}

          <DarkModeToggle switchDarkMode={switchDarkMode} darkMode={darkMode} tooltipPlacement="right" />
        </div>
      </div>
    </div>
  );
});
