import React from 'react';
import Information from '@/_ui/Icon/solidIcons/Information';
import { ToolTip } from '@/_components/ToolTip';

function TestParameter({ editorSession, editorSessionActions }) {
  return (
    <div className="test-json-parameter mt-3">
      <ToolTip message="Test JSON parameters can be accessible only within the workflows dashboard." placement="right">
        <div className="test-json-title d-flex align-items-center justify-content-between mb-2">
          <p className="test-json-title mb-0 font-weight-bold">Test JSON parameters</p>
          <div style={{ cursor: 'pointer' }}>
            <Information width={20} fill={'#C1C8CD'} />
          </div>
        </div>
      </ToolTip>
      <input
        type="text"
        value={editorSession.testParameters}
        onChange={(e) => editorSessionActions.getTestParameterValue(e.target.value)}
        className="testKeyInput p-2"
        placeholder='{"webhookparam1":"value"}'
      />
    </div>
  );
}

export default TestParameter;
