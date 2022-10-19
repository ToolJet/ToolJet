import React, { useState, useEffect } from 'react';
import 'codemirror/theme/base16-light.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/search/match-highlighter';
import 'codemirror/addon/hint/show-hint.css';
import { CodeHinter } from '../CodeBuilder/CodeHinter';
import { Popover, OverlayTrigger } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import Select from '@/_ui/Select';

export const Transformation = ({ changeOption, currentState, options, darkMode }) => {
  const { t } = useTranslation();

  const defaultValueForTransformation = {
    javascript: `// write your code here
// return value will be set as data and the original data will be available as rawData
return data.filter(row => row.amount > 1000);`,
    python: `# write your code here
# return value will be set as data and the original data will be available as rawData
return [row for row in data if row['amount'] > 1000]`,
  };

  const [lang, set] = React.useState(options?.transformationLanguage ?? 'javascript');
  const defaultValue = options.transformation ?? defaultValueForTransformation[lang];
  const [value, setValue] = useState(defaultValue);
  const [enableTransformation, setEnableTransformation] = useState(() => options.enableTransformation);

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

  useEffect(() => {
    if (lang !== options.transformationLanguage) {
      const defValue = defaultValueForTransformation[lang];
      setValue(defValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

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
            className="query-hinter mt-3"
            ignoreBraces={true}
            onChange={(value) => codeChanged(value)}
            componentName={`transformation`}
          />
        </div>
      )}
    </div>
  );
};
