import React from 'react';
import { CodeHinter } from '@/Editor/CodeBuilder/CodeHinter';
import { isEmpty } from 'lodash';
import { useDataQueries } from '@/_stores/dataQueriesStore';

function RunjsParameters({ event, darkMode, index, handlerChanged }) {
  const dataQueries = useDataQueries();

  const dataQuery = dataQueries.find((dataquery) => dataquery.id === event.queryId);

  if (!event.queryId || isEmpty(dataQuery?.options?.parameters)) {
    return '';
  }

  const handleChange = (value, param) => {
    const newParams = { ...event?.parameters, [param.name]: value };
    handlerChanged(index, 'parameters', newParams);
  };

  return (
    <div className="row mt-3">
      <label className="form-label mt-2">Parameters</label>
      {dataQuery?.options?.parameters.map((param) => (
        <React.Fragment key={param.name}>
          <div className="col-3 p-2">{param.name}</div>
          <div className="col-9">
            <CodeHinter
              theme={darkMode ? 'monokai' : 'default'}
              initialValue={event.parameters?.[param.name] || param.defaultValue}
              onChange={(value) => handleChange(value, param)}
              usePortalEditor={false}
            />
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

export default RunjsParameters;
