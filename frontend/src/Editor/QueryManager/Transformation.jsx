import React, { useState, useEffect } from 'react';
import 'codemirror/theme/base16-light.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/search/match-highlighter';
import 'codemirror/addon/hint/show-hint.css';
import { CodeHinter } from '../CodeBuilder/CodeHinter';
import { getRecommendation } from '../CodeBuilder/utils';
import { Popover, OverlayTrigger } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import Select from '@/_ui/Select';
import { useLocalStorageState } from '@/_hooks/use-local-storage';
import _ from 'lodash';
import { CustomToggleSwitch } from './CustomToggleSwitch';
import { queryManagerSelectComponentStyle } from '@/_ui/Select/styles';

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

  const [fetchingRecommendation, setFetchingRecommendation] = useState(false);

  const handleCallToGPT = async () => {
    setFetchingRecommendation(true);
    const query = state[lang];
    const recommendation = await getRecommendation(currentState, query);
    setFetchingRecommendation(false);
    changeOption('transformation', recommendation);
  };

  function toggleEnableTransformation() {
    setEnableTransformation((prev) => !prev);
    changeOption('enableTransformation', !enableTransformation);
  }

  useEffect(() => {
    if (lang !== (options.transformationLanguage ?? 'javascript')) {
      changeOption('transformationLanguage', lang);
      changeOption('transformation', state[lang]);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    if (options.enableTransformation) {
      lang !== (options.transformationLanguage ?? 'javascript') && changeOption('transformationLanguage', lang);
      setState({ ...state, [lang]: options.transformation ?? defaultValue[lang] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(options.transformation)]);

  useEffect(() => {
    const selectedQueryId = localStorage.getItem('selectedQuery') ?? null;

    if (queryId === 'draftQuery') {
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
  }, [queryId]);

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

  const computeSelectStyles = (darkMode, width) => {
    return {
      ...queryManagerSelectComponentStyle(darkMode, width),
      control: (provided) => ({
        ...provided,
        display: 'flex',
        boxShadow: 'none',
        backgroundColor: darkMode ? '#2b3547' : '#ffffff',
        borderRadius: '0 6px 6px 0',
        height: 32,
        minHeight: 32,
        borderWidth: '1px 1px 1px 0',
        cursor: 'pointer',
        borderColor: darkMode ? 'inherit' : ' #D7DBDF',
        '&:hover': {
          backgroundColor: darkMode ? '' : '#F8F9FA',
        },
        '&:active': {
          backgroundColor: darkMode ? '' : '#F8FAFF',
          borderColor: '#3E63DD',
          borderWidth: '1px 1px 1px 1px',
          boxShadow: '0px 0px 0px 2px #C6D4F9 ',
        },
      }),
    };
  };

  const popover = (
    <Popover id="transformation-popover-container">
      <p className="transformation-popover" data-cy={`transformation-popover`}>
        {t(
          'editor.queryManager.transformation.transformationToolTip',
          'Transformations can be enabled on queries to transform the query results. ToolJet allows you to transform the query results using two programming languages: JavaScript and Python'
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
    <div className="field  transformation-editor">
      <div className="align-items-center gap-2" style={{ display: 'flex', position: 'relative', height: '20px' }}>
        <div className="d-flex flex-fill">
          <div className="mb-0">
            <CustomToggleSwitch
              isChecked={enableTransformation}
              toggleSwitchFunction={toggleEnableTransformation}
              action="enableTransformation"
              darkMode={darkMode}
              dataCy={'transformation'}
            />
          </div>
          <span className="mx-1 font-weight-400 tranformation-label" data-cy={'label-query-transformation'}>
            {t('editor.queryManager.transformation.transformations', 'Transformations')}
          </span>
          <OverlayTrigger trigger="click" placement="top" overlay={popover} rootClose>
            <svg
              width="16.7"
              height="16.7"
              viewBox="0 0 20 21"
              fill="#3E63DD"
              xmlns="http://www.w3.org/2000/svg"
              style={{ cursor: 'pointer' }}
              data-cy={`transformation-info-icon`}
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
        <div className="d-flex">
          <span className="cursor-pointer" style={{ marginTop: '2px', marginRight: '5px' }} onClick={handleCallToGPT}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M8.49992 1.83325C8.49992 1.55711 8.27606 1.33325 7.99992 1.33325C7.72378 1.33325 7.49992 1.55711 7.49992 1.83325V3.49992C7.49992 3.77606 7.72378 3.99992 7.99992 3.99992C8.27606 3.99992 8.49992 3.77606 8.49992 3.49992V1.83325ZM8.49992 12.6666C8.49992 12.3904 8.27606 12.1666 7.99992 12.1666C7.72378 12.1666 7.49992 12.3904 7.49992 12.6666V14.1666C7.49992 14.4427 7.72378 14.6666 7.99992 14.6666C8.27606 14.6666 8.49992 14.4427 8.49992 14.1666V12.6666ZM12.714 3.28593C12.9092 3.48119 12.9092 3.79777 12.714 3.99303L11.5355 5.17154C11.3402 5.36681 11.0236 5.36681 10.8284 5.17154C10.6331 4.97628 10.6331 4.6597 10.8284 4.46444L12.0069 3.28593C12.2021 3.09066 12.5187 3.09066 12.714 3.28593ZM5.05367 11.6534C5.24893 11.4581 5.24893 11.1415 5.05367 10.9462C4.85841 10.751 4.54182 10.751 4.34656 10.9462L3.2859 12.0069C3.09064 12.2022 3.09064 12.5188 3.2859 12.714C3.48116 12.9093 3.79774 12.9093 3.99301 12.714L5.05367 11.6534ZM14.6666 7.99992C14.6666 8.27606 14.4427 8.49992 14.1666 8.49992H12.4999C12.2238 8.49992 11.9999 8.27606 11.9999 7.99992C11.9999 7.72378 12.2238 7.49992 12.4999 7.49992H14.1666C14.4427 7.49992 14.6666 7.72378 14.6666 7.99992ZM3.33325 8.49992C3.60939 8.49992 3.83325 8.27606 3.83325 7.99992C3.83325 7.72378 3.60939 7.49992 3.33325 7.49992H1.83325C1.55711 7.49992 1.33325 7.72378 1.33325 7.99992C1.33325 8.27606 1.55711 8.49992 1.83325 8.49992H3.33325ZM12.7141 12.714C12.5188 12.9092 12.2022 12.9092 12.007 12.714L10.8285 11.5355C10.6332 11.3402 10.6332 11.0236 10.8285 10.8284C11.0237 10.6331 11.3403 10.6331 11.5356 10.8284L12.7141 12.0069C12.9093 12.2021 12.9093 12.5187 12.7141 12.714ZM4.34648 5.05367C4.54175 5.24893 4.85833 5.24893 5.05359 5.05367C5.24885 4.85841 5.24885 4.54182 5.05359 4.34656L3.99293 3.2859C3.79767 3.09064 3.48109 3.09064 3.28582 3.2859C3.09056 3.48116 3.09056 3.79774 3.28582 3.99301L4.34648 5.05367Z"
                fill="#3E63DD"
              />
            </svg>
          </span>

          <p className="py-1">
            Powered by &nbsp;
            <text
              style={{
                color: '#3E63DD',
              }}
            >
              {' '}
              AI Copilot
            </text>
          </p>
        </div>
      </div>
      <br></br>
      {enableTransformation && (
        <div
          className="rounded-3"
          style={{ marginLeft: '3rem', marginBottom: '20px', background: `${darkMode ? '#272822' : '#F8F9FA'}` }}
        >
          <div className="py-3 px-3 d-flex justify-content-between">
            <div className="d-flex">
              <div className="d-flex align-items-center border transformation-language-select-wrapper">
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
                styles={computeSelectStyles(darkMode, 140)}
                useCustomStyles={true}
              />
            </div>
            <div className="mt-2">
              {fetchingRecommendation ? (
                <div className="spinner-border spinner-border-sm" role="status"></div>
              ) : (
                <span className="align-items-center">Load recommendations ⌘+L</span>
              )}
            </div>
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
            cyLabel={'transformation-input'}
          />
        </div>
      )}
    </div>
  );
};
