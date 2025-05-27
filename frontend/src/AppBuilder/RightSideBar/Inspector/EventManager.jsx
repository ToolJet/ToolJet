import React, { useState, useEffect, useContext } from 'react';

import { ActionTypes } from '@/Editor/ActionTypes';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { GotoApp } from './ActionConfigurationPanels/GotoApp';
import { SwitchPage } from './ActionConfigurationPanels/SwitchPage';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import useDraggableInPortal from '@/_hooks/useDraggableInPortal';
import _ from 'lodash';
import { componentTypes } from '@/AppBuilder/WidgetManager';
import Select from '@/_ui/Select';
import defaultStyles from '@/_ui/Select/styles';
import { useTranslation } from 'react-i18next';
import { useDataQueriesStore } from '@/_stores/dataQueriesStore';
import RunjsParameters from './ActionConfigurationPanels/RunjsParamters';
import { useAppDataActions, useAppDataStore } from '@/_stores/appDataStore';
import { isQueryRunnable } from '@/_helpers/utils';
import { shallow } from 'zustand/shallow';
import AddNewButton from '@/ToolJetUI/Buttons/AddNewButton/AddNewButton';
import NoListItem from './Components/Table/NoListItem';
import ManageEventButton from './ManageEventButton';
import { EditorContext } from '@/Editor/Context/EditorContextWrapper';
import CodeHinter from '@/AppBuilder/CodeEditor';
// eslint-disable-next-line import/no-unresolved
import { diff } from 'deep-object-diff';
import { useEditorStore } from '@/_stores/editorStore';
import { handleLowPriorityWork } from '@/_helpers/editorHelpers';
import { appService } from '@/_services';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import useStore from '@/AppBuilder/_stores/store';
import { useEventActions, useEvents } from '@/AppBuilder/_stores/slices/eventsSlice';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import ToggleGroup from '@/ToolJetUI/SwitchGroup/ToggleGroup';
import ToggleGroupItem from '@/ToolJetUI/SwitchGroup/ToggleGroupItem';

