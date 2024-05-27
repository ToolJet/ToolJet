/* eslint-disable prettier/prettier */
import React, { useContext, useMemo, useState } from 'react';
import CodeHinter from '@/Editor/CodeEditor';
import JSONTreeViewer from '@/_ui/JSONTreeViewer';
import WorkflowEditorContext from '../../context';
import './response-node-configuration-styles.scss';
import { find } from 'lodash';

export default function ResponseNodeConfiguration({ node, darkMode }) {
  const { editorSession, editorSessionActions } = useContext(WorkflowEditorContext);

  const executionDetails = useMemo(() => {
    const details = find(editorSession.execution.nodes, { id_on_definition: node.id }) ?? {};
    const result = details?.result ?? '{}';
    try {
      const parsedResult = JSON.parse(result);
      return { ...details, result: parsedResult };
    } catch (e) {
      return { ...details, result: {} };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(editorSession.execution.nodes), node.id]);


  return (
    <div className="response-modal-content d-flex justify-content-center">
      <div className="response-section d-flex flex-column">
        <div className="labels-section">
          <span className="title mb-2">Result</span>
          <p className='mb-0 mt-1'>Response object</p>
        </div>
        <div className="codehinter-section">
          <CodeHinter
            className={'result-node-codehinter'}
            currentState={{}}
            initialValue={node.data.code}
            mode="javascript"
            theme={darkMode ? 'monokai' : 'base16-light'}
            lineNumbers={false}
            height={400}
            width="568px"
            ignoreBraces={true}
            onChange={(code) => editorSessionActions.updateNodeData(node.id, { code })}
            isMultiLineJs={false}
            enablePreview={false}
            usePortalEditor={false}
          />
        </div>


      </div>

      <div className="result-section">
        <label className="result-label">Results</label>
        <div style={{ width: '100%', height: '300px', overflowY: 'auto' }}>
          <JSONTreeViewer
            data={executionDetails.result}
            useIcons={false}
            useIndentedBlock={true}
            enableCopyToClipboard={false}
            useActions={false}
            actionIdentifier="id"
            expandWithLabels={true}
            fontSize={'10px'}
          />
        </div>
      </div>
    </div>
  );
}
