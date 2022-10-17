import React, { useState, useEffect } from 'react';
import 'codemirror/theme/base16-light.css';
// import { getSuggestionKeys } from '../CodeBuilder/utils';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/search/match-highlighter';
import 'codemirror/addon/hint/show-hint.css';
import { CodeHinter } from '../CodeBuilder/CodeHinter';
import { Popover, OverlayTrigger } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import Select from '@/_ui/Select';
// import { loadPyodide } from 'pyodide';

export const Transformation = ({ changeOption, currentState, options, darkMode }) => {
  const { t } = useTranslation();

  const defaultValueForTransformation = {
    javascript: `// write your code here
    // return value will be set as data and the original data will be available as rawData
    return data.filter(row => row.amount > 1000);`,
    python: `# write your code here`,
  };

  const [value, setValue] = useState(defaultValue);
  const [enableTransformation, setEnableTransformation] = useState(() => options.enableTransformation);

  const [lang, set] = React.useState(options?.transformationLanguage ?? 'javascript');
  const defaultValue = options.transformation ?? defaultValueForTransformation[lang];
  function codeChanged(value) {
    setValue(() => value);
    changeOption('transformation', value);
  }

  function toggleEnableTransformation() {
    setEnableTransformation((prev) => !prev);
    changeOption('enableTransformation', !enableTransformation);
  }

  const popover = (
    <Popover id="transformation-popover-container">
      <p className="transformation-popover">
        {t(
          'editor.queryManager.transformation.transformationToolTip',
          'Transformations can be used to transform the results of queries. All the app variables are accessible from transformers and supports JS libraries such as Lodash & Moment.'
        )}
        <br />
        <a href="https://docs.tooljet.io/docs/tutorial/transformations" target="_blank" rel="noreferrer">
          {t('globals.readDocumentation', 'Read documentation')}
        </a>
        .
      </p>
    </Popover>
  );

  return (
    <div className="field mb-2 transformation-editor">
      <div className="mb-2" style={{ display: 'flex', position: 'relative' }}>
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            onClick={toggleEnableTransformation}
            checked={enableTransformation}
          />
        </div>
        <OverlayTrigger trigger="click" placement="top" overlay={popover} rootClose>
          <span
            style={{
              fontWeight: 400,
              borderBottom: '1px dashed #3e525b',
              position: 'absolute',
              left: '50px',
              top: '-3px',
            }}
            className="form-check-label mx-1"
          >
            {t('editor.queryManager.transformation.transformations', 'Transformations')}
          </span>
        </OverlayTrigger>
      </div>
      <br></br>
      {enableTransformation && (
        <div>
          <Select
            options={[
              { name: 'Python', value: 'python' },
              { name: 'Javascript', value: 'javascript' },
            ]}
            value={lang}
            search={true}
            onChange={(value) => {
              set(value);
              changeOption('transformationLanguage', value);
            }}
            placeholder={t('globals.select', 'Select') + '...'}
          />

          <CodeHinter
            currentState={currentState}
            initialValue={value}
            mode={lang}
            theme={darkMode ? 'monokai' : 'base16-light'}
            lineNumbers={true}
            height={'300px'}
            className="query-hinter"
            ignoreBraces={true}
            onChange={(value) => codeChanged(value)}
            componentName={`transformation`}
          />
        </div>
      )}
    </div>
  );
};

// const usePythonExecution = ({ code }) => {
//   // const [increment, setIncrement] = useState(0);

//   var pythonCode = JSON.parse(JSON.stringify(code));

//   //remove line gaps
//   pythonCode = pythonCode.replace(/(\r\n|\n|\r)/gm, '');

//   console.log('pyodideOutput pythonCode ==>', pythonCode);
//   var evaluatingMessage = 'evaluating…';

//   const indexURL = 'https://cdn.jsdelivr.net/pyodide/dev/full/';
//   const pyodide = React.useRef(null);
//   const [isPyodideLoading, setIsPyodideLoading] = useState(true);
//   const [pyodideOutput, setPyodideOutput] = useState(evaluatingMessage);
//   // load pyodide wasm module and initialize it
//   useEffect(() => {
//     (async function () {
//       pyodide.current = await window.loadPyodide({ indexURL });
//       setIsPyodideLoading(false);
//     })();
//   }, [pyodide]);

//   // evaluate python code with pyodide and set output
//   useEffect(() => {
//     if (!isPyodideLoading) {
//       const evaluatePython = async (pyodide, pythonCode) => {
//         try {
//           return await pyodide.runPython(pythonCode);
//         } catch (error) {
//           console.error(error);
//           return 'Error evaluating Python code. See console for details.';
//         }
//       };
//       (async function () {
//         setPyodideOutput(await evaluatePython(pyodide.current, pythonCode));
//       })();
//     }
//   }, [isPyodideLoading, pyodide, pythonCode]);

//   console.log('pyodideOutput output ==>', pyodideOutput);

//   return [isPyodideLoading, pyodideOutput];
// };