export const EventManager = ({
  sourceId,
  eventSourceType,
  eventMetaDefinition,
  excludeEvents,
  popOverCallback,
  popoverPlacement,
  hideEmptyEventsAlert,
  callerQueryId,
  customEventRefs = undefined,
  component,
}) => {
  const { moduleId, isModuleEditor } = useModuleContext();
  const components = useStore((state) => state.getCurrentPageComponents());
  const pages = useStore((state) => _.get(state, 'modules.canvas.pages', []), shallow).filter(
    (page) => !page.disabled && !page.isPageGroup
  );
  const moduleInputDummyQueries = useStore((state) => state.getModuleInputDummyQueries(), shallow);

  const dataQueries = useStore((state) => {
    const queries = state.dataQuery?.queries?.modules?.canvas || [];
    if (callerQueryId) {
      return queries.filter((query) => query.id != callerQueryId);
    }
    return queries;
  });
  const allAppEvents = useEvents();
  const { createAppVersionEventHandlers, deleteAppVersionEventHandler, updateAppVersionEventHandlers } =
    useEventActions();
  const appId = useStore((state) => state.appStore.modules[moduleId].app.appId);

  const eventsUpdatedLoader = useStore((state) => state.eventsSlice.getEventsUpdatedLoader(), shallow);
  const eventsCreatedLoader = useStore((state) => state.eventsSlice.getEventsCreatedLoader(), shallow);
  const actionsUpdatedLoader = useStore((state) => state.eventsSlice.getActionsUpdatedLoader(), shallow);
  const eventToDeleteLoaderIndex = useStore((state) => state.eventsSlice.getEventToDeleteLoaderIndex(), shallow);

  const { handleYmapEventUpdates } = useContext(EditorContext) || {};

  const { updateState } = useAppDataActions();

  const currentEvents = allAppEvents?.filter((event) => {
    if (customEventRefs) {
      if (event.event.ref !== customEventRefs.ref) {
        return false;
      }
    }

    return event.sourceId === sourceId && event.target === eventSourceType;
  });

  const [events, setEvents] = useState([]);
  const [focusedEventIndex, setFocusedEventIndex] = useState(null);

  const { t } = useTranslation();

  useEffect(() => {
    handleYmapEventUpdates && handleYmapEventUpdates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify({ allAppEvents })]);

  useEffect(() => {
    if (_.isEqual(currentEvents, events)) return;

    const sortedEvents = currentEvents.sort((a, b) => {
      return a.index - b.index;
    });

    setEvents(sortedEvents || [], moduleId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(currentEvents), moduleId]);

  let actionOptions = ActionTypes.map((action) => {
    return { name: action.name, value: action.id };
  });

  let checkIfClicksAreInsideOf = document.querySelector('.cm-completionListIncompleteBottom');
  // Listen for click events on body
  if (checkIfClicksAreInsideOf) {
    document.body.addEventListener('mousedown', function (event) {
      if (checkIfClicksAreInsideOf.contains(event.target)) {
        event.stopPropagation();
      }
    });
  }

  const darkMode = localStorage.getItem('darkMode') === 'true';
  const styles = {
    ...defaultStyles(darkMode),
    menuPortal: (provided) => ({ ...provided, zIndex: 9999 }),
    menuList: (base) => ({
      ...base,
    }),
  };

  const actionLookup = Object.fromEntries(ActionTypes.map((actionType) => [actionType.id, actionType]));

  let alertTypes = [
    {
      name: 'Info',
      id: 'info',
    },
    {
      name: 'Success',
      id: 'success',
    },
    {
      name: 'Warning',
      id: 'warning',
    },
    {
      name: 'Error',
      id: 'error',
    },
  ];

  let alertOptions = alertTypes.map((alert) => {
    return { name: alert.name, value: alert.id };
  });

  excludeEvents = excludeEvents || [];

  /* Filter events based on excludesEvents ( a list of event ids to exclude ) */
  let possibleEvents = Object.keys(eventMetaDefinition.events)
    .filter((eventId) => !excludeEvents.includes(eventId))
    .map((eventId) => {
      return {
        name: eventMetaDefinition?.events[eventId]?.displayName,
        value: eventId,
      };
    });

  function getComponentOptions(componentType = '') {
    let componentOptions = [];
    Object.keys(components || {}).forEach((key) => {
      if (componentType === '' || components[key].component.component === componentType) {
        componentOptions.push({
          name: components[key].component.name,
          value: key,
        });
      }
    });
    return componentOptions;
  }

  function getComponentOptionsOfComponentsWithActions(componentType = '') {
    let componentOptions = [];
    Object.keys(components || {}).forEach((key) => {
      const targetComponentMeta = componentTypes.find(
        (componentType) => components[key].component.component === componentType.component
      );
      if ((targetComponentMeta?.actions?.length ?? 0) > 0) {
        if (componentType === '' || components[key].component.component === componentType) {
          componentOptions.push({
            name: components[key].component.name,
            value: key,
          });
        }
      }
    });
    return componentOptions;
  }

  function getComponentActionOptions(componentId) {
    if (componentId == undefined) return [];
    const filteredComponents = Object.entries(components ?? {}).filter(([key, _value]) => key === componentId);
    if (_.isEmpty(filteredComponents)) return [];
    const component = filteredComponents[0][1];
    const targetComponentMeta = componentTypes.find(
      (componentType) => component.component.component === componentType.component
    );
    const actions = targetComponentMeta.actions;

    const options = actions.map((action) => ({
      name: action?.displayName,
      value: action.handle,
    }));

    return options;
  }

  function getAction(componentId, actionHandle) {
    if (componentId == undefined || actionHandle == undefined) return {};
    const filteredComponents = Object.entries(components ?? {}).filter(([key, _value]) => key === componentId);
    if (_.isEmpty(filteredComponents)) return {};
    const component = filteredComponents[0][1];
    const targetComponentMeta = componentTypes.find(
      (componentType) => component.component.component === componentType.component
    );
    const actions = targetComponentMeta.actions;
    return actions.find((action) => action.handle === actionHandle);
  }

  function getComponentActionDefaultParams(componentId, actionHandle) {
    const action = getAction(componentId, actionHandle);
    const defaultParams = (action?.params ?? []).map((param) => ({
      handle: param.handle,
      value: param.defaultValue,
    }));
    return defaultParams;
  }

  const fetchApps = async (page) => {
    const { apps } = await appService.getAll(page);

    updateState({
      apps: apps.map((app) => ({
        id: app.id,
        name: app.name,
        slug: app.slug,
        current_version_id: app.current_version_id,
      })),
    });

    return apps;
  };

  async function getAllApps() {
    const apps = await fetchApps(0);
    let appsOptionsList = [];
    apps
      .filter((item) => item.slug !== undefined && item.id !== appId && item.current_version_id)
      .forEach((item) => {
        appsOptionsList.push({
          name: item.name,
          value: item.slug,
        });
      });
    return appsOptionsList;
  }

  function getPageOptions(event) {
    // If disabled page is already selected then don't remove from page options

    if (!Array.isArray(pages) || pages.length === 0) return [];

    if (pages.find((page) => page.id === event.pageId)?.disabled) {
      return pages.map((page) => ({
        name: page.name,
        value: page.id,
      }));
    }
    return pages
      .filter((page) => !page.disabled)
      .map((page) => ({
        name: page.name,
        value: page.id,
      }));
  }

  function handleQueryChange(index, updates) {
    let newEvents = deepClone(events);
    let updatedEvent = newEvents[index];

    updatedEvent.event = {
      ...updatedEvent.event,
      ...updates,
    };

    newEvents[index] = updatedEvent;

    updateAppVersionEventHandlers(
      [
        {
          event_id: updatedEvent.id,
          diff: updatedEvent,
        },
      ],
      'update'
    );
  }

  function handlerChanged(index, param, value) {
    let newEvents = deepClone(events);
    let updatedEvent = newEvents[index];
    updatedEvent.event[param] = value;

    // Remove debounce key if it's empty
    if (param === 'debounce' && value === '') {
      delete updatedEvent.event.debounce;
    }

    if (param === 'componentSpecificActionHandle') {
      const getDefault = getComponentActionDefaultParams(updatedEvent.event?.componentId, value);
      updatedEvent.event['componentSpecificActionParams'] = getDefault;
    }

    const shouldUpdateEvent = !_.isEmpty(diff(events[index], updatedEvent));

    if (!shouldUpdateEvent) return;

    const eventSourceid = updatedEvent?.sourceId;

    // useEditorStore.getState().actions.updateComponentsNeedsUpdateOnNextRender([eventSourceid]);
    newEvents[index] = updatedEvent;

    handleLowPriorityWork(() => {
      updateAppVersionEventHandlers(
        [
          {
            event_id: updatedEvent.id,
            diff: updatedEvent,
          },
        ],
        'update',
        param
      );
    });
  }

  function removeHandler(index) {
    const eventsHandler = deepClone(events);
    const eventId = eventsHandler[index].id;
    deleteAppVersionEventHandler(eventId, index);
  }

  function addHandler() {
    let newEvents = events;
    const eventIndex = newEvents.length;
    createAppVersionEventHandlers({
      event: {
        eventId: Object.keys(eventMetaDefinition?.events)[0],
        actionId: 'show-alert',
        message: 'Hello world!',
        alertType: 'info',
        component: eventMetaDefinition.name,
        ...customEventRefs,
      },
      eventType: eventSourceType,
      attachedTo: sourceId,
      index: eventIndex,
    });

    handleYmapEventUpdates();
  }

  //following two are functions responsible for on change and value for the control specific actions
  const onChangeHandlerForComponentSpecificActionHandle = (value, index, param, event) => {
    const newParam = { ...param, value: value };
    const params = event?.componentSpecificActionParams ?? [];

    const newParams =
      params.length > 0
        ? params.map((paramOfParamList) => {
            return paramOfParamList.handle === param.handle ? newParam : paramOfParamList;
          })
        : [newParam];

    return handlerChanged(index, 'componentSpecificActionParams', newParams);
  };
  const valueForComponentSpecificActionHandle = (event, param) => {
    const componentSpecificActionParamsExits = Array.isArray(event?.componentSpecificActionParams);
    const defaultValue = param.defaultValue ?? '';

    if (componentSpecificActionParamsExits) {
      const paramValue =
        event?.componentSpecificActionParams?.find((paramItem) => paramItem.handle === param.handle)?.value ??
        defaultValue;

      return paramValue;
    }

    return defaultValue;
  };

  const constructDataQueryOptions = () => {
    const queries = dataQueries.filter((qry) => isQueryRunnable(qry)).map((qry) => ({ name: qry.name, value: qry.id }));
    const moduleInputs = Object.entries(moduleInputDummyQueries).map(([key, value]) => ({ name: value, value: key }));
    return [...moduleInputs, ...queries];
  };

  function eventPopover(event, index) {
    return (
      <Popover
        id="popover-basic"
        style={{ width: '350px', maxWidth: '350px' }}
        className={`${darkMode && 'dark-theme'} shadow`}
        data-cy="popover-card"
      >
        <Popover.Body
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div className="row">
            <div className="col-3 p-2">
              <span data-cy="event-label">{t('editor.inspector.eventManager.event', 'Event')}</span>
            </div>
            <div className="col-9" data-cy="event-selection">
              <Select
                className={`${darkMode ? 'select-search-dark' : 'select-search'} w-100`}
                options={possibleEvents}
                value={event.eventId}
                search={false}
                onChange={(value) => handlerChanged(index, 'eventId', value)}
                placeholder={t('globals.select', 'Select') + '...'}
                styles={styles}
                useMenuPortal={false}
                useCustomStyles={true}
              />
            </div>
          </div>
          <div className="row mt-3">
            <div className="col-3 p-2">
              <span data-cy="action-label">{t('editor.inspector.eventManager.action', 'Action')}</span>
            </div>
            <div className="col-9 popover-action-select-search" data-cy="action-selection">
              <Select
                className={`${darkMode ? 'select-search-dark' : 'select-search'} w-100`}
                options={actionOptions}
                value={event.actionId}
                search={false}
                onChange={(value) => handlerChanged(index, 'actionId', value)}
                placeholder={t('globals.select', 'Select') + '...'}
                styles={styles}
                useMenuPortal={false}
                useCustomStyles={true}
              />
            </div>
          </div>

          <div className="row mt-3">
            <div className="col-3 p-2" data-cy="alert-type-label">
              {t('editor.inspector.eventManager.runOnlyIf', 'Run Only If')}
            </div>
            <div className="col-9">
              <CodeHinter
                type="basic"
                initialValue={event.runOnlyIf}
                onChange={(value) => handlerChanged(index, 'runOnlyIf', value)}
                usePortalEditor={false}
                component={component}
                cyLabel={`run-only-if`}
              />
            </div>
          </div>

          {actionLookup[event.actionId]?.options?.length > 0 && (
            <div className="hr-text" data-cy="action-option">
              {t('editor.inspector.eventManager.actionOptions', 'Action options')}
            </div>
          )}
          <div>
            {event.actionId === 'show-alert' && (
              <>
                <div className="row">
                  <div className="col-3 p-2" data-cy="message-label">
                    {t('editor.inspector.eventManager.message', 'Message')}
                  </div>
                  <div className="col-9" data-cy="alert-message-input-field">
                    <CodeHinter
                      type="basic"
                      theme={darkMode ? 'monokai' : 'default'}
                      initialValue={event.message}
                      onChange={(value) => handlerChanged(index, 'message', value)}
                      usePortalEditor={false}
                      component={component}
                    />
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-3 p-2" data-cy="alert-type-label">
                    {t('editor.inspector.eventManager.alertType', 'Alert Type')}
                  </div>
                  <div className="col-9" data-cy="alert-message-type">
                    <Select
                      className={`${darkMode ? 'select-search-dark' : 'select-search'} w-100 w-100`}
                      options={alertOptions}
                      value={event.alertType}
                      search={false}
                      onChange={(value) => handlerChanged(index, 'alertType', value)}
                      placeholder={t('globals.select', 'Select') + '...'}
                      styles={styles}
                      useMenuPortal={false}
                      useCustomStyles={true}
                    />
                  </div>
                </div>
              </>
            )}

            {event.actionId === 'open-webpage' && (
              <div>
                <label className="form-label mt-1">{t('editor.inspector.eventManager.url', 'URL')}</label>
                <CodeHinter
                  type="basic"
                  initialValue={event.url}
                  onChange={(value) => handlerChanged(index, 'url', value)}
                  usePortalEditor={false}
                  component={component}
                />
                <div className="d-flex align-items-center justify-content-between mt-3">
                  <label className="form-label mt-1">Open in</label>
                  <ToggleGroup
                    onValueChange={(_value) => handlerChanged(index, 'windowTarget', _value)}
                    defaultValue={event?.windowTarget || 'newTab'}
                    style={{ width: '74%' }}
                  >
                    <ToggleGroupItem value="newTab">New tab</ToggleGroupItem>
                    <ToggleGroupItem value="currentTab">Current tab</ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>
            )}

            {event.actionId === 'go-to-app' && (
              <GotoApp
                event={deepClone(event)}
                handlerChanged={handlerChanged}
                eventIndex={index}
                getAllApps={getAllApps}
                darkMode={darkMode}
              />
            )}

            {event.actionId === 'show-modal' && (
              <div className="row">
                <div className="col-3 p-2">{t('editor.inspector.eventManager.modal', 'Modal')}</div>
                <div className="col-9">
                  <Select
                    className={`${darkMode ? 'select-search-dark' : 'select-search'} w-100`}
                    options={getComponentOptions('Modal')}
                    value={event.modal?.id ?? event.modal}
                    search={true}
                    onChange={(value) => {
                      handlerChanged(index, 'modal', value);
                    }}
                    placeholder={t('globals.select', 'Select') + '...'}
                    styles={styles}
                    useMenuPortal={false}
                    useCustomStyles={true}
                  />
                </div>
              </div>
            )}

            {event.actionId === 'close-modal' && (
              <div className="row">
                <div className="col-3 p-2">{t('editor.inspector.eventManager.modal', 'Modal')}</div>
                <div className="col-9">
                  <Select
                    className={`${darkMode ? 'select-search-dark' : 'select-search'} w-100`}
                    options={getComponentOptions('Modal')}
                    value={event.modal?.id ?? event.modal}
                    search={true}
                    onChange={(value) => {
                      handlerChanged(index, 'modal', value);
                    }}
                    placeholder={t('globals.select', 'Select') + '...'}
                    styles={styles}
                    useMenuPortal={false}
                    useCustomStyles={true}
                  />
                </div>
              </div>
            )}

            {event.actionId === 'copy-to-clipboard' && (
              <div className="p-1">
                <label className="form-label mt-1">{t('editor.inspector.eventManager.text', 'Text')}</label>
                <CodeHinter
                  type="basic"
                  initialValue={event.contentToCopy}
                  onChange={(value) => handlerChanged(index, 'contentToCopy', value)}
                  usePortalEditor={false}
                  component={component}
                />
              </div>
            )}

            {event.actionId === 'run-query' && (
              <>
                <div className="row">
                  <div className="col-3 p-2">{t('editor.inspector.eventManager.query', 'Query')}</div>
                  <div className="col-9" data-cy="query-selection-field">
                    <Select
                      className={`${darkMode ? 'select-search-dark' : 'select-search'} w-100`}
                      options={constructDataQueryOptions()}
                      value={event?.queryId}
                      search={true}
                      onChange={(value) => {
                        const query = dataQueries.find((dataquery) => dataquery.id === value);

                        // If it is a module editor and the query is not found in the data queries, then it is a module input dummy query
                        if (isModuleEditor && query === undefined) {
                          handleQueryChange(index, {
                            queryId: value,
                            queryName: moduleInputDummyQueries[value],
                            parameters: {},
                          });
                        } else {
                          const parameters = (query?.options?.parameters ?? []).reduce(
                            (paramObj, param) => ({
                              ...paramObj,
                              [param.name]: param.defaultValue,
                            }),
                            {}
                          );

                          handleQueryChange(index, {
                            queryId: query.id,
                            queryName: query.name,
                            parameters: parameters,
                          });
                        }
                      }}
                      placeholder={t('globals.select', 'Select') + '...'}
                      styles={styles}
                      useMenuPortal={false}
                      useCustomStyles={true}
                    />
                  </div>
                </div>
                <RunjsParameters event={event} darkMode={darkMode} index={index} handlerChanged={handlerChanged} />
              </>
            )}

            {event.actionId === 'set-localstorage-value' && (
              <>
                <div className="row">
                  <div className="col-3 p-2">{t('editor.inspector.eventManager.key', 'Key')}</div>
                  <div className="col-9">
                    <CodeHinter
                      type="basic"
                      initialValue={event.key}
                      onChange={(value) => handlerChanged(index, 'key', value)}
                      usePortalEditor={false}
                      component={component}
                    />
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-3 p-2">{t('editor.inspector.eventManager.value', 'Value')}</div>
                  <div className="col-9">
                    <CodeHinter
                      type="basic"
                      initialValue={event.value}
                      onChange={(value) => handlerChanged(index, 'value', value)}
                      usePortalEditor={false}
                      component={component}
                    />
                  </div>
                </div>
              </>
            )}
            {event.actionId === 'generate-file' && (
              <>
                <div className="row">
                  <div className="col-3 p-2">{t('editor.inspector.eventManager.type', 'Type')}</div>
                  <div className="col-9">
                    <Select
                      className={`${darkMode ? 'select-search-dark' : 'select-search'} w-100`}
                      options={[
                        { name: 'CSV', value: 'csv' },
                        { name: 'Text', value: 'plaintext' },
                        { name: 'PDF', value: 'pdf' },
                      ]}
                      value={event.fileType ?? 'csv'}
                      search={true}
                      onChange={(value) => {
                        handlerChanged(index, 'fileType', value);
                      }}
                      placeholder={t('globals.select', 'Select') + '...'}
                      styles={styles}
                      useMenuPortal={false}
                      useCustomStyles={true}
                    />
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-3 p-2">{t('editor.inspector.eventManager.fileName', 'File name')}</div>
                  <div className="col-9">
                    <CodeHinter
                      type="basic"
                      initialValue={event.fileName}
                      onChange={(value) => handlerChanged(index, 'fileName', value)}
                      component={component}
                    />
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-3 p-2">{t('editor.inspector.eventManager.data', 'Data')}</div>
                  <div className="col-9">
                    <CodeHinter
                      type="basic"
                      initialValue={event.data}
                      onChange={(value) => handlerChanged(index, 'data', value)}
                      component={component}
                    />
                  </div>
                </div>
              </>
            )}
            {event.actionId === 'set-table-page' && (
              <>
                <div className="row">
                  <div className="col-3 p-2">{t('editor.inspector.eventManager.table', 'Table')}</div>
                  <div className="col-9">
                    <Select
                      className={`${darkMode ? 'select-search-dark' : 'select-search'} w-100`}
                      options={getComponentOptions('Table')}
                      value={event.table}
                      search={true}
                      onChange={(value) => {
                        handlerChanged(index, 'table', value);
                      }}
                      placeholder={t('globals.select', 'Select') + '...'}
                      styles={styles}
                      useMenuPortal={false}
                      useCustomStyles={true}
                    />
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-3 p-2">{t('editor.inspector.eventManager.pageIndex', 'Page index')}</div>
                  <div className="col-9">
                    <CodeHinter
                      type="basic"
                      initialValue={event.pageIndex ?? '{{1}}'}
                      onChange={(value) => handlerChanged(index, 'pageIndex', value)}
                      usePortalEditor={false}
                      component={component}
                    />
                  </div>
                </div>
              </>
            )}
            {event.actionId === 'set-custom-variable' && (
              <>
                <div className="row">
                  <div className="col-3 p-2">{t('editor.inspector.eventManager.key', 'Key')}</div>
                  <div className="col-9">
                    <CodeHinter
                      type="basic"
                      initialValue={event.key}
                      onChange={(value) => handlerChanged(index, 'key', value)}
                      enablePreview={true}
                      cyLabel={`event-key`}
                      component={component}
                    />
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-3 p-2">{t('editor.inspector.eventManager.value', 'Value')}</div>
                  <div className="col-9">
                    <CodeHinter
                      type="basic"
                      initialValue={event.value}
                      onChange={(value) => handlerChanged(index, 'value', value)}
                      cyLabel={`variable`}
                      component={component}
                    />
                  </div>
                </div>
              </>
            )}
            {event.actionId === 'unset-custom-variable' && (
              <>
                <div className="row">
                  <div className="col-3 p-2">{t('editor.inspector.eventManager.key', 'Key')}</div>
                  <div className="col-9">
                    <CodeHinter
                      type="basic"
                      initialValue={event.key}
                      onChange={(value) => handlerChanged(index, 'key', value)}
                      component={component}
                    />
                  </div>
                </div>
              </>
            )}
            {event.actionId === 'set-page-variable' && (
              <>
                <div className="row">
                  <div className="col-3 p-2">{t('editor.inspector.eventManager.key', 'Key')}</div>
                  <div className="col-9">
                    <CodeHinter
                      type="basic"
                      initialValue={event.key}
                      onChange={(value) => handlerChanged(index, 'key', value)}
                      cyLabel={`key`}
                      component={component}
                    />
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-3 p-2">{t('editor.inspector.eventManager.value', 'Value')}</div>
                  <div className="col-9">
                    <CodeHinter
                      type="basic"
                      initialValue={event.value}
                      onChange={(value) => handlerChanged(index, 'value', value)}
                      cyLabel={`variable`}
                      component={component}
                    />
                  </div>
                </div>
              </>
            )}
            {event.actionId === 'unset-page-variable' && (
              <>
                <div className="row">
                  <div className="col-3 p-2">{t('editor.inspector.eventManager.key', 'Key')}</div>
                  <div className="col-9">
                    <CodeHinter
                      type="basic"
                      initialValue={event.key}
                      onChange={(value) => handlerChanged(index, 'key', value)}
                      cyLabel={`key`}
                      component={component}
                    />
                  </div>
                </div>
              </>
            )}
            {event.actionId === 'switch-page' && (
              <SwitchPage
                event={deepClone(event)}
                handlerChanged={handlerChanged}
                eventIndex={index}
                getPages={() => getPageOptions(event)}
                darkMode={darkMode}
              />
            )}
            {event.actionId === 'control-component' && (
              <>
                <div className="row">
                  <div className="col-3 p-1" data-cy="action-options-component-field-label">
                    {t('editor.inspector.eventManager.component', 'Component')}
                  </div>
                  <div className="col-9" data-cy="action-options-component-selection-field">
                    <Select
                      className={`${darkMode ? 'select-search-dark' : 'select-search'} w-100`}
                      options={getComponentOptionsOfComponentsWithActions()}
                      value={event?.componentId}
                      search={true}
                      onChange={(value) => {
                        handlerChanged(index, 'componentId', value);
                      }}
                      placeholder={t('globals.select', 'Select') + '...'}
                      styles={styles}
                      useMenuPortal={false}
                      useCustomStyles={true}
                    />
                  </div>
                </div>
                <div className="row mt-2">
                  <div className="col-3 p-1" data-cy="action-options-action-field-label">
                    {t('editor.inspector.eventManager.action', 'Action')}
                  </div>
                  <div className="col-9" data-cy="action-options-action-selection-field">
                    <Select
                      className={`${darkMode ? 'select-search-dark' : 'select-search'} w-100`}
                      options={getComponentActionOptions(event?.componentId)}
                      value={event?.componentSpecificActionHandle}
                      search={true}
                      onChange={(value) => {
                        handlerChanged(index, 'componentSpecificActionHandle', value);
                      }}
                      placeholder={t('globals.select', 'Select') + '...'}
                      styles={styles}
                      useMenuPortal={false}
                      useCustomStyles={true}
                    />
                  </div>
                </div>
                {event?.componentId &&
                  event?.componentSpecificActionHandle &&
                  (getAction(event?.componentId, event?.componentSpecificActionHandle)?.params ?? []).map((param) => (
                    <div className="row mt-2" key={param.handle}>
                      <div className="col-3 p-1" data-cy={`action-options-${param?.displayName}-field-label`}>
                        {param?.displayName}
                      </div>
                      {param.type === 'select' ? (
                        <div className="col-9" data-cy="action-options-action-selection-field">
                          <Select
                            className={`${darkMode ? 'select-search-dark' : 'select-search'} w-100`}
                            options={param.options}
                            value={valueForComponentSpecificActionHandle(event, param)}
                            search={true}
                            onChange={(value) => {
                              onChangeHandlerForComponentSpecificActionHandle(value, index, param, event);
                            }}
                            placeholder={t('globals.select', 'Select') + '...'}
                            styles={styles}
                            useMenuPortal={false}
                            useCustomStyles={true}
                          />
                        </div>
                      ) : (
                        <div
                          className={`${
                            param?.type ? '' : 'fx-container-eventmanager-code'
                          } col-9 fx-container-eventmanager ${param.type == 'select' && 'component-action-select'}`}
                          data-cy="action-options-text-input-field"
                        >
                          <CodeHinter
                            type="fxEditor"
                            initialValue={valueForComponentSpecificActionHandle(event, param)}
                            onChange={(value) => {
                              onChangeHandlerForComponentSpecificActionHandle(value, index, param, event);
                            }}
                            paramLabel={' '}
                            paramType={param?.type}
                            fieldMeta={{ options: param?.options }}
                            cyLabel={`event-${param.displayName}`}
                            component={component}
                            isEventManagerParam={true}
                          />
                        </div>
                      )}
                    </div>
                  ))}
              </>
            )}
            <div className="row mt-3">
              <div className="col-3 p-2">{t('editor.inspector.eventManager.debounce', 'Debounce')}</div>
              <div className="col-9">
                <CodeHinter
                  type="basic"
                  initialValue={event.debounce}
                  onChange={(value) => handlerChanged(index, 'debounce', value)}
                  usePortalEditor={false}
                  component={component}
                  cyLabel={'debounce'}
                />
              </div>
            </div>
          </div>
        </Popover.Body>
      </Popover>
    );
  }

  const reorderEvents = (startIndex, endIndex) => {
    const result = deepClone(events);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    const reorderedEvents = result.map((event, index) => {
      return {
        ...event,
        index: index,
      };
    });

    updateAppVersionEventHandlers(
      reorderedEvents.map((event) => ({
        event_id: event.id,
        diff: event,
      })),
      'reorder'
    );
  };

  const onDragEnd = ({ source, destination }) => {
    if (!destination || source?.index === destination?.index) {
      return;
    }
    reorderEvents(source.index, destination.index);
  };

  const renderDraggable = useDraggableInPortal();
  const renderHandlers = (events) => {
    return (
      <DragDropContext
        onDragEnd={(result) => {
          onDragEnd(result);
        }}
        className="w-100"
      >
        <Droppable droppableId="droppable">
          {({ innerRef, droppableProps, placeholder }) => (
            <div {...droppableProps} ref={innerRef}>
              {events.map((event, index) => {
                const actionMeta = ActionTypes.find((action) => action.id === event.event.actionId);
                // const rowClassName = `card-body p-0 ${focusedEventIndex === index ? ' bg-azure-lt' : ''}`;
                return (
                  <Draggable key={index} draggableId={`${event.eventId}-${index}`} index={index}>
                    {renderDraggable((provided, snapshot) => {
                      if (snapshot.isDragging && focusedEventIndex !== null) {
                        setFocusedEventIndex(null);
                        document.body.click(); // Hack: Close overlay while dragging
                      }
                      return (
                        <OverlayTrigger
                          trigger="click"
                          placement={popoverPlacement || 'left'}
                          rootClose={true}
                          overlay={eventPopover(event.event, index)}
                          onHide={() => setFocusedEventIndex(null)}
                          onToggle={(showing) => {
                            if (showing) {
                              setFocusedEventIndex(index);
                            } else {
                              setFocusedEventIndex(null);
                            }
                            if (typeof popOverCallback === 'function') popOverCallback(showing);
                          }}
                        >
                          <div
                            key={index}
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <ManageEventButton
                              eventDisplayName={eventMetaDefinition?.events[event.event.eventId]?.displayName}
                              actionName={actionMeta.name}
                              removeHandler={removeHandler}
                              index={index}
                              darkMode={darkMode}
                              actionsUpdatedLoader={index === focusedEventIndex ? actionsUpdatedLoader : false}
                              eventsUpdatedLoader={index === focusedEventIndex ? eventsUpdatedLoader : false}
                              eventsDeletedLoader={
                                index === eventToDeleteLoaderIndex
                                  ? eventToDeleteLoaderIndex === 0
                                    ? true
                                    : !!eventToDeleteLoaderIndex
                                  : false
                              }
                            />
                          </div>
                        </OverlayTrigger>
                      );
                    })}
                  </Draggable>
                );
              })}
              {placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    );
  };

  const renderAddHandlerBtn = () => {
    return (
      <AddNewButton onClick={addHandler} dataCy="add-event-handler" isLoading={eventsCreatedLoader}>
        {t('editor.inspector.eventManager.addHandler', 'New event handler')}
      </AddNewButton>
    );
  };

  if (events.length === 0) {
    return (
      <>
        {!hideEmptyEventsAlert && <NoListItem text={'No event handlers'} />}
        <div className="d-flex">{renderAddHandlerBtn()}</div>
      </>
    );
  }

  const componentName = eventMetaDefinition?.name ? eventMetaDefinition.name : 'query';

  if (events.length === 0) {
    return (
      <div className="d-flex">
        {renderAddHandlerBtn()}
        {!hideEmptyEventsAlert ? (
          <div className="text-left">
            <small className="color-disabled" data-cy="no-event-handler-message">
              {t(
                'editor.inspector.eventManager.emptyMessage',
                "This {{componentName}} doesn't have any event handlers",
                {
                  componentName: componentName.toLowerCase(),
                }
              )}
            </small>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <>
      {renderHandlers(events)}
      {renderAddHandlerBtn()}
    </>
  );
};
