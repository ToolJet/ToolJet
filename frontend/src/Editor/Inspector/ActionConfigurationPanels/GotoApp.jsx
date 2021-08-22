import React, { useState, useEffect } from 'react';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';

export function GotoApp({ 
  eventOptionUpdated,
  definition,
  getAllApps,
  currentState,
  param,
  extraData,
  }) {
  const queryParamChangeHandler = (index, key, value) => {
    definition.options.queryParams[index][key] = value
    eventOptionUpdated(param, 'queryParams', definition.options.queryParams, extraData)
  }

  const addQueryParam = () => {
    if (!definition.options.queryParams) {
      definition.options.queryParams = []
      eventOptionUpdated(param, 'queryParams', [], extraData)
    }

    definition.options.queryParams.push(['', ''])
    eventOptionUpdated(param, 'queryParams', definition.options.queryParams, extraData)
    setNumberOfQueryparams(numberOfQueryParams + 1)
  }

  const deleteQueryParam = index => {
    definition.options.queryParams.splice(index, 1)
    setNumberOfQueryparams(numberOfQueryParams - 1)
  }

  const [numberOfQueryParams, setNumberOfQueryparams] = useState(0)

  useEffect(() => {
    if (definition.options.queryParams) {
      setNumberOfQueryparams(definition.options.queryParams.length)
    }
  })

  return(
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
      <label className="form-label mt-2">Query params</label>

      {Array(numberOfQueryParams).fill(0).map((_, index) =>
        <div key={index}>
          <div className="input-group mt-1">
            <CodeHinter
              currentState={currentState}
              initialValue={definition.options.queryParams[index][0]}
              onChange={(value) => queryParamChangeHandler(index, 0, value)}
              mode='javascript'
              singleLine={false}
              className="form-control codehinter-query-editor-input"
            />
            <CodeHinter
              currentState={currentState}
              initialValue={definition.options.queryParams[index][1]}
              onChange={(value) => queryParamChangeHandler(index, 1, value)}
              mode='javascript'
              singleLine={false}
              className="form-control codehinter-query-editor-input"
            />
            <span
              className="input-group-text btn-sm"
              role="button"
              onClick={() => deleteQueryParam(index)}
            >x</span>
          </div>
        </div>
      )}

      <button
        className="btn btn-sm btn-outline-azure mt-2 mx-0 mb-0"
        onClick={addQueryParam}
      >+</button>
    </div>
  )
}
