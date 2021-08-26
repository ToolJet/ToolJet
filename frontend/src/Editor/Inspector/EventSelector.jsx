import React, { useState } from 'react';
import { ActionTypes } from '../ActionTypes';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import { CodeHinter } from '../CodeBuilder/CodeHinter';
import Collapse from 'react-bootstrap/Collapse'

export const EventSelector = ({
  param,
  definition,
  eventUpdated,
  eventOptionUpdated,
  dataQueries,
  extraData,
  eventMeta,
  currentState,
  components,
  apps
}) => {

  const [open, setOpen] = useState(false);

  function onChange(value) {
    const query = dataQueries.find((dataquery) => dataquery.id === value);
    eventOptionUpdated(param, 'queryId', query.id, extraData);
    eventOptionUpdated(param, 'queryName', query.name, extraData);
  }

  if (definition === undefined) {
    definition = {};
  }

  if (definition.options === undefined) {
    definition.options = {};
  }

  const message = definition.options.message;

  function getModalOptions() {
    let modalOptions = [];
    Object.keys(components || {}).forEach((key) => {
      if(components[key].component.component === 'Modal') {
        modalOptions.push({
          name: components[key].component.name,
          value: key
        })
      }
    })
    
    return modalOptions;
  }

  function getAllApps() {
    let appsOptionsList = [];
    apps.filter(item => item.slug != undefined).map((item) => {
      appsOptionsList.push({
        name: item.name,
        value: item.slug
      })
    })
    return appsOptionsList;
  }

  function eventChanged(param, value, extraData) { 
    if(value === 'none') { 
      eventUpdated(param, null, null);
    } else { 
      eventUpdated(param, value, extraData) 
    }
  }

  let actionOptions = ActionTypes.map((action) => {
    return { name: action.name, value: action.id };
  });

  actionOptions.unshift({
    name: 'None',
    value: 'none'
  });

  return (
    <div className="field mb-3 mt-1 px-2">
      <label className="form-label" role="button" onClick={() => setOpen(!open)}>
        <div className="row">
          <div className="col">
            {eventMeta.displayName}
          </div>
          <div className={`col-auto events-toggle ${open ? 'events-toggle-active' : ''}`}>
            <span className="toggle-icon"></span>
          </div>
        </div>
      </label>
      <Collapse in={open}>
        <div id="collapse">
          <SelectSearch
            options={actionOptions}
            value={definition.actionId}
            search={false}
            onChange={(value) => eventChanged(param, value, extraData)}
            filterOptions={fuzzySearch}
            placeholder="Select.."
          />

          {definition && (
            <div>
              {definition.actionId === 'show-alert' && (
                <div className="p-1">
                  <label className="form-label mt-1">Message</label>
                  <CodeHinter
                    currentState={currentState}
                    onChange={(value) => eventOptionUpdated(param, 'message', value, extraData)}
                  />
                  
                </div>
              )}

              {definition.actionId === 'open-webpage' && (
                <div className="p-1">
                  <label className="form-label mt-1">URL</label>
                  <CodeHinter
                    currentState={currentState}
                    initialValue={definition.options.url}
                    onChange={(value) => eventOptionUpdated(param, 'url', value, extraData)}
                  />
                </div>
              )}

              {definition.actionId === 'go-to-app' && (
                <div className="p-1">
                  <label className="form-label mt-1">App</label>
                  <SelectSearch
                    options={getAllApps()}
                    search={true}
                    value={definition.options.slug}
                    onChange={(value) => {
                      eventOptionUpdated(param, 'slug', value, extraData);
                    }}
                    filterOptions={fuzzySearch}
                    placeholder="Select.."
                  />
                </div>
              )}

              {definition.actionId === 'show-modal' && (
                <div className="p-1">
                  <label className="form-label mt-1">Modal</label>
                  <SelectSearch
                    options={getModalOptions()}
                    value={definition.options.model}
                    search={true}
                    onChange={(value) => {
                      eventOptionUpdated(param, 'modal', value, extraData);
                    }}
                    filterOptions={fuzzySearch}
                    placeholder="Select.."
                  />
                </div>
              )}

              {definition.actionId === 'close-modal' && (
                <div className="p-1">
                  <label className="form-label mt-1">Modal</label>
                  <SelectSearch
                    options={getModalOptions()}
                    value={definition.options.model}
                    search={true}
                    onChange={(value) => {
                      eventOptionUpdated(param, 'modal', value, extraData);
                    }}
                    filterOptions={fuzzySearch}
                    placeholder="Select.."
                  />
                </div>
              )}

              {definition.actionId === 'copy-to-clipboard' && (
                <div className="p-1">
                  <label className="form-label mt-1">Text</label>
                  <CodeHinter
                    currentState={currentState}
                    onChange={(value) => eventOptionUpdated(param, 'contentToCopy', value, extraData)}
                  />
                </div>
              )}

              {definition.actionId === 'run-query' && (
                <div className="p-3">
                  <label className="form-label mt-1">Query</label>
                  <SelectSearch
                    options={dataQueries.map((query) => {
                      return { name: query.name, value: query.id };
                    })}
                    value={definition.options.queryId}
                    search={true}
                    onChange={(value) => {
                      onChange(value);
                    }}
                    filterOptions={fuzzySearch}
                    placeholder="Select.."
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </Collapse>
    </div>
  );
};
