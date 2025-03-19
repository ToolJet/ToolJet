import React, { useState, useEffect, useRef } from 'react';
import { Tab, ListGroup, Row, Col, Popover, OverlayTrigger } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
import { CustomToggleSwitch } from './CustomToggleSwitch';
import { Button } from '@/_ui/LeftSidebar';
import Information from '@/_ui/Icon/solidIcons/Information';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { authenticationService } from '@/_services';
import CodeHinter from '@/AppBuilder/CodeEditor';
import useStore from '@/AppBuilder/_stores/store';
import { v4 as uuidv4 } from 'uuid';
import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';

const noop = () => {};

const defaultValue = {
  javascript: `// write your code here
// return value will be set as data and the original data will be available as rawData
return data.filter(row => row.amount > 1000);
  `,
  python: `# write your code here
# return value will be set as data and the original data will be available as rawData
[row for row in data if row['amount'] > 1000]
  `,
};

const labelPopoverContent = (darkMode, t) => (
  <Popover
    id="transformation-popover-container"
    className={`${darkMode && 'popover-dark-themed theme-dark dark-theme tj-dark-mode'} p-0`}
  >
    <p className="transformation-popover" data-cy="transformation-popover">
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

const getNonActiveTransformations = (activeLang) => {
  switch (activeLang) {
    case 'javascript':
      return { python: defaultValue.python };
    case 'python':
      return { javascript: defaultValue.javascript };
    default:
      return {};
  }
};

const EducativeLabel = ({ darkMode }) => {
  const popoverContent = (
    <Popover
      id="transformation-popover-container"
      className={`${darkMode && 'popover-dark-themed theme-dark dark-theme'} p-0`}
    >
      <div className={`transformation-popover card text-center ${darkMode && 'tj-dark-mode'}`}>
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
            <Button.Content title="Read more" />
          </Button>
        </div>
      </div>
    </Popover>
  );

  return (
    <div>
      <OverlayTrigger
        overlay={popoverContent}
        rootClose
        trigger="click"
        placement="right"
        container={document.getElementsByClassName('query-details')[0]}
      >
        <span style={{ cursor: 'pointer', marginLeft: '10px' }} data-cy="transformation-info-icon" className="lh-1">
          <Information width={18} fill="#CCD1D5" style={{ position: 'absolute', left: '152px' }} />
        </span>
      </OverlayTrigger>
    </div>
  );
};

export const Transformation = ({ changeOption, options, darkMode, queryId, renderCopilot }) => {
  const [lang, setLang] = useState(options?.transformationLanguage ?? 'javascript');
  const [enableTransformation, setEnableTransformation] = useState(options.enableTransformation);
  const prevQueryId = useRef(queryId);
  const selectedQueryId = useStore((state) => state.selectedQuery?.id);
  const [codeEditorKey, setCodeEditorKey] = useState(uuidv4());
  const [state, setState] = useState({
    ...defaultValue,
    [options.transformationLanguage ?? 'javascript']: options?.transformation,
  });
  const { t } = useTranslation();

  const { current_organization_name } = authenticationService.currentSessionValue;
  const currentOrgName = current_organization_name.replace(/\s/g, '').toLowerCase();
  const isCopilotEnabled = localStorage.getItem(`copilotEnabled-${currentOrgName}`) === 'true';

  useEffect(() => {
    if (lang !== (options.transformationLanguage ?? 'javascript')) {
      changeOption('transformationLanguage', lang);
      changeOption('transformation', state[lang]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    if (prevQueryId.current === queryId) {
      lang !== (options.transformationLanguage ?? 'javascript') && changeOption('transformationLanguage', lang);
      setState({ ...state, [lang]: options.transformation ?? state[lang] ?? defaultValue[lang] });
    }
    prevQueryId.current = queryId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(options.transformation)]);

  useEffect(() => {
    if (selectedQueryId !== queryId) {
      const nonLangdefaultCode = getNonActiveTransformations(options?.transformationLanguage ?? 'javascript');
      const finalState = _.merge(
        {},
        { [options?.transformationLanguage ?? lang]: options.transformation ?? defaultValue[lang] },
        nonLangdefaultCode
      );

      setState(finalState);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryId]);

  const toggleEnableTransformation = () => {
    const newEnableTransformation = !enableTransformation;
    setEnableTransformation(newEnableTransformation);
    changeOption('enableTransformation', newEnableTransformation);
  };

  useEffect(() => {
    setEnableTransformation(options.enableTransformation);
  }, [options.enableTransformation]);

  useEffect(() => {
    setCodeEditorKey(uuidv4());
  }, [lang, queryId]);

  return (
    <div className="field transformation-editor">
      <div className="align-items-center gap-2 d-flex" style={{ position: 'relative', height: '20px' }}>
        <div className="d-flex flex-column">
          <div className="mb-0">
            <span className="d-flex">
              <CustomToggleSwitch
                isChecked={enableTransformation}
                toggleSwitchFunction={toggleEnableTransformation}
                action="enableTransformation"
                darkMode={darkMode}
                dataCy="transformation"
              />
              <OverlayTrigger
                trigger="click"
                placement="bottom"
                rootClose
                overlay={labelPopoverContent(darkMode, t)}
                container={document.getElementsByClassName('query-details')[0]}
              >
                <span
                  style={{ textDecoration: 'underline 2px dotted', textDecorationColor: 'var(--slate8)' }}
                  className="ps-1 text-default"
                >
                  {t('editor.queryManager.transformation.enableTransformation', 'Enable transformation')}
                </span>
              </OverlayTrigger>
            </span>
          </div>
          <div className="d-flex text-placeholder justify-content-end">
            <p>Powered by AI copilot</p>
            <EducativeLabel darkMode={darkMode} />
          </div>
        </div>
      </div>
      <br />
      <div className={`d-flex copilot-codehinter-wrap ${!enableTransformation && 'read-only-codehinter'}`}>
        <div className="col flex-grow-1">
          <div style={{ borderRadius: '6px', marginBottom: '20px', background: darkMode ? '#272822' : '#F8F9FA' }}>
            <div className="py-3 px-3 d-flex justify-content-between copilot-section-header">
              <Tab.Container
                activeKey={lang}
                onSelect={(value) => {
                  setLang(value);
                  changeOption('transformationLanguage', value);
                  changeOption('transformation', state[value]);
                }}
                defaultActiveKey="javascript"
              >
                <Row className="m-0">
                  <Col className="keys text-center d-flex align-items-center">
                    <ListGroup
                      className={`query-preview-list-group rounded ${darkMode ? 'dark' : ''}`}
                      variant="flush"
                      style={{ backgroundColor: '#ECEEF0', padding: '2px' }}
                    >
                      {['JavaScript', 'Python'].map((tab) => (
                        <ListGroup.Item
                          key={tab}
                          eventKey={tab.toLowerCase()}
                          style={{ minWidth: '74px', textAlign: 'center' }}
                          className="rounded"
                          disabled={!enableTransformation}
                        >
                          <span
                            data-cy={`preview-tab-${tab.toLowerCase()}`}
                            className="rounded"
                            style={{ width: '100%' }}
                          >
                            {tab}
                          </span>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </Col>
                </Row>
              </Tab.Container>
            </div>
            <div className="codehinter-border-bottom mx-3"></div>
            <CodeHinter
              type="multiline"
              initialValue={state[lang] ?? ''}
              lang={lang}
              lineNumbers={true}
              key={codeEditorKey}
              height={400}
              className="query-hinter"
              onChange={(value) => {
                changeOption('transformation', value);
              }}
              renderCopilot={renderCopilot}
              componentName={`transformation`}
              cyLabel={'transformation-input'}
              // callgpt={handleCallToGPT}
              isCopilotEnabled={isCopilotEnabled}
              delayOnChange={false}
              readOnly={!enableTransformation}
              editable={enableTransformation}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
