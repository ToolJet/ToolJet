import React from 'react';
import SelectSearch, { fuzzySearch } from 'react-select-search';

export const QuerySelector = ({
  param,
  definition,
  eventOptionUpdated,
  dataQueries,
  extraData,
  eventMeta
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

  return (
    <div className="field mb-2 mt-1">
      <label className="form-label mt-2">{eventMeta.displayName}</label>
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
  );
};
