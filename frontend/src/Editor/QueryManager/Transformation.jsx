import React, { useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import 'codemirror/theme/base16-light.css';
import { handleChange, onBeforeChange } from '../CodeBuilder/utils';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/search/match-highlighter';
import 'codemirror/addon/hint/show-hint.css';

export const Transformation = ({ changeOption, options, currentState }) => {
  const defaultValue = options.transformation
    || `// write your code here
// return value will be set as data and the original data will be available as rawData
return data.filter(row => row.amount > 1000);`;

  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  function codeChanged(value) {
    changeOption('transformation', value);
  }

  return (
    <div className="field mb-2 transformation-editor">
      <label className="form-check form-switch my-2">
        <input
          className="form-check-input"
          type="checkbox"
          onClick={() => changeOption('enableTransformation', !options.enableTransformation)}
          checked={options.enableTransformation}
        />
        <span className="form-check-label">Transformations</span>
      </label>
      {!options.enableTransformation && (
        <div className="alert alert-info" role="alert">
          Transformations can be used to transform the results of queries.
        </div>
      )}
      <br></br>
      {options.enableTransformation && (
        <div>
          <CodeMirror
            height="220px"
            fontSize="1"
            onChange={(editor) => handleChange(editor, codeChanged, currentState)}
            onBeforeChange={(editor, change) => onBeforeChange(editor, change)}
            value={value}
            options={{
              theme: 'base16-light',
              mode: 'javascript',
              lineWrapping: true,
              scrollbarStyle: null,
              highlightSelectionMatches: true,
            }}
          />
        </div>

      )}
    </div>
  );
};
