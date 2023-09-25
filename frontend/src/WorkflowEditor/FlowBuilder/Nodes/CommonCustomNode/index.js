import React, { useContext } from 'react';
// eslint-disable-next-line import/no-unresolved
import { Handle } from 'reactflow';
import { find } from 'lodash';
import './styles.scss';

import WorkflowEditorContext from '../../../context';
import DataSourceIcon from '../../DataSourceIcon';

function CommonCustomNode(props) {
  const { editorSession } = useContext(WorkflowEditorContext);
  const { data: nodeData } = props;
  const queryData = find(editorSession.queries, { idOnDefinition: nodeData.idOnDefinition });
  if (!queryData) return null;
  const sourceData = find(editorSession.dataSources, { kind: queryData.kind });

  return (
    <div className="common-custom-node">
      <Handle
        type="target"
        position="left"
        isConnectable={false}
        isValidConnection={(_connection) => true}
        className="node-handle left"
      />
      <DataSourceIcon source={sourceData} />
      <div className="title">{queryData.name}</div>
      <Handle type="source" position="right" isValidConnection={(_connection) => true} className="node-handle right" />
    </div>
  );
}

export default CommonCustomNode;
