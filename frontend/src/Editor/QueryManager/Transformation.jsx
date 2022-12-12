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
import { useLocalStorageState } from '@/_hooks/use-local-storage';
import _ from 'lodash';

export const Transformation = ({ changeOption, currentState, options, darkMode, queryId }) => {
  const { t } = useTranslation();

  const [lang, setLang] = React.useState(options?.transformationLanguage ?? 'javascript');

  const defaultValue = {
    javascript: `// write your code here
// return value will be set as data and the original data will be available as rawData
return data.filter(row => row.amount > 1000);
    `,
    python: `# write your code here
# return value will be set as data and the original data will be available as rawData
return [row for row in data if row['amount'] > 1000]
    `,
  };

  const [enableTransformation, setEnableTransformation] = useState(() => options.enableTransformation);

  const [state, setState] = useLocalStorageState('transformation', defaultValue);

  function toggleEnableTransformation() {
    setEnableTransformation((prev) => !prev);
    changeOption('enableTransformation', !enableTransformation);
  }

  useEffect(() => {
    if (lang !== options.transformationLanguage) {
      changeOption('transformationLanguage', lang);
      changeOption('transformation', state[lang]);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    if (options.enableTransformation) {
      changeOption('transformationLanguage', lang);
      setState({ ...state, [lang]: options.transformation ?? defaultValue[lang] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(options.transformation)]);

  useEffect(() => {
    const selectedQueryId = localStorage.getItem('selectedQuery') ?? null;

    if (!options.enableTransformation || !queryId) {
      setState(defaultValue);
      return;
    }
    if (selectedQueryId !== queryId) {
      const nonLangdefaultCode = getNonActiveTransformations(options?.transformationLanguage ?? 'javascript');
      const finalState = _.merge(
        {},
        { [options?.transformationLanguage ?? lang]: options.transformation ?? defaultValue[lang] },
        nonLangdefaultCode
      );

      setState(finalState);
      return localStorage.setItem('selectedQuery', queryId);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.enableTransformation, queryId]);

  function getNonActiveTransformations(activeLang) {
    switch (activeLang) {
      case 'javascript':
        return {
          python: defaultValue.python,
        };
      case 'python':
        return {
          javascript: defaultValue.javascript,
        };

      default:
        break;
    }
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
            data-cy={'toggle-query-transformation'}
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
            data-cy={'label-query-transformation'}
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
              { name: 'Javascript', value: 'javascript' },
              { name: 'Python', value: 'python' },
            ]}
            value={lang}
            search={true}
            onChange={(value) => {
              setLang(value);
              changeOption('transformationLanguage', value);
              changeOption('transformation', state[value]);
            }}
            placeholder={t('globals.select', 'Select') + '...'}
          />

          <CodeHinter
            currentState={currentState}
            initialValue={state[lang]}
            mode={lang}
            theme={darkMode ? 'monokai' : 'base16-light'}
            lineNumbers={true}
            height={'300px'}
            className="query-hinter mt-3"
            ignoreBraces={true}
            onChange={(value) => changeOption('transformation', value)}
            componentName={`transformation`}
            cyLabel={'transformation-input'}
          />
        </div>
      )}
    </div>
  );
};
