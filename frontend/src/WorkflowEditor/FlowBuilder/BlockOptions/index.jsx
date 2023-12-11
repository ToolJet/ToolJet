import React, { useRef } from 'react';
import get from 'lodash/get';
import AddGrayIcon from '../../../../assets/images/icons/add-gray.svg';
import './styles.scss';
import { getWorkspaceId } from '@/_helpers/utils';
import { useNavigate } from 'react-router-dom';
import DataSourceSelect from '@/Editor/QueryManager/Components/DataSourceSelect';

const BlockOptions = (props) => {
  const { onNewNode, editorSession, style, onClose } = props;
  const availableDataSources = get(editorSession, 'dataSources', []);
  const node = useRef(); // Create a ref to the node
  const workspaceId = getWorkspaceId();
  const navigate = useNavigate();

  const defaultDataSources = availableDataSources.filter((item) => item.kind === 'restapi' || item.kind === 'runjs');
  const actualDataSources = availableDataSources.filter((item) => item.kind !== 'restapi' && item.kind !== 'runjs');

  defaultDataSources.push({ kind: 'If condition', id: 'if', name: 'If condition' });

  return (
    <div
      style={{
        //position: 'fixed',
        top: 0,
        left: 0,
      }}
    >
      <div className="block-option-container" style={style} ref={node}>
        <div className="add-new">
          <AddGrayIcon />
          <span>Add new block</span>
        </div>

        <DataSourceSelect
          workflowDataSources={actualDataSources}
          onNewNode={onNewNode}
          defaultDataSources={defaultDataSources}
        />
      </div>
    </div>
  );
};

export default BlockOptions;
