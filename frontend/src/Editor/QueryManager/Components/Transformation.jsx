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
import Information from '@/_ui/Icon/solidIcons/Information';

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

  return (
    <div className="field  transformation-editor">
      <div className="align-items-center gap-2" style={{ display: 'flex', position: 'relative', height: '20px' }}>
        <div className="d-flex flex-fill row">
          <span className="color-slate9 col-sm-3 font-weight-500" data-cy={'label-query-transformation'}>
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
              <EducativeLebel popoverForRecommendation={popoverForRecommendation} darkMode={darkMode} />
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

const EducativeLebel = ({ popoverForRecommendation, darkMode }) => {
  const title = () => {
    return (
      <>
        Powered by <strong style={{ fontWeight: 700, color: '#3E63DD' }}>AI copilot</strong>
      </>
    );
  };
  return (
    <div className="d-flex">
      <Button.UnstyledButton styles={{ height: '28px' }} darkMode={darkMode} classNames="mx-1">
        <Button.Content title={title} iconSrc={'assets/images/icons/flash.svg'} direction="left" />
      </Button.UnstyledButton>
      <OverlayTrigger overlay={popoverForRecommendation} trigger="click">
        <span style={{ cursor: 'pointer' }} data-cy={`transformation-info-icon`} className="lh-1">
          <Information width={18} fill={'var(--indigo9)'} />
        </span>
      </OverlayTrigger>
    </div>
  );
};
