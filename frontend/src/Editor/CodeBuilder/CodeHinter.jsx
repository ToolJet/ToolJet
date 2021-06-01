import React, { useEffect, useMemo, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import 'codemirror/mode/handlebars/handlebars';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/sql/sql';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/display/placeholder';
import 'codemirror/addon/search/match-highlighter';
import 'codemirror/addon/hint/show-hint.css';
import 'codemirror/theme/base16-light.css';
import 'codemirror/theme/duotone-light.css';
import { getSuggestionKeys, onBeforeChange, handleChange } from './utils';

export function CodeHinter({
  initialValue, onChange, currentState, mode, theme, lineNumbers, className, placeholder
}) {
  const options = {
    lineNumbers: lineNumbers,
    singleLine: true,
    mode: mode || 'handlebars',
    tabSize: 2,
    theme: theme || 'default',
    readOnly: false,
    highlightSelectionMatches: true,
    placeholder
  };

  const [realState, setRealState] = useState(currentState);

  useEffect(() => {
    setRealState(currentState);
  }, [currentState.components]);

  let suggestions = useMemo(() => {
    return getSuggestionKeys(currentState);
  }, [currentState.components, currentState.queries]);

  return (
    <div className={`code-hinter ${className || 'codehinter-default-input'}`}>
      <CodeMirror
        value={initialValue}
        realState={realState}
        scrollbarStyle={null}
        onBlur={(editor) => { 
          const value = editor.getValue();
          onChange(value);
        }}
        onChange={(editor) => handleChange(editor, onChange, suggestions)}
        onBeforeChange={(editor, change) => onBeforeChange(editor, change)}
        options={options}
      />
    </div>
  );
}
