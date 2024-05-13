import React from 'react';
import CodeHinter from '@/Editor/CodeEditor';

export default function IfConditionNodeConfiguration({ node, darkMode, editorSessionActions }) {
  return (
    <div className="if-condition-modal-content d-flex justify-content-center">
      <span className="title">If condition</span>
      <CodeHinter
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
      />
    </div>
  );
}
