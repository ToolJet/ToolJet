import React, { useState, useEffect } from 'react';
import { ActionTypes } from '../ActionTypes';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { CodeHinter } from '../CodeBuilder/CodeHinter';
import { GotoApp } from './ActionConfigurationPanels/GotoApp';
import { SwitchPage } from './ActionConfigurationPanels/SwitchPage';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import useDraggableInPortal from '@/_hooks/useDraggableInPortal';
import _ from 'lodash';
import { componentTypes } from '../WidgetManager/components';
import Select from '@/_ui/Select';
import defaultStyles from '@/_ui/Select/styles';
import { useTranslation } from 'react-i18next';
import { useDataQueriesStore } from '@/_stores/dataQueriesStore';
import RunjsParameters from './ActionConfigurationPanels/RunjsParamters';
import AddNewButton from '@/ToolJetUI/Buttons/AddNewButton/AddNewButton';
import { isQueryRunnable } from '@/_helpers/utils';
import { shallow } from 'zustand/shallow';
import ManageEventButton from './ManageEventButton';
import NoListItem from './Components/Table/NoListItem';

export const EventManager = ({
  component,
  componentMeta,
  currentState = {},
  components,
  eventsChanged,
  apps,
  excludeEvents,
  popOverCallback,
  popoverPlacement,
  pages,
  hideEmptyEventsAlert,
  callerQueryId,
}) => {
  const dataQueries = useDataQueriesStore(({ dataQueries = [] }) => {
    if (callerQueryId) {
      //filter the same query getting attached to itself
      return dataQueries.filter((query) => query.id != callerQueryId);
    }
    return dataQueries;
  }, shallow);
  const [events, setEvents] = useState(() => component.component.definition.events || []);
  const [focusedEventIndex, setFocusedEventIndex] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    setEvents(component.component.definition.events || []);
  }, [component?.component?.definition?.events]);

  let actionOptions = ActionTypes.map((action) => {
    return { name: action.name, value: action.id };
  });

  let checkIfClicksAreInsideOf = document.querySelector('#cm-complete-0');
  // Listen for click events on body
  if (checkIfClicksAreInsideOf) {
    document.body.addEventListener('click', function (event) {
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
  let possibleEvents = Object.keys(componentMeta.events)
    .filter((eventId) => !excludeEvents.includes(eventId))
    .map((eventId) => {
      return {
        name: componentMeta.events[eventId].displayName,
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
  // currently blocking items inside subcontainer because they can't be controlled through event manager
  // use components instead of currentState?.components to get all the components in canvas
  function getComponentOptionsOfComponentsWithActions(componentType = '') {
    let componentOptions = [];
    Object.values(currentState?.components || {}).forEach((value) => {
      const targetComponentMeta = componentTypes.find(
        (componentType) => components[value.id].component.component === componentType.component
      );
      if ((targetComponentMeta?.actions?.length ?? 0) > 0) {
        if (componentType === '' || components[value.id].component.component === componentType) {
          componentOptions.push({
            name: components[value.id].component.name,
            value: value.id,
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
      name: action.displayName,
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
    const defaultParams = (action.params ?? []).map((param) => ({
      handle: param.handle,
      value: param.defaultValue,
    }));
    return defaultParams;
  }

  function getAllApps() {
    let appsOptionsList = [];
    apps
      .filter((item) => item.slug !== undefined)
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

  function handlerChanged(index, param, value) {
    let newEvents = [...events];

    let updatedEvent = newEvents[index];
    updatedEvent[param] = value;

    newEvents[index] = updatedEvent;

    setEvents(newEvents);
    eventsChanged(newEvents);
  }

  function removeHandler(index) {
    let newEvents = component.component.definition.events;
    newEvents.splice(index, 1);
    setEvents(newEvents);
    eventsChanged(newEvents);
  }

  function addHandler() {
    let newEvents = component.component.definition.events;
    newEvents.push({
      eventId: Object.keys(componentMeta.events)[0],
      actionId: 'show-alert',
      message: 'Hello world!',
      alertType: 'info',
    });
    setEvents(newEvents);
    eventsChanged(newEvents);
  }

  //following two are functions responsible for on change and value for the control specific actions
  const onChangeHandlerForComponentSpecificActionHandle = (value, index, param, event) => {
    const newParam = { ...param, value: value };
    const params = event?.componentSpecificActionParams ?? [];
    const newParams = params.map((paramOfParamList) =>
      paramOfParamList.handle === param.handle ? newParam : paramOfParamList
    );
    return handlerChanged(index, 'componentSpecificActionParams', newParams);
  };
  const valueForComponentSpecificActionHandle = (event, param) => {
    return (
      event?.componentSpecificActionParams?.find((paramItem) => paramItem.handle === param.handle)?.value ??
      param.defaultValue
    );
  };

  function eventPopover(event, index) {
    return (
      <Popover
        id="popover-basic"
        style={{ width: '350px', maxWidth: '350px' }}
        className={`${darkMode && ' dark-theme'} shadow event-manager-popover`}
        data-cy="popover-card"
      >
        <Popover.Body>
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
            <div className="col-9" data-cy="alert-message-type">
              <CodeHinter
                theme={darkMode ? 'monokai' : 'default'}
                initialValue={event.runOnlyIf}
                onChange={(value) => handlerChanged(index, 'runOnlyIf', value)}
                usePortalEditor={false}
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
                      theme={darkMode ? 'monokai' : 'default'}
                      initialValue={event.message}
                      onChange={(value) => handlerChanged(index, 'message', value)}
                      usePortalEditor={false}
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
              <div className="p-1">
                <label className="form-label mt-1">{t('editor.inspector.eventManager.url', 'URL')}</label>
                <CodeHinter
                  theme={darkMode ? 'monokai' : 'default'}
                  initialValue={event.url}
                  onChange={(value) => handlerChanged(index, 'url', value)}
                  usePortalEditor={false}
                />
              </div>
            )}

            {event.actionId === 'go-to-app' && (
              <GotoApp
                event={event}
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
                  theme={darkMode ? 'monokai' : 'default'}
                  initialValue={event.contentToCopy}
                  onChange={(value) => handlerChanged(index, 'contentToCopy', value)}
                  usePortalEditor={false}
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
                      options={dataQueries
                        .filter((qry) => isQueryRunnable(qry))
                        .map((qry) => ({ name: qry.name, value: qry.id }))}
                      value={event.queryId}
                      search={true}
                      onChange={(value) => {
                        const query = dataQueries.find((dataquery) => dataquery.id === value);
                        const parameters = (query?.options?.parameters ?? []).reduce(
                          (paramObj, param) => ({
                            ...paramObj,
                            [param.name]: param.defaultValue,
                          }),
                          {}
                        );
                        handlerChanged(index, 'queryId', query.id);
                        handlerChanged(index, 'queryName', query.name);
                        handlerChanged(index, 'parameters', parameters);
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
                      theme={darkMode ? 'monokai' : 'default'}
                      initialValue={event.key}
                      onChange={(value) => handlerChanged(index, 'key', value)}
                      enablePreview={true}
                      usePortalEditor={false}
                    />
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-3 p-2">{t('editor.inspector.eventManager.value', 'Value')}</div>
                  <div className="col-9">
                    <CodeHinter
                      theme={darkMode ? 'monokai' : 'default'}
                      initialValue={event.value}
                      onChange={(value) => handlerChanged(index, 'value', value)}
                      enablePreview={true}
                      usePortalEditor={false}
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
                      theme={darkMode ? 'monokai' : 'default'}
                      initialValue={event.fileName}
                      onChange={(value) => handlerChanged(index, 'fileName', value)}
                      enablePreview={true}
                    />
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-3 p-2">{t('editor.inspector.eventManager.data', 'Data')}</div>
                  <div className="col-9">
                    <CodeHinter
                      theme={darkMode ? 'monokai' : 'default'}
                      initialValue={event.data}
                      onChange={(value) => handlerChanged(index, 'data', value)}
                      enablePreview={true}
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
                      theme={darkMode ? 'monokai' : 'default'}
                      initialValue={event.pageIndex ?? '{{1}}'}
                      onChange={(value) => handlerChanged(index, 'pageIndex', value)}
                      enablePreview={true}
                      usePortalEditor={false}
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
                      theme={darkMode ? 'monokai' : 'default'}
                      initialValue={event.key}
                      onChange={(value) => handlerChanged(index, 'key', value)}
                      enablePreview={true}
                      cyLabel={`key`}
                    />
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-3 p-2">{t('editor.inspector.eventManager.value', 'Value')}</div>
                  <div className="col-9">
                    <CodeHinter
                      theme={darkMode ? 'monokai' : 'default'}
                      initialValue={event.value}
                      onChange={(value) => handlerChanged(index, 'value', value)}
                      enablePreview={true}
                      cyLabel={`variable`}
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
                      theme={darkMode ? 'monokai' : 'default'}
                      initialValue={event.key}
                      onChange={(value) => handlerChanged(index, 'key', value)}
                      enablePreview={true}
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
                      theme={darkMode ? 'monokai' : 'default'}
                      initialValue={event.key}
                      onChange={(value) => handlerChanged(index, 'key', value)}
                      enablePreview={true}
                      cyLabel={`key`}
                    />
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-3 p-2">{t('editor.inspector.eventManager.value', 'Value')}</div>
                  <div className="col-9">
                    <CodeHinter
                      theme={darkMode ? 'monokai' : 'default'}
                      initialValue={event.value}
                      onChange={(value) => handlerChanged(index, 'value', value)}
                      enablePreview={true}
                      cyLabel={`variable`}
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
                      theme={darkMode ? 'monokai' : 'default'}
                      initialValue={event.key}
                      onChange={(value) => handlerChanged(index, 'key', value)}
                      enablePreview={true}
                      cyLabel={`key`}
                    />
                  </div>
                </div>
              </>
            )}
            {event.actionId === 'switch-page' && (
              <SwitchPage
                event={event}
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
                        handlerChanged(index, 'componentSpecificActionHandle', '');
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
                        handlerChanged(
                          index,
                          'componentSpecificActionParams',
                          getComponentActionDefaultParams(event?.componentId, value)
                        );
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
                  (getAction(event?.componentId, event?.componentSpecificActionHandle).params ?? []).map((param) => (
                    <div className="row mt-2" key={param.handle}>
                      <div className="col-3 p-1" data-cy={`action-options-${param.displayName}-field-label`}>
                        {param.displayName}
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
                            param?.type ? 'col-7' : 'col-9 fx-container-eventmanager-code'
                          } fx-container-eventmanager ${param.type == 'select' && 'component-action-select'}`}
                          data-cy="action-options-text-input-field"
                        >
                          <CodeHinter
                            theme={darkMode ? 'monokai' : 'default'}
                            mode="javascript"
                            initialValue={valueForComponentSpecificActionHandle(event, param)}
                            onChange={(value) => {
                              onChangeHandlerForComponentSpecificActionHandle(value, index, param, event);
                            }}
                            enablePreview={true}
                            type={param?.type}
                            fieldMeta={{ options: param?.options }}
                            cyLabel={param.displayName}
                          />
                        </div>
                      )}
                    </div>
                  ))}
              </>
            )}
            <div className="row mt-3">
              <div className="col-3 p-2">{t('editor.inspector.eventManager.debounce', 'Debounce')}</div>
              <div className="col-9" data-cy="debounce-input-field">
                <CodeHinter
                  theme={darkMode ? 'monokai' : 'default'}
                  initialValue={event.debounce}
                  onChange={(value) => handlerChanged(index, 'debounce', value)}
                  usePortalEditor={false}
                />
              </div>
            </div>
          </div>
        </Popover.Body>
      </Popover>
    );
  }

  const reorderEvents = (startIndex, endIndex) => {
    const result = [...component.component.definition.events];
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    setEvents(result);
    eventsChanged(result, true);
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
                const actionMeta = ActionTypes.find((action) => action.id === event.actionId);
                const rowClassName = `card-body p-0 ${focusedEventIndex === index ? ' bg-azure-lt' : ''}`;
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
                          overlay={eventPopover(event, index)}
                          onHide={() => setFocusedEventIndex(null)}
                          onToggle={(showing) => {
                            if (showing) {
                              setFocusedEventIndex(index);
                            } else {
                              setFocusedEventIndex(null);
                              eventsChanged(events);
                            }
                            if (typeof popOverCallback === 'function') popOverCallback(showing);
                          }}
                        >
                          <div>
                            <ManageEventButton
                              eventDisplayName={componentMeta.events[event.eventId]['displayName']}
                              actionName={actionMeta.name}
                              removeHandler={removeHandler}
                              index={index}
                              darkMode={darkMode}
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
      <AddNewButton onClick={addHandler} data-cy="add-more-event-handler" className="mt-2">
        {t('editor.inspector.eventManager.addHandler', 'New event handler')}
      </AddNewButton>
    );
  };

  if (events.length === 0) {
    return (
      <>
        {!hideEmptyEventsAlert && <NoListItem text={'No event handlers'} />}
        {renderAddHandlerBtn()}
      </>
    );
  }

  return (
    <>
      <div className="mb-3">
        {renderHandlers(events)}
        {renderAddHandlerBtn()}
      </div>
    </>
  );
};
