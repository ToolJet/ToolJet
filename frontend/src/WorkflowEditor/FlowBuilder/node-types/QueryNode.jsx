import React, { useEffect, useState } from 'react';
import { Handle } from 'reactflow';
import { allSources } from '../../../Editor/QueryManager/QueryEditors';
import Select from 'react-select';

import './query-node-styles.scss';

const staticDataSourceSchemas = {
  Restapi: {
    method: 'get',
    url: '',
    url_params: [['', '']],
    headers: [['', '']],
    body: [['', '']],
    json_body: null,
    body_toggle: false,
  },
  stripe: {},
  tooljetdb: {
    operation: '',
  },
  Runjs: {
    code: '',
  },
  Runpy: {},
};

const selectableDataSourceOptions = [
  {
    value: 'Runjs',
    label: 'RunJS',
  },
  {
    value: 'Runpy',
    label: 'RunPy',
  },
  {
    value: 'Restapi',
    label: 'REST API',
  },
];

export default function QueryNode(props) {
  const [datasource, setDatasource] = useState(props.data.type);
  const [QueryBuilder, setQueryBuilder] = useState(() => allSources[datasource]);
  const [schema, setSchema] = useState(() => staticDataSourceSchemas[datasource]);
  const [options, setOptions] = useState({});

  useEffect(() => {
    setQueryBuilder((_QueryBuilder) => allSources[datasource]);
    setSchema(staticDataSourceSchemas[datasource]);
  }, [datasource]);

  return (
    <div className="query-node">
      <div className="left-handle">
        <Handle
          type="target"
          position="left"
          isValidConnection={(_connection) => true}
          style={{ background: '#000' }}
          className="node-handle"
        />
      </div>
      <div className="body">
        <div className="grid">
          <div className="col-12">
            <div className="row">
              <Select
                options={selectableDataSourceOptions}
                className="datasource-selector nodrag"
                onChange={(option) => setDatasource(option.value)}
              />
            </div>
            <div className="row">
              <QueryBuilder
                pluginSchema={schema}
                isEditMode={true}
                queryName={'RunJS'}
                options={options}
                currentState={{}}
                optionsChanged={setOptions}
                optionchanged={() => {}}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="right-handle">
        <Handle
          type="source"
          position="right"
          isValidConnection={(_connection) => true}
          style={{ background: '#000' }}
          className="node-handle"
        />
      </div>
    </div>
  );
}
