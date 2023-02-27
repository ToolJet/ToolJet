import React, { useContext, useMemo } from 'react';
import { Handle } from 'reactflow';
import { allSources } from '../../../Editor/QueryManager/QueryEditors';
import Select from 'react-select';
import WorkflowEditorContext from '../../context';
import { dataqueryService } from '../../../_services/dataquery.service';
import { capitalize } from 'lodash';

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

const staticDataSources = [
  { kind: 'tooljetdb', id: 'null', name: 'Tooljet Database' },
  { kind: 'restapi', id: 'null', name: 'REST API' },
  { kind: 'runjs', id: 'runjs', name: 'Run JavaScript code' },
  { kind: 'runpy', id: 'runpy', name: 'Run Python code' },
];

export default function QueryNode(props) {
  const { editorSessionActions, editorSession } = useContext(WorkflowEditorContext);
  const { id, data: nodeData } = props;

  const QueryBuilder = useMemo(() => allSources[capitalize(nodeData.kind)], [nodeData.kind]);
  const schema = useMemo(() => staticDataSourceSchemas[nodeData.kind], [nodeData.kind]);

  const dataSourceOptions = [...staticDataSources, ...editorSession.dataSources].map((source) => ({
    label: source.name,
    value: source,
  }));

  console.log({ editorSession });

  const onQueryTypeChange = (option) => {
    const dataSource = option.value;
    editorSessionActions.updateNodeData(id, { dataSourceId: dataSource.id, kind: dataSource.kind });
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
              <Select
                // value={selectableDataSourceOptions[nodeData.type]}
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
                options={nodeData.options}
                currentState={{}}
                optionsChanged={(options) => editorSessionActions.updateNodeData(id, { options })}
                optionchanged={console.log}
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
