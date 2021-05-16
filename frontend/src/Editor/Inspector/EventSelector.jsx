import React from 'react';
import { ActionTypes } from '../ActionTypes';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import { CodeHinter } from '../CodeBuilder/CodeHinter';

export const EventSelector = ({
  param,
  definition,
  eventUpdated,
  eventOptionUpdated,
  dataQueries,
  extraData,
  eventMeta,
  currentState,
  components
}) => {
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

  return (
    <div className="field mb-2 mt-1">
      <label className="form-label">{eventMeta.displayName}</label>
      <SelectSearch
        options={ActionTypes.map((action) => {
          return { name: action.name, value: action.id };
        })}
        value={definition.actionId}
        search={false}
        onChange={(value) => eventUpdated(param, value, extraData)}
        filterOptions={fuzzySearch}
        placeholder="Select.."
      />

      {definition && (
        <div>
          {definition.actionId === 'show-alert' && (
            <div className="p-3">
              <label className="form-label mt-1">Message</label>
              <input
                onChange={(e) => eventOptionUpdated(param, 'message', e.target.value, extraData)}
                value={message}
                type="text"
                className="form-control form-control-sm"
                placeholder="Text goes here"
              />
            </div>
          )}

          {definition.actionId === 'open-webpage' && (
            <div className="p-3">
              <label className="form-label mt-1">URL</label>
              <CodeHinter
                currentState={currentState}
                initialValue={definition.options.url}
                onChange={(value) => eventOptionUpdated(param, 'url', value, extraData)}
              />
            </div>
          )}

          {definition.actionId === 'show-modal' && (
            <div className="p-3">
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
  );
};
