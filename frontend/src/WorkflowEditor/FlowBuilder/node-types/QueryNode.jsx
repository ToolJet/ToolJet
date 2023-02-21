import React, { useEffect, useState, useContext, useMemo } from 'react';
import { Handle } from 'reactflow';
import { allSources } from '../../../Editor/QueryManager/QueryEditors';
import Select from 'react-select';
import WorkflowEditorContext from '../../context';

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
  const { editorSessionActions } = useContext(WorkflowEditorContext);
  const { id, data: nodeData } = props;

  const QueryBuilder = useMemo(() => allSources[nodeData.type], [nodeData.type]);
  const schema = useMemo(() => staticDataSourceSchemas[nodeData.type], [nodeData.type]);

  console.log({ QueryBuilder, props });

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
                options={selectableDataSourceOptions}
                className="datasource-selector nodrag"
                onChange={(option) => editorSessionActions.updateNodeData(id, { type: option.value })}
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
