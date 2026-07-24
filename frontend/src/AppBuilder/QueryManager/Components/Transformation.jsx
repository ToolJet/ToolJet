import React, { useState, useEffect, useRef } from 'react';
import { Tab, ListGroup, Row, Col, Popover, OverlayTrigger } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
import { CustomToggleSwitch } from './CustomToggleSwitch';
import { authenticationService } from '@/_services';
import CodeHinter from '@/AppBuilder/CodeEditor';
import useStore from '@/AppBuilder/_stores/store';
import { v4 as uuidv4 } from 'uuid';

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

export const Transformation = ({ changeOption, options, darkMode, queryId, renderCopilot }) => {
  const [lang, setLang] = useState(options?.transformationLanguage ?? 'javascript');
  const [enableTransformation, setEnableTransformation] = useState(options.enableTransformation);
  const prevQueryId = useRef(queryId);
  const selectedQueryId = useStore((state) => state.selectedQuery?.id);
  const [codeEditorKey, setCodeEditorKey] = useState(uuidv4());
  const [state, setState] = useState({
    ...defaultValue,
    ...(options?.transformation ? { [options.transformationLanguage ?? 'javascript']: options?.transformation } : {}),
    ...options?.transformations,
  });
  const { t } = useTranslation();

  const { current_organization_name } = authenticationService.currentSessionValue;
  const currentOrgName = current_organization_name.replace(/\s/g, '').toLowerCase();
  const isCopilotEnabled = localStorage.getItem(`copilotEnabled-${currentOrgName}`) === 'true';

  useEffect(() => {
    if (lang !== (options.transformationLanguage ?? 'javascript')) {
      changeOption('transformationLanguage', lang);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    if (prevQueryId.current === queryId) {
      lang !== (options.transformationLanguage ?? 'javascript') && changeOption('transformationLanguage', lang);
      setState((prevState) => {
        return {
          ...prevState,
          ...(options?.transformation
            ? { [options.transformationLanguage ?? 'javascript']: options?.transformation }
            : {}),
          ...options?.transformations,
        };
      });
    }
    prevQueryId.current = queryId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(options?.transformation || {}), JSON.stringify(options.transformations)]);

  useEffect(() => {
    if (selectedQueryId !== queryId) {
      const olderTransformation = options?.transformation ? { [lang]: options?.transformation } : {};
      const finalState = _.merge({}, defaultValue, olderTransformation, options?.transformations);

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
      <div className="tw-flex tw-items-start">
        <CustomToggleSwitch
          isChecked={enableTransformation}
          toggleSwitchFunction={toggleEnableTransformation}
          action="enableTransformation"
          darkMode={darkMode}
          dataCy="transformation"
          classes={{ toggleSwitchContainer: 'tw-mt-0.5 tw-flex-grow-0' }}
        />

        <div>
          <OverlayTrigger
            trigger="click"
            placement="bottom"
            rootClose
            overlay={labelPopoverContent(darkMode, t)}
            container={document.getElementsByClassName('query-details')[0]}
          >
            <span
              style={{ textDecoration: 'underline 2px dotted', textDecorationColor: 'var(--slate8)' }}
              className="text-default"
              data-cy="transformation-label"
            >
              {t('editor.queryManager.transformation.enableTransformation', 'Enable transformation')}
            </span>
          </OverlayTrigger>

          <p className="tw-text-text-placeholder tw-mb-0" data-cy="transformation-info">
            Run JavaScript or Python on the query result to reshape, filter, or reformat data.
          </p>
        </div>
      </div>

      <br />

      <div className={`d-flex copilot-codehinter-wrap ${!enableTransformation && 'read-only-codehinter'}`}>
        <div className="col flex-grow-1">
          <div style={{ borderRadius: '6px', background: darkMode ? '#272822' : '#F8F9FA' }}>
            <div className="py-3 px-3 d-flex justify-content-between copilot-section-header">
              <Tab.Container
                activeKey={lang}
                onSelect={(value) => {
                  setLang(value);
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
                changeOption('transformations', { ...state, [lang]: value });
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
