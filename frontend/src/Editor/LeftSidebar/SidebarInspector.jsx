import React, { useMemo } from 'react';
import usePinnedPopover from '@/_hooks/usePinnedPopover';
import { LeftSidebarItem } from './SidebarItem';
import { SidebarPinnedButton } from './SidebarPinnedButton';
import JSONTreeViewer from '@/_ui/JSONTreeViewer';
import _ from 'lodash';
import RunjsIcon from '../Icons/runjs.svg';
import RunpyIcon from '../Icons/runpy.svg';
import { toast } from 'react-hot-toast';
import { getSvgIcon } from '@/_helpers/appUtils';

export const LeftSidebarInspector = ({
  darkMode,
  currentState,
  appDefinition,
  setSelectedComponent,
  removeComponent,
  runQuery,
  dataSources,
}) => {
  const [open, trigger, content, popoverPinned, updatePopoverPinnedState] = usePinnedPopover(false);

  const componentDefinitions = JSON.parse(JSON.stringify(appDefinition))['components'];
  const queryDefinitions = appDefinition['queries'];
  const selectedComponent = React.useMemo(() => {
    return {
      id: appDefinition['selectedComponent']?.id,
      component: appDefinition['selectedComponent']?.component?.name,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appDefinition['selectedComponent']]);

  const queries = {};

  if (!_.isEmpty(queryDefinitions)) {
    queryDefinitions.forEach((query) => {
      queries[query.name] = { id: query.id };
    });
  }

  const memoizedJSONData = React.useMemo(() => {
    const data = _.merge(currentState, { queries });
    const jsontreeData = { ...data };
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
  }, [currentState]);

  const queryIcons = Object.entries(currentState['queries']).map(([key, value]) => {
    if (value.kind === 'runjs') {
      return { iconName: key, jsx: () => <RunjsIcon style={{ height: 16, width: 16, marginRight: 12 }} /> };
    }

    if (value.kind === 'runpy') {
      return { iconName: key, jsx: () => <RunpyIcon style={{ height: 16, width: 16, marginRight: 12 }} /> };
    }
    const icon = dataSources.find((ds) => ds.kind === value.kind);
    const iconFile = icon?.plugin?.icon_file?.data ?? undefined;
    const Icon = () => getSvgIcon(icon?.kind, 25, 25, iconFile ?? undefined);
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
    const stringified = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(stringified);
    return toast.success('Copied to the clipboard', { position: 'top-center' });
  };

  const updatePinnedParentState = () => {
    if (!popoverPinned) {
      updatePopoverPinnedState();
    }
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
        { name: 'Delete Widget', dispatchAction: handleRemoveComponent, icon: true, iconName: 'trash' },
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
    <>
      <LeftSidebarItem
        tip="Inspector"
        {...trigger}
        icon="inspect"
        className={`left-sidebar-item left-sidebar-layout ${open && 'active'} left-sidebar-inspector`}
        text={'Inspector'}
      />
      <div
        {...content}
        className={`card popover left-sidebar-inspector ${open || popoverPinned ? 'show' : 'hide'}`}
        style={{ resize: 'horizontal', maxWidth: '60%', minWidth: '422px' }}
      >
        <SidebarPinnedButton
          darkMode={darkMode}
          component={'Inspector'}
          state={popoverPinned}
          updateState={updatePopoverPinnedState}
        />
        <div style={{ marginTop: '1rem' }} className="card-body">
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
            parentPopoverState={popoverPinned}
            updateParentState={updatePinnedParentState}
          />
        </div>
      </div>
    </>
  );
};
