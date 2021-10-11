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

  function getModalOptions() {
    let modalOptions = [];
    Object.keys(components || {}).forEach((key) => {
      if (components[key].component.component === 'Modal') {
        modalOptions.push({
          name: components[key].component.name,
          value: key,
        });
      }
    });

    return modalOptions;
  }

  function getAllApps() {
    let appsOptionsList = [];
    apps
      .filter((item) => item.slug != undefined)
      .map((item) => {
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
    });
    eventsChanged(newEvents);
  }

  function eventPopover(event, index) {
    return (
      <Popover id="popover-basic" style={{ width: '350px', maxWidth: '350px' }} className="shadow">
        <Popover.Content>
          <div className="row">
            <div className="col-3 p-2">
              <span>Event</span>
            </div>
            <div className="col-9">
              <SelectSearch
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
              <span>Action</span>
            </div>
            <div className="col-9">
              <SelectSearch
                options={actionOptions}
                value={event.actionId}
                search={false}
                onChange={(value) => handlerChanged(index, 'actionId', value)}
                filterOptions={fuzzySearch}
                placeholder="Select.."
              />
            </div>
          </div>

          <div className="hr-text">Action options</div>
          <div>
            {event.actionId === 'show-alert' && (
              <>
                <div className="row">
                  <div className="col-3 p-2">Message</div>
                  <div className="col-9">
                    <CodeHinter
                      currentState={currentState}
                      initialValue={event.message}
                      onChange={(value) => handlerChanged(index, 'message', value)}
                    />
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-3 p-2">Alert Type</div>
                  <div className="col-9">
                    <SelectSearch
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
                  currentState={currentState}
                  initialValue={event.url}
                  onChange={(value) => handlerChanged(index, 'url', value)}
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
                    options={getModalOptions()}
                    value={event.model}
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
                    options={getModalOptions()}
                    value={event.model}
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
                  currentState={currentState}
                  onChange={(value) => handlerChanged(index, 'contentToCopy', value)}
                />
              </div>
            )}

            {event.actionId === 'run-query' && (
              <div className="row">
                <div className="col-3 p-2">Query</div>
                <div className="col-9">
                  <SelectSearch
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
            <div className={rowClassName} role="button">
              <div className="col">{componentMeta.events[event.eventId]['displayName']}</div>
              <div className="col">
                <small className="event-action">{actionMeta.name}</small>
              </div>
              <div className="col-auto">
                <span
                  className="text-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeHandler(index);
                  }}
                >
                  <img className="svg-icon" src="/assets/images/icons/trash.svg" width="12" height="12" />
                </span>
              </div>
            </div>
          </OverlayTrigger>
        </div>
      );
    });
  }

  const events = component.component.definition.events || [];

  if (events.length === 0) {
    return (
      <div>
        <center>
          <button className="btn btn-sm btn-outline-azure" onClick={addHandler}>
            Add event handler
          </button>
        </center>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-body p-0">{renderHandlers(events)}</div>
      <button className="btn btn-sm btn-outline-azure" onClick={addHandler}>
        Add handler
      </button>
    </div>
  );
};
