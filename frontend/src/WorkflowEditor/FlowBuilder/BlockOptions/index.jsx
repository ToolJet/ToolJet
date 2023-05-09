import React from 'react';
import get from 'lodash/get';
import OptionLister from './OptionLister';
import AddGrayIcon from '../../../../assets/images/icons/add-gray.svg';
import './styles.scss';

function BlockOptions(props) {
  const { onNewNode, editorSession, style } = props;
  const availableDataSources = get(editorSession, 'dataSources', []);

  return (
    <div className="block-option-container" style={style}>
      <div className="add-new">
        <AddGrayIcon />
        <span>Add new block</span>
      </div>
      <OptionLister sources={availableDataSources} onOptionClick={onNewNode} />
    </div>
  );
}

export default BlockOptions;
