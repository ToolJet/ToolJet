import React from 'react';
import { isEmpty } from 'lodash';
import { useDataQueries } from '@/_stores/dataQueriesStore';
import CodeHinter from '@/AppBuilder/CodeEditor';
import useStore from '@/AppBuilder/_stores/store';

function RunjsParameters({ event, darkMode, index, handlerChanged }) {
  const dataQuery = useStore((state) => {
    const queries = state.dataQuery?.queries?.modules?.canvas || [];
    return queries.find((dataquery) => dataquery.id === event.queryId);
  });

  if (!event.queryId || isEmpty(dataQuery?.options?.parameters)) {
    return '';
  }

  const handleChange = (value, param) => {
    const newParams = { ...event?.parameters, [param.name]: value };
    handlerChanged(index, 'parameters', newParams);
  };

  return (
    <div className="row mt-3">
      <label className="form-label mt-2" data-cy="label-run-js-parameters">
        Parameters
      </label>
      {dataQuery?.options?.parameters.map((param) => (
        <React.Fragment key={param.name}>
          <div className="col-3 p-2">{param.name}</div>
          <div className="col-9">
            <CodeHinter
              type="basic"
              initialValue={event.parameters?.[param.name]}
              onChange={(value) => handleChange(value, param)}
              usePortalEditor={false}
              componentName="RunJS Params"
            />
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

export default RunjsParameters;
