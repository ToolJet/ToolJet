import React from 'react';
import { Handle } from 'reactflow';
import { Runjs } from '../../../Editor/QueryManager/QueryEditors/Runjs';

import './query-node-styles.scss';

export default function QueryNode(_props) {
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
        {/* <Runjs
          pluginSchema={this.state.selectedDataSource?.plugin?.operations_file?.data}
          selectedDataSource={selectedDataSource}
          options={this.state.options}
          optionsChanged={this.optionsChanged}
          optionchanged={this.optionchanged}
          currentState={this.props.currentState}
          darkMode={this.props.darkMode}
          isEditMode={true} // Made TRUE always to avoid setting default options again
          queryName={this.state.queryName}
        /> */}
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
