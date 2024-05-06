/* eslint-disable prettier/prettier */
import React, { useContext, useMemo, useState } from 'react';
import { CodeHinter } from '../../../Editor/CodeBuilder/CodeHinter';
import JSONTreeViewer from '@/_ui/JSONTreeViewer';
import WorkflowEditorContext from '../../context';
import './response-node-configuration-styles.scss';
import { find } from 'lodash';
import FxButton from '@/Editor/CodeBuilder/Elements/FxButton';

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

  const [fxActive, setFxActive] = useState(node.data?.fxActive ?? false);

  return (
    <div className="response-modal-content d-flex justify-content-center">
      <span className="title">Result</span>
      <div className="d-flex flex-row">
        <p>Response object</p>
        <FxButton
          active={fxActive}
          onPress={() => {
            setFxActive(prevFxActive => !prevFxActive);
            editorSessionActions.updateNodeData(node.id, { fxActive: !fxActive })
          }}
        />
      </div>

      <CodeHinter
        className={fxActive ? 'fx-active-codehinter' : 'fx-inactive-codehinter'}
        disabled={!fxActive}
        currentState={{}}
        initialValue={node.data.code}
        mode="javascript"
        theme={darkMode ? 'monokai' : 'base16-light'}
        lineNumbers={false}
        height={120}
        width="275px"
        ignoreBraces={true}
        onChange={(code) => editorSessionActions.updateNodeData(node.id, { code })}
        isMultiLineJs={false}
        enablePreview={false}
        usePortalEditor={false}
      />

      <div className="result-section">
        <label className="result-label">Results</label>
        <div style={{ width: '100%', height: '300px' }}>
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
