import React, { useState } from 'react';
import Hide from '../LeftSidebar/icons/hide.svg';
import { copyClipboard } from '../utils';

function TokenApi({ editorSession }) {
  const [showApiVal, setShowApiVal] = useState({ show: false, copy: 'Copy' });
  const showWorkflowApiToken = showApiVal.show ? editorSession.workflowToken : '********************';
  const workflowApiToken = editorSession.workflowToken;

  const containerStyle = {
    width: '98px',
    height: 'auto',
    marginLeft: '10px',
    borderRadius: '4px',
    padding: '8px',
    border: '1px solid rgba(101, 109, 119, 0.16)',
    backgroundColor: '#FBFCFD',
    cursor: 'pointer',
    textAlign: 'center',
  };

  const copyApiToken = (token) => {
    setShowApiVal((prevState) => ({ ...prevState, copy: 'Copied' }));
    setTimeout(() => {
      setShowApiVal((prevState) => ({ ...prevState, copy: 'Copy' }));
    }, 2000);
    copyClipboard(token);
  };

  const showApiValue = () => {
    setShowApiVal((prevState) => ({ ...prevState, show: !prevState.show }));
  };

  return (
    <div className="endpoint-block mt-3">
      <strong>API token</strong>
      <div className="d-flex align-items-center justify-content-between mt-2">
        <div className="endpoint-url p-2 bg-gray rounded d-flex align-items-center justify-content-between">
          <p className="mb-0">{showWorkflowApiToken}</p>
          <Hide style={{ cursor: 'pointer' }} onClick={showApiValue} />
        </div>

        <div onClick={() => copyApiToken(workflowApiToken)} style={containerStyle}>
          {showApiVal.copy}
        </div>
      </div>
    </div>
  );
}

export default TokenApi;
