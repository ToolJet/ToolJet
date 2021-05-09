import React, { useEffect, useMemo, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import 'codemirror/mode/handlebars/handlebars';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/search/match-highlighter';
import 'codemirror/addon/hint/show-hint.css';
import { getSuggestionKeys, onBeforeChange, handleChange } from './utils';

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

  const [realState, setRealState] = useState(currentState);

  useEffect(() => {
    setRealState(currentState);
  }, [currentState.components]);

  let suggestions = useMemo(() => {
    return getSuggestionKeys(currentState);
  }, [currentState.components, currentState.queries]);

  return (
    <div className="code-hinter form-control">
      <CodeMirror
        value={initialValue}
        realState={realState}
        scrollbarStyle={null}
        onChange={(editor) => handleChange(editor, onChange, suggestions)}
        onBeforeChange={(editor, change) => onBeforeChange(editor, change)}
        options={options}
      />
    </div>
  );
}
