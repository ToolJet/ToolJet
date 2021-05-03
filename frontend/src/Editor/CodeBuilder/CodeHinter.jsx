import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import 'codemirror/mode/handlebars/handlebars';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/search/match-highlighter';
import 'codemirror/addon/hint/show-hint.css';
import { onBeforeChange, handleChange } from './utils';

export function CodeHinter({
  initialValue, onChange, currentState
}) {
  const options = {
    lineNumbers: false,
    singleLine: true,
    mode: 'handlebars',
    tabSize: 2,
    readOnly: false,
    highlightSelectionMatches: true
  };

  return (
    <div className="code-hinter form-control">
      <CodeMirror
        value={initialValue}
        scrollbarStyle={null}
        onChange={(editor) => handleChange(editor, onChange, currentState)}
        onBeforeChange={(editor, change) => onBeforeChange(editor, change)}
        options={options}
      />
    </div>
  );
}