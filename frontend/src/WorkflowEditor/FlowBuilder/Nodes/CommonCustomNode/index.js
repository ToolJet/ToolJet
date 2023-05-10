import React, { useContext } from 'react';
import { Handle } from 'reactflow';
import { find } from 'lodash';
import './styles.scss';

import WorkflowEditorContext from '../../../context';
import DataSourceIcon from '../../DataSourceIcon';

function CommonCustomNode(props) {
  const { editorSession, updateQuery } = useContext(WorkflowEditorContext);
  const { width, height, id, data: nodeData } = props;
  const queryData = find(editorSession.queries, { idOnDefinition: nodeData.idOnDefinition });
  const sourceData = find(editorSession.dataSources, { kind: queryData.kind });
  console.log('queryData', queryData);
  return (
    <div className="common-custom-node">
      <Handle
        type="target"
        position="left"
        isValidConnection={(_connection) => true}
        style={{ background: '#000' }}
        className="node-handle"
      />
      <DataSourceIcon source={sourceData} />
      <div className="title">{queryData.name}</div>
      <Handle
        type="source"
        position="right"
        isValidConnection={(_connection) => true}
        style={{ background: '#000' }}
        className="node-handle"
      />
    </div>
  );
}

export default CommonCustomNode;
