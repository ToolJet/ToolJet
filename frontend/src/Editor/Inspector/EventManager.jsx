import React, { useState } from 'react';
import { ActionTypes } from '../ActionTypes';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { CodeHinter } from '../CodeBuilder/CodeHinter';
import { GotoApp } from './ActionConfigurationPanels/GotoApp';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import useDraggableInPortal from '@/_hooks/useDraggableInPortal';
import _ from 'lodash';
import { componentTypes } from '../WidgetManager/components';
import Select from '@/_ui/Select';
import defaultStyles from '@/_ui/Select/styles';

export const EventManager = ({
  component,
  componentMeta,
  currentState,
  components,
  dataQueries,
  eventsChanged,
  apps,
  excludeEvents,
  popOverCallback,
  popoverPlacement,
}) => {
  const [focusedEventIndex, setFocusedEventIndex] = useState(null);

  let actionOptions = ActionTypes.map((action) => {
    return { name: action.name, value: action.id };
  });

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
      name: 'Danger',
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

  function handlerChanged(index, param, value) {
    let newEvents = component.component.definition.events;

    let updatedEvent = newEvents[index];
    updatedEvent[param] = value;

    newEvents[index] = updatedEvent;

    eventsChanged(newEvents);
  }

  function removeHandler(index) {
    let newEvents = component.component.definition.events;
    newEvents.splice(index, 1);
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
    eventsChanged(newEvents);
  }
  function eventPopover(event, index) {
    return (
      <Popover
        id="popover-basic"
        style={{ width: '350px', maxWidth: '350px' }}
        className={`${darkMode && 'popover-dark-themed theme-dark'} shadow`}
        data-cy="popover-card"
      >
        <Popover.Content>
          <div className="row">
            <div className="col-3 p-2">
              <span data-cy="event-label">Event</span>
            </div>
            <div className="col-9" data-cy="event-selection">
              <Select
                className={`${darkMode ? 'select-search-dark' : 'select-search'}`}
                options={possibleEvents}
                value={event.eventId}
                search={false}
                onChange={(value) => handlerChanged(index, 'eventId', value)}
                placeholder="Select.."
                styles={styles}
                useMenuPortal={false}
              />
            </div>
          </div>
          <div className="row mt-3">
            <div className="col-3 p-2">
              <span data-cy="action-label">Action</span>
            </div>
            <div className="col-9 popover-action-select-search" data-cy="action-selection">
              <Select
                className={`${darkMode ? 'select-search-dark' : 'select-search'}`}
                options={actionOptions}
                value={event.actionId}
                search={false}
                onChange={(value) => handlerChanged(index, 'actionId', value)}
                placeholder="Select.."
                styles={styles}
                useMenuPortal={false}
              />
            </div>
          </div>

          {actionLookup[event.actionId].options?.length > 0 && (
            <div className="hr-text" data-cy="action-option">
              Action options
            </div>
          )}
          <div>
            {event.actionId === 'show-alert' && (
              <>
                <div className="row">
                  <div className="col-3 p-2" data-cy="message-label">
                    Message
                  </div>
                  <div className="col-9" data-cy="alert-message-input-field">
                    <CodeHinter
                      theme={darkMode ? 'monokai' : 'default'}
                      currentState={currentState}
                      initialValue={event.message}
                      onChange={(value) => handlerChanged(index, 'message', value)}
                      usePortalEditor={false}
                    />
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-3 p-2" data-cy="alert-type-label">
                    Alert Type
                  </div>
                  <div className="col-9" data-cy="alert-message-type">
                    <Select
                      className={`${darkMode ? 'select-search-dark' : 'select-search'}`}
                      options={alertOptions}
                      value={event.alertType}
                      search={false}
                      onChange={(value) => handlerChanged(index, 'alertType', value)}
                      placeholder="Select.."
                      styles={styles}
                      useMenuPortal={false}
                    />
                  </div>
                </div>
              </>
            )}

            {event.actionId === 'open-webpage' && (
              <div className="p-1">
                <label className="form-label mt-1">URL</label>
                <CodeHinter
                  theme={darkMode ? 'monokai' : 'default'}
                  currentState={currentState}
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
                currentState={currentState}
              />
            )}

            {event.actionId === 'show-modal' && (
              <div className="row">
                <div className="col-3 p-2">Modal</div>
                <div className="col-9">
                  <Select
                    className={`${darkMode ? 'select-search-dark' : 'select-search'}`}
                    options={getComponentOptions('Modal')}
                    value={event.modal?.id ?? event.modal}
                    search={true}
                    onChange={(value) => {
                      handlerChanged(index, 'modal', value);
                    }}
                    placeholder="Select.."
                    styles={styles}
                    useMenuPortal={false}
                  />
                </div>
              </div>
            )}

            {event.actionId === 'close-modal' && (
              <div className="row">
                <div className="col-3 p-2">Modal</div>
                <div className="col-9">
                  <Select
                    className={`${darkMode ? 'select-search-dark' : 'select-search'}`}
                    options={getComponentOptions('Modal')}
                    value={event.modal?.id ?? event.modal}
                    search={true}
                    onChange={(value) => {
                      handlerChanged(index, 'modal', value);
                    }}
                    placeholder="Select.."
                    styles={styles}
                    useMenuPortal={false}
                  />
                </div>
              </div>
            )}

            {event.actionId === 'copy-to-clipboard' && (
              <div className="p-1">
                <label className="form-label mt-1">Text</label>
                <CodeHinter
                  theme={darkMode ? 'monokai' : 'default'}
                  currentState={currentState}
                  onChange={(value) => handlerChanged(index, 'contentToCopy', value)}
                  usePortalEditor={false}
                />
              </div>
            )}

            {event.actionId === 'run-query' && (
              <div className="row">
                <div className="col-3 p-2">Query</div>
                <div className="col-9">
                  <Select
                    className={`${darkMode ? 'select-search-dark' : 'select-search'}`}
                    options={dataQueries.map((query) => {
                      return { name: query.name, value: query.id };
                    })}
                    value={event.queryId}
                    search={true}
                    onChange={(value) => {
                      const query = dataQueries.find((dataquery) => dataquery.id === value);
                      handlerChanged(index, 'queryId', query.id);
                      handlerChanged(index, 'queryName', query.name);
                    }}
                    placeholder="Select.."
                    styles={styles}
                    useMenuPortal={false}
                  />
                </div>
              </div>
            )}

            {event.actionId === 'set-localstorage-value' && (
              <>
                <div className="row">
                  <div className="col-3 p-2">Key</div>
                  <div className="col-9">
                    <CodeHinter
                      theme={darkMode ? 'monokai' : 'default'}
                      currentState={currentState}
                      initialValue={event.key}
                      onChange={(value) => handlerChanged(index, 'key', value)}
                      enablePreview={true}
                      usePortalEditor={false}
                    />
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-3 p-2">Value</div>
                  <div className="col-9">
                    <CodeHinter
                      theme={darkMode ? 'monokai' : 'default'}
                      currentState={currentState}
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
                  <div className="col-3 p-2">Type</div>
                  <div className="col-9">
                    <Select
                      className={`${darkMode ? 'select-search-dark' : 'select-search'}`}
                      options={[
                        { name: 'CSV', value: 'csv' },
                        { name: 'Text', value: 'plaintext' },
                      ]}
                      value={event.fileType ?? 'csv'}
                      search={true}
                      onChange={(value) => {
                        handlerChanged(index, 'fileType', value);
                      }}
                      placeholder="Select.."
                      styles={styles}
                      useMenuPortal={false}
                    />
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-3 p-2">File name</div>
                  <div className="col-9">
                    <CodeHinter
                      theme={darkMode ? 'monokai' : 'default'}
                      currentState={currentState}
                      initialValue={event.fileName}
                      onChange={(value) => handlerChanged(index, 'fileName', value)}
                      enablePreview={true}
                    />
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-3 p-2">Data</div>
                  <div className="col-9">
                    <CodeHinter
                      theme={darkMode ? 'monokai' : 'default'}
                      currentState={currentState}
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
                  <div className="col-3 p-2">Table</div>
                  <div className="col-9">
                    <Select
                      className={`${darkMode ? 'select-search-dark' : 'select-search'}`}
                      options={getComponentOptions('Table')}
                      value={event.table}
                      search={true}
                      onChange={(value) => {
                        handlerChanged(index, 'table', value);
                      }}
                      placeholder="Select.."
                      styles={styles}
                      useMenuPortal={false}
                    />
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-3 p-2">Page index</div>
                  <div className="col-9">
                    <CodeHinter
                      theme={darkMode ? 'monokai' : 'default'}
                      currentState={currentState}
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
                  <div className="col-3 p-2">Key</div>
                  <div className="col-9">
                    <CodeHinter
                      theme={darkMode ? 'monokai' : 'default'}
                      currentState={currentState}
                      initialValue={event.key}
                      onChange={(value) => handlerChanged(index, 'key', value)}
                      enablePreview={true}
                    />
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-3 p-2">Value</div>
                  <div className="col-9">
                    <CodeHinter
                      theme={darkMode ? 'monokai' : 'default'}
                      currentState={currentState}
                      initialValue={event.value}
                      onChange={(value) => handlerChanged(index, 'value', value)}
                      enablePreview={true}
                    />
                  </div>
                </div>
              </>
            )}
            {event.actionId === 'unset-custom-variable' && (
              <>
                <div className="row">
                  <div className="col-3 p-2">Key</div>
                  <div className="col-9">
                    <CodeHinter
                      theme={darkMode ? 'monokai' : 'default'}
                      currentState={currentState}
                      initialValue={event.key}
                      onChange={(value) => handlerChanged(index, 'key', value)}
                      enablePreview={true}
                    />
                  </div>
                </div>
              </>
            )}
            {event.actionId === 'control-component' && (
              <>
                <div className="row">
                  <div className="col-3 p-1" data-cy="action-options-component-field-label">
                    Component
                  </div>
                  <div className="col-9" data-cy="action-options-component-selection-field">
                    <Select
                      className={`${darkMode ? 'select-search-dark' : 'select-search'}`}
                      options={getComponentOptionsOfComponentsWithActions()}
                      value={event?.componentId}
                      search={true}
                      onChange={(value) => {
                        handlerChanged(index, 'componentSpecificActionHandle', '');
                        handlerChanged(index, 'componentId', value);
                      }}
                      placeholder="Select.."
                      styles={styles}
                      useMenuPortal={false}
                    />
                  </div>
                </div>
                <div className="row mt-2">
                  <div className="col-3 p-1" data-cy="action-options-action-field-label">
                    Action
                  </div>
                  <div className="col-9" data-cy="action-options-action-selection-field">
                    <Select
                      className={`${darkMode ? 'select-search-dark' : 'select-search'}`}
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
                      placeholder="Select.."
                      styles={styles}
                      useMenuPortal={false}
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
                      <div
                        className={`${
                          param?.type ? 'col-7' : 'col-9 fx-container-eventmanager-code'
                        } fx-container-eventmanager ${param.type == 'select' && 'component-action-select'}`}
                        data-cy="action-options-text-input-field"
                      >
                        <CodeHinter
                          theme={darkMode ? 'monokai' : 'default'}
                          currentState={currentState}
                          mode="javascript"
                          initialValue={
                            event?.componentSpecificActionParams?.find((paramItem) => paramItem.handle === param.handle)
                              ?.value ?? param.defaultValue
                          }
                          onChange={(value) => {
                            const newParam = { ...param, value: value };
                            const params = event?.componentSpecificActionParams ?? [];
                            const newParams = params.map((paramOfParamList) =>
                              paramOfParamList.handle === param.handle ? newParam : param
                            );
                            handlerChanged(index, 'componentSpecificActionParams', newParams);
                          }}
                          enablePreview={true}
                          type={param?.type}
                          fieldMeta={{ options: param?.options }}
                        />
                      </div>
                    </div>
                  ))}
              </>
            )}
          </div>
        </Popover.Content>
      </Popover>
    );
  }

  const reorderEvents = (startIndex, endIndex) => {
    const result = [...component.component.definition.events];
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
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
                  <Draggable key={`${event.eventId}-${index}`} draggableId={`${event.eventId}-${index}`} index={index}>
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
                            }
                            if (typeof popOverCallback === 'function') popOverCallback(showing);
                          }}
                        >
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="mb-1"
                          >
                            <div className="card column-sort-row">
                              <div className={rowClassName} data-cy="event-handler-card">
                                <div className="row p-2" role="button">
                                  <div className="col-auto" style={{ cursor: 'grab' }}>
                                    <svg
                                      width="8"
                                      height="14"
                                      viewBox="0 0 8 14"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path
                                        d="M0.666667 1.66667C0.666667 2.03486 0.965143 2.33333 1.33333 2.33333C1.70152 2.33333 2 2.03486 2 1.66667C2 1.29848 1.70152 1 1.33333 1C0.965143 1 0.666667 1.29848 0.666667 1.66667Z"
                                        stroke="#8092AC"
                                        strokeWidth="1.33333"
                                      />
                                      <path
                                        d="M5.99992 1.66667C5.99992 2.03486 6.2984 2.33333 6.66659 2.33333C7.03478 2.33333 7.33325 2.03486 7.33325 1.66667C7.33325 1.29848 7.03478 1 6.66659 1C6.2984 1 5.99992 1.29848 5.99992 1.66667Z"
                                        stroke="#8092AC"
                                        strokeWidth="1.33333"
                                      />
                                      <path
                                        d="M0.666667 7.00001C0.666667 7.3682 0.965143 7.66668 1.33333 7.66668C1.70152 7.66668 2 7.3682 2 7.00001C2 6.63182 1.70152 6.33334 1.33333 6.33334C0.965143 6.33334 0.666667 6.63182 0.666667 7.00001Z"
                                        stroke="#8092AC"
                                        strokeWidth="1.33333"
                                      />
                                      <path
                                        d="M5.99992 7.00001C5.99992 7.3682 6.2984 7.66668 6.66659 7.66668C7.03478 7.66668 7.33325 7.3682 7.33325 7.00001C7.33325 6.63182 7.03478 6.33334 6.66659 6.33334C6.2984 6.33334 5.99992 6.63182 5.99992 7.00001Z"
                                        stroke="#8092AC"
                                        strokeWidth="1.33333"
                                      />
                                      <path
                                        d="M0.666667 12.3333C0.666667 12.7015 0.965143 13 1.33333 13C1.70152 13 2 12.7015 2 12.3333C2 11.9651 1.70152 11.6667 1.33333 11.6667C0.965143 11.6667 0.666667 11.9651 0.666667 12.3333Z"
                                        stroke="#8092AC"
                                        strokeWidth="1.33333"
                                      />
                                      <path
                                        d="M5.99992 12.3333C5.99992 12.7015 6.2984 13 6.66659 13C7.03478 13 7.33325 12.7015 7.33325 12.3333C7.33325 11.9651 7.03478 11.6667 6.66659 11.6667C6.2984 11.6667 5.99992 11.9651 5.99992 12.3333Z"
                                        stroke="#8092AC"
                                        strokeWidth="1.33333"
                                      />
                                    </svg>
                                  </div>
                                  <div className="col text-truncate" data-cy="event-handler">
                                    {componentMeta.events[event.eventId]['displayName']}
                                  </div>
                                  <div className="col text-truncate" data-cy="event-name">
                                    <small className="event-action font-weight-light text-truncate">
                                      {actionMeta.name}
                                    </small>
                                  </div>
                                  <div className="col-auto">
                                    <span
                                      className="text-danger"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeHandler(index);
                                      }}
                                      data-cy="delete-button"
                                    >
                                      <svg
                                        width="10"
                                        height="16"
                                        viewBox="0 0 10 16"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path
                                          d="M0 13.8333C0 14.75 0.75 15.5 1.66667 15.5H8.33333C9.25 15.5 10 14.75 10 13.8333V3.83333H0V13.8333ZM1.66667 5.5H8.33333V13.8333H1.66667V5.5ZM7.91667 1.33333L7.08333 0.5H2.91667L2.08333 1.33333H0V3H10V1.33333H7.91667Z"
                                          fill="#8092AC"
                                        />
                                      </svg>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
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

  const events = component.component.definition.events || [];
  const componentName = componentMeta.name ? componentMeta.name : 'query';

  if (events.length === 0) {
    return (
      <>
        <div className="text-right mb-3">
          <button
            className="btn btn-sm border-0 font-weight-normal padding-2 col-auto color-primary inspector-add-button"
            onClick={addHandler}
            data-cy="add-event-handler"
          >
            + Add event handler
          </button>
        </div>
        <div className="text-center">
          <small className="color-disabled" data-cy="no-event-handler-message">
            This {componentName.toLowerCase()} doesn&apos;t have any event handlers
          </small>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="text-right mb-3">
        <button
          className="btn btn-sm border-0 font-weight-normal padding-2 col-auto color-primary inspector-add-button"
          onClick={addHandler}
          data-cy="add-more-event-handler"
        >
          + Add handler
        </button>
      </div>
      {renderHandlers(events)}
    </>
  );
};
