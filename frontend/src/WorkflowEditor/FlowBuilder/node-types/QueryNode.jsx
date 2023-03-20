import React, { useContext, useMemo } from 'react';
import { Handle } from 'reactflow';
import { allSources } from '../../../Editor/QueryManager/QueryEditors';
import Select from 'react-select';
import WorkflowEditorContext from '../../context';
import { capitalize, isUndefined } from 'lodash';
import { find } from 'lodash';

import './query-node-styles.scss';

const staticDataSourceSchemas = {
  restapi: {
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
  runjs: {
    code: '',
  },
  runpy: {},
};

export default function QueryNode(props) {
  const { editorSession, updateQuery } = useContext(WorkflowEditorContext);
  const { data: nodeData } = props;
  const queryData = find(editorSession.queries, { idOnDefinition: nodeData.idOnDefinition });

  if (isUndefined(queryData)) {
    return <>loading..</>;
  }

  const QueryBuilder = useMemo(() => allSources[capitalize(queryData.kind)], [queryData.kind]);
  const schema = useMemo(() => staticDataSourceSchemas[queryData.kind], [queryData.kind]);

  const dataSourceOptions = editorSession.dataSources.map((source) => ({
    label: capitalize(source.kind),
    value: source.kind,
  }));

  const selectedOption = find(dataSourceOptions, { value: queryData.kind });

  const onQueryTypeChange = (option) => {
    const dataSource = find(editorSession.dataSources, { kind: option.value });
    updateQuery(queryData.idOnDefinition, { dataSourceId: dataSource.id, kind: dataSource.kind });
  };

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
              <h3>{queryData.name}</h3>
            </div>
            <div className="row">
              <Select
                value={selectedOption}
                options={dataSourceOptions}
                className="datasource-selector nodrag"
                onChange={onQueryTypeChange}
              />
            </div>
            <div className="row">
              <QueryBuilder
                pluginSchema={schema}
                isEditMode={true}
                queryName={'RunJS'}
                options={queryData.options}
                currentState={{}}
                optionsChanged={(options) => updateQuery(queryData.idOnDefinition, { options })}
                optionchanged={(key, value) =>
                  updateQuery(queryData.idOnDefinition, {
                    ...queryData,
                    options: { ...queryData.options, [key]: value },
                  })
                }
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
