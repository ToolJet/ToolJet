import React from 'react';
import { ActionTypes } from '../ActionTypes';
import SelectSearch, { fuzzySearch } from 'react-select-search';

export const EventSelector = ({
  param,
  definition,
  eventUpdated,
  eventOptionUpdated,
  dataQueries,
  extraData
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

  return (
    <div className="field mb-2 mt-1">
      <label className="form-label">{param.name}</label>
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
              <label className="form-label mt-2">Message</label>
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
              <label className="form-label mt-2">URL</label>
              <input
                onChange={(e) => eventOptionUpdated(param, 'url', e.target.value, extraData)}
                value={message}
                type="text"
                className="form-control form-control-sm"
                placeholder="https://example.com"
              />
            </div>
          )}

          {definition.actionId === 'run-query' && (
            <div className="p-3">
              <label className="form-label mt-2">Query</label>
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
