import React, { useState, useEffect } from 'react';
import 'codemirror/theme/base16-light.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/search/match-highlighter';
import 'codemirror/addon/hint/show-hint.css';
import { CodeHinter } from '@/Editor/CodeBuilder/CodeHinter';
import { getRecommendation } from '@/Editor/CodeBuilder/utils';
import { Popover, OverlayTrigger, Row } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import Select from '@/_ui/Select';
import { useLocalStorageState } from '@/_hooks/use-local-storage';
import _ from 'lodash';
import { CustomToggleSwitch } from './CustomToggleSwitch';
import { queryManagerSelectComponentStyle } from '@/_ui/Select/styles';
import { Button } from '@/_ui/LeftSidebar';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { authenticationService } from '@/_services';

export const Transformation = ({ changeOption, currentState, options, darkMode, queryId }) => {
  const { t } = useTranslation();
  const { current_organization_name } = authenticationService.currentSessionValue;
  const currentOrgName = current_organization_name.replace(/\s/g, '').toLowerCase();

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
  const isCopilotEnabled = localStorage.getItem(`copilotEnabled-${currentOrgName}`) === 'true';

  const handleCallToGPT = async () => {
    setFetchingRecommendation(true);
    const query = state[lang];
    const recommendation = await getRecommendation(currentState, query, lang);
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

  const popoverForRecommendation = (
    <Popover id="transformation-popover-container">
      <div className="transformation-popover card text-center">
        <img src="/assets/images/icons/copilot.svg" alt="AI copilot" height={64} width={64} />
        <div className="d-flex flex-column card-body">
          <h4 className="mb-2">ToolJet x OpenAI</h4>
          <p className="mb-2">
            <strong style={{ fontWeight: 700, color: '#3E63DD' }}>AI copilot</strong> helps you write your queries
            faster. It uses OpenAI&apos;s GPT-3.5 to suggest queries based on your data.
          </p>

          <Button
            onClick={() => window.open('https://docs.tooljet.com/docs/tooljet-copilot', '_blank')}
            darkMode={darkMode}
            size="sm"
            classNames="default-secondary-button"
            styles={{ width: '100%', fontSize: '12px', fontWeight: 700, borderColor: darkMode && 'transparent' }}
          >
            <Button.Content title={'Read more'} />
          </Button>
        </div>
      </div>
    </Popover>
  );

  const EducativeLebel = () => {
    const title = () => {
      return (
        <>
          Powered by <strong style={{ fontWeight: 700, color: '#3E63DD' }}>AI copilot</strong>
        </>
      );
    };
    return (
      <div className="d-flex opacity-30">
        <Button.UnstyledButton styles={{ height: '28px' }} darkMode={darkMode} classNames="mx-1">
          <Button.Content title={title} iconSrc={'assets/images/icons/flash.svg'} direction="left" />
        </Button.UnstyledButton>
        <OverlayTrigger trigger="click" placement="left" overlay={popoverForRecommendation} rootClose>
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
    );
  };

  return (
    <div className="field  transformation-editor">
      <div className="align-items-center gap-2" style={{ display: 'flex', position: 'relative', height: '20px' }}>
        <div className="d-flex flex-fill row">
          <span className="font-weight-400 tranformation-label col-sm-3" data-cy={'label-query-transformation'}>
            {t('editor.queryManager.transformation.transformations', 'Transformations')}
          </span>
          <div className="col-sm-9">
            <div className=" d-flex">
              <div className="mb-0">
                <span className="d-flex">
                  <CustomToggleSwitch
                    isChecked={enableTransformation}
                    toggleSwitchFunction={toggleEnableTransformation}
                    action="enableTransformation"
                    darkMode={darkMode}
                    dataCy={'transformation'}
                  />
                  <span className="ps-1">Enable</span>
                </span>
              </div>
              <EducativeLebel />
            </div>
            <div></div>
          </div>
        </div>
      </div>
      <br></br>
      <Row>
        <div className="col-md-3"></div>
        <div className="col-md-9">
          {enableTransformation && (
            <div
              className="rounded-3"
              style={{ marginBottom: '20px', background: `${darkMode ? '#272822' : '#F8F9FA'}` }}
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

                <div
                  data-tooltip-id="tooltip-for-active-copilot"
                  data-tooltip-content="Activate Copilot in the workspace settings"
                >
                  <Button
                    onClick={handleCallToGPT}
                    darkMode={darkMode}
                    size="sm"
                    classNames={`${fetchingRecommendation ? (darkMode ? 'btn-loading' : 'button-loading') : ''}`}
                    styles={{
                      width: '100%',
                      fontSize: '12px',
                      fontWeight: 500,
                      borderColor: darkMode && 'transparent',
                    }}
                    disabled={!isCopilotEnabled}
                  >
                    <Button.Content title={'Generate code'} />
                  </Button>
                </div>

                {!isCopilotEnabled && (
                  <ReactTooltip
                    id="tooltip-for-active-copilot"
                    className="tooltip"
                    style={{ backgroundColor: '#e6eefe', color: '#222' }}
                  />
                )}
              </div>
              <div className="border-top mx-3"></div>
              <CodeHinter
                currentState={currentState}
                initialValue={state[lang]}
                mode={lang}
                theme={darkMode ? 'monokai' : 'base16-light'}
                lineNumbers={true}
                height={'300px'}
                className="query-hinter"
                ignoreBraces={true}
                onChange={(value) => changeOption('transformation', value)}
                componentName={`transformation`}
                cyLabel={'transformation-input'}
                callgpt={handleCallToGPT}
                isCopilotEnabled={isCopilotEnabled}
              />
            </div>
          )}
        </div>
      </Row>
    </div>
  );
};
