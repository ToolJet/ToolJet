import React, { useState, useEffect } from 'react';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';

export function GotoApp({ getAllApps, currentState, event, handlerChanged, eventIndex }) {
  const queryParamChangeHandler = (index, key, value) => {
    event.queryParams[index][key] = value;
    handlerChanged(eventIndex, 'queryParams', event.queryParams);
  };

  const addQueryParam = () => {
    if (!event.queryParams) {
      event.queryParams = [];
      handlerChanged(eventIndex, 'queryParams', event.queryParams);
    }

    event.queryParams.push(['', '']);
    handlerChanged(eventIndex, 'queryParams', event.queryParams);
    setNumberOfQueryparams(numberOfQueryParams + 1);
  };

  const deleteQueryParam = (index) => {
    event.queryParams.splice(index, 1);
    handlerChanged(eventIndex, 'queryParams', event.queryParams);
    setNumberOfQueryparams(numberOfQueryParams - 1);
  };

  const [numberOfQueryParams, setNumberOfQueryparams] = useState(0);

  useEffect(() => {
    if (event.queryParams) {
      setNumberOfQueryparams(event.queryParams.length);
    }
  }, [event.queryParams]);

  return (
    <div className="p-1">
      <label className="form-label mt-1">App</label>
      <SelectSearch
        options={getAllApps()}
        search={true}
        value={event.slug}
        onChange={(value) => {
          handlerChanged(eventIndex, 'slug', value);
        }}
        filterOptions={fuzzySearch}
        placeholder="Select.."
      />
      <label className="form-label mt-2">Query params</label>

      {Array(numberOfQueryParams)
        .fill(0)
        .map((_, index) => (
          <div key={index}>
            <div className="input-group mt-1">
              <CodeHinter
                currentState={currentState}
                initialValue={event.queryParams[index][0]}
                onChange={(value) => queryParamChangeHandler(index, 0, value)}
                mode="javascript"
                className="form-control codehinter-query-editor-input"
                height={30}
              />
              <CodeHinter
                currentState={currentState}
                initialValue={event.queryParams[index][1]}
                onChange={(value) => queryParamChangeHandler(index, 1, value)}
                mode="javascript"
                className="form-control codehinter-query-editor-input"
                height={30}
              />
              <span className="input-group-text btn-sm" role="button" onClick={() => deleteQueryParam(index)}>
                x
              </span>
            </div>
          </div>
        ))}

      <button className="btn btn-sm btn-outline-azure mt-2 mx-0 mb-0" onClick={addQueryParam}>
        +
      </button>
    </div>
  );
}
