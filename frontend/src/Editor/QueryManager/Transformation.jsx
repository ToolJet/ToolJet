import React, { useState } from 'react';
import 'codemirror/theme/base16-light.css';
// import { getSuggestionKeys } from '../CodeBuilder/utils';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/search/match-highlighter';
import 'codemirror/addon/hint/show-hint.css';
import { CodeHinter } from '../CodeBuilder/CodeHinter';

export const Transformation = ({ changeOption, currentState, options, darkMode }) => {
  const defaultValue =
    options.transformation ||
    `// write your code here
// return value will be set as data and the original data will be available as rawData
return data.filter(row => row.amount > 1000);`;

  const [value, setValue] = useState(defaultValue);
  const [enableTransformation, setEnableTransformation] = useState(() => options.enableTransformation);

  // let suggestions = useMemo(() => getSuggestionKeys(currentState), [currentState.components, currentState.queries]);
  function codeChanged(value) {
    setValue(() => value);
    changeOption('transformation', value);
  }

  function toggleEnableTransformation() {
    setEnableTransformation((prev) => !prev);
    changeOption('enableTransformation', !enableTransformation);
  }

  return (
    <div className="field mb-2 transformation-editor">
      <label className="form-check form-switch my-2">
        <input
          className="form-check-input"
          type="checkbox"
          onClick={toggleEnableTransformation}
          checked={enableTransformation}
        />
        <span className="form-check-label">Transformations</span>
      </label>
      {!enableTransformation && (
        <div>
          <div className="alert alert-success" role="alert">
            Transformations can be used to transform the results of queries. All the app variables are accessible from
            transformers and supports JS libraries such as Lodash & Moment.{' '}
            <a href="https://docs.tooljet.io/docs/tutorial/transformations" target="_blank" rel="noreferrer">
              Read documentation
            </a>
            .
          </div>
        </div>
      )}
      <br></br>
      {enableTransformation && (
        <div>
          <CodeHinter
            currentState={currentState}
            initialValue={value}
            mode="javascript"
            theme={darkMode ? 'monokai' : 'base16-light'}
            lineNumbers={true}
            className="query-hinter"
            ignoreBraces={true}
            onChange={(value) => codeChanged(value)}
          />
        </div>
      )}
    </div>
  );
};
