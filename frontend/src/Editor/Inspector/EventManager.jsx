import React, { useState } from 'react';
import { ActionTypes } from '../ActionTypes';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import { CodeHinter } from '../CodeBuilder/CodeHinter';
import { GotoApp } from './ActionConfigurationPanels/GotoApp';

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

  function getComponentOptions(componentType) {
    let componentOptions = [];
    Object.keys(components || {}).forEach((key) => {
      if (components[key].component.component === componentType) {
        componentOptions.push({
          name: components[key].component.name,
          value: key,
        });
      }
    });
    return componentOptions;
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

  const darkMode = localStorage.getItem('darkMode') === 'true';

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
              <SelectSearch
                className={`${darkMode ? 'select-search-dark' : 'select-search'}`}
                options={possibleEvents}
                value={event.eventId}
                search={false}
                onChange={(value) => handlerChanged(index, 'eventId', value)}
                filterOptions={fuzzySearch}
                placeholder="Select.."
              />
            </div>
          </div>
          <div className="row mt-3">
            <div className="col-3 p-2">
              <span data-cy="action-label">Action</span>
            </div>
            <div className="col-9 popover-action-select-search" data-cy="action-selection">
              <SelectSearch
                className={`${darkMode ? 'select-search-dark' : 'select-search'}`}
                options={actionOptions}
                value={event.actionId}
                search={false}
                onChange={(value) => handlerChanged(index, 'actionId', value)}
                filterOptions={fuzzySearch}
                placeholder="Select.."
              />
            </div>
          </div>

          <div className="hr-text" data-cy="action-option">
            Action options
          </div>
          <div>
            {event.actionId === 'show-alert' && (
              <>
                <div className="row">
                  <div className="col-3 p-2" data-cy="message-label">
                    Message
                  </div>
                  <div className="col-9" data-cy="message-text">
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
                    <SelectSearch
                      className={`${darkMode ? 'select-search-dark' : 'select-search'}`}
                      options={alertOptions}
                      value={event.alertType}
                      search={false}
                      onChange={(value) => handlerChanged(index, 'alertType', value)}
                      filterOptions={fuzzySearch}
                      placeholder="Select.."
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
                  <SelectSearch
                    className={`${darkMode ? 'select-search-dark' : 'select-search'}`}
                    options={getComponentOptions('Modal')}
                    value={event.modal?.id ?? event.modal}
                    search={true}
                    onChange={(value) => {
                      handlerChanged(index, 'modal', value);
                    }}
                    filterOptions={fuzzySearch}
                    placeholder="Select.."
                  />
                </div>
              </div>
            )}

            {event.actionId === 'close-modal' && (
              <div className="row">
                <div className="col-3 p-2">Modal</div>
                <div className="col-9">
                  <SelectSearch
                    className={`${darkMode ? 'select-search-dark' : 'select-search'}`}
                    options={getComponentOptions('Modal')}
                    value={event.modal?.id ?? event.modal}
                    search={true}
                    onChange={(value) => {
                      handlerChanged(index, 'modal', value);
                    }}
                    filterOptions={fuzzySearch}
                    placeholder="Select.."
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
                  <SelectSearch
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
                    filterOptions={fuzzySearch}
                    placeholder="Select.."
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
                    <SelectSearch
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
                      filterOptions={fuzzySearch}
                      placeholder="Select.."
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
                    <SelectSearch
                      className={`${darkMode ? 'select-search-dark' : 'select-search'}`}
                      options={getComponentOptions('Table')}
                      value={event.table}
                      search={true}
                      onChange={(value) => {
                        handlerChanged(index, 'table', value);
                      }}
                      filterOptions={fuzzySearch}
                      placeholder="Select.."
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
          </div>
        </Popover.Content>
      </Popover>
    );
  }

  function renderHandlers(events) {
    return events.map((event, index) => {
      const actionMeta = ActionTypes.find((action) => action.id === event.actionId);
      const rowClassName = `row g-0 border-bottom pb-2 pt-2 px-2 ${focusedEventIndex === index ? ' bg-azure-lt' : ''}`;

      return (
        <div key={index}>
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
            <div className="card mb-1">
              <div className="card-body p-0" data-cy="event-handler-card">
                <div className={rowClassName} role="button">
                  <div className="col" data-cy="event-handler">
                    {componentMeta.events[event.eventId]['displayName']}
                  </div>
                  <div className="col" data-cy="event-name">
                    <small className="event-action font-weight-light">{actionMeta.name}</small>
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
                      <svg width="10" height="16" viewBox="0 0 10 16" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          </OverlayTrigger>
        </div>
      );
    });
  }

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
