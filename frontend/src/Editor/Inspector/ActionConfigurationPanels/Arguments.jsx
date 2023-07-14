import React from 'react';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';
import { isEmpty } from 'lodash';
import { useDataQueries } from '@/_stores/dataQueriesStore';

function Arguments({ event, currentState, darkMode, index, handlerChanged }) {
  const dataQueries = useDataQueries();

  const dataQuery = dataQueries.find((dataquery) => dataquery.id === event.queryId);

  if (!event.queryId || isEmpty(dataQuery?.options?.arguments)) {
    return '';
  }

  const handleChange = (value, arg) => {
    const newArgs = { ...event?.arguments, [arg.name]: value };
    handlerChanged(index, 'arguments', newArgs);
  };

  return (
    <div className="row mt-3">
      <label className="form-label mt-2">Arguments</label>
      {dataQuery?.options?.arguments.map((arg) => (
        <React.Fragment key={arg.name}>
          <div className="col-3 p-2">{arg.name}</div>
          <div className="col-9">
            <CodeHinter
              theme={darkMode ? 'monokai' : 'default'}
              currentState={currentState}
              initialValue={event.arguments?.[arg.name] || arg.defaultValue}
              onChange={(value) => handleChange(value, arg)}
              usePortalEditor={false}
            />
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

export default Arguments;
