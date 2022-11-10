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
import defaultStyles from '@/_ui/Select/styles';

import { useLocalStorageState } from '@/_hooks/use-local-storage';
import _ from 'lodash';

export const Transformation = ({ changeOption, currentState, options, darkMode, queryId }) => {
  const { t } = useTranslation();

  const [lang, setLang] = React.useState(options?.transformationLanguage ?? 'javascript');

  // console.log('from query manager', options);
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

  const style = {
    ...defaultStyles(darkMode),
    menu: (provided) => ({
      ...provided,
      backgroundColor: darkMode ? '#121212' : '#ffffff',
    }),
    option: (provided) => ({
      ...provided,
      backgroundColor: darkMode ? '#121212' : '#ffffff',
      color: darkMode ? '#697177' : '#889096',
      ':hover': {
        backgroundColor: darkMode ? '#404d66' : '#F1F3F5',
      },
    }),
    placeholder: (provided) => ({
      ...provided,
      color: darkMode ? '#697177' : '#889096',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: darkMode ? '#697177' : '#889096',
    }),
    menuPortal: (provided) => ({ ...provided, zIndex: 2000 }),
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
      setState({ ...state, [lang]: options.transformation });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(options.transformation)]);

  useEffect(() => {
    const selectedQueryId = localStorage.getItem('selectedQuery') ?? null;

    if (!options.enableTransformation) {
      setState(defaultValue);
      return;
    }
    if (selectedQueryId !== queryId) {
      const nonLangdefaultCode = getNonActiveTransformations(options?.transformationLanguage ?? 'javascript');
      const finalState = _.merge(
        {},
        { [options?.transformationLanguage ?? lang]: options.transformation },
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
    <div className="field transformation-editor">
      <div className=" align-items-center" style={{ display: 'flex', position: 'relative' }}>
        <div className="form-check form-switch mb-0">
          <input
            className="form-check-input"
            type="checkbox"
            onClick={toggleEnableTransformation}
            checked={enableTransformation}
          />
        </div>
        <span className="mx-1 font-weight-500">
          {t('editor.queryManager.transformation.transformations', 'Enable Transformations')}
        </span>
        <OverlayTrigger trigger="click" placement="top" overlay={popover} rootClose>
          <svg
            width="16.7"
            height="16.7"
            viewBox="0 0 20 21"
            fill="#3E63DD"
            xmlns="http://www.w3.org/2000/svg"
            style={{ cursor: 'pointer', marginLeft: '8.67px' }}
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M10 2.5C5.58172 2.5 2 6.08172 2 10.5C2 14.9183 5.58172 18.5 10 18.5C14.4183 18.5 18 14.9183 18 10.5C18 6.08172 14.4183 2.5 10 2.5ZM0 10.5C0 4.97715 4.47715 0.5 10 0.5C15.5228 0.5 20 4.97715 20 10.5C20 16.0228 15.5228 20.5 10 20.5C4.47715 20.5 0 16.0228 0 10.5ZM9 6.5C9 5.94772 9.44771 5.5 10 5.5H10.01C10.5623 5.5 11.01 5.94772 11.01 6.5C11.01 7.05228 10.5623 7.5 10.01 7.5H10C9.44771 7.5 9 7.05228 9 6.5ZM8 10.5C8 9.94771 8.44772 9.5 9 9.5H10C10.5523 9.5 11 9.94771 11 10.5V13.5C11.5523 13.5 12 13.9477 12 14.5C12 15.0523 11.5523 15.5 11 15.5H10C9.44771 15.5 9 15.0523 9 14.5V11.5C8.44772 11.5 8 11.0523 8 10.5Z"
              fill="#3E63DD"
            />
          </svg>
        </OverlayTrigger>
      </div>
      <br></br>
      {enableTransformation && (
        <div
          className="rounded-2"
          style={{ marginLeft: '3rem', marginBottom: '20px', background: `${darkMode ? '#1A1D1E' : '#F8F9FA'}` }}
        >
          <div className="py-3 px-3 d-flex">
            <div
              className="d-flex align-items-center border"
              style={{ background: darkMode ? '#26292B' : '#ECEEF0', borderRight: 'none', borderRadius: '6px 0 0 6px' }}
            >
              <span className="px-2">Language</span>
            </div>
            <Select
              options={[
                { name: 'JavaScript', value: 'javascript' },
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
              styles={style}
            />
          </div>
          <div className="border-top mx-3"></div>
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
            enablePreview={false}
          />
        </div>
      )}
    </div>
  );
};
