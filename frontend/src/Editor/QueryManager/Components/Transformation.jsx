import React, { useState, useEffect } from 'react';
import 'codemirror/theme/base16-light.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/search/match-highlighter';
import 'codemirror/addon/hint/show-hint.css';
import { CodeHinter } from '@/Editor/CodeBuilder/CodeHinter';
import { Tab, ListGroup, Row, Col } from 'react-bootstrap';
import { useLocalStorageState } from '@/_hooks/use-local-storage';
import _ from 'lodash';
import { CustomToggleSwitch } from './CustomToggleSwitch';

const noop = () => {};

export const Transformation = ({ changeOption, options, darkMode, queryId }) => {
  const [lang, setLang] = React.useState(options?.transformationLanguage ?? 'javascript');

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

  const [enableTransformation, setEnableTransformation] = useState(() => options.enableTransformation);

  const [state, setState] = useLocalStorageState('transformation', defaultValue);

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

  return (
    <div className="field  transformation-editor">
      <div className="align-items-center gap-2" style={{ display: 'flex', position: 'relative', height: '20px' }}>
        <div className="d-flex flex-fill">
          <div className="flex-grow-l">
            <div className=" d-flex flex-column">
              <div className="mb-0">
                <span className="d-flex">
                  <CustomToggleSwitch
                    isChecked={enableTransformation}
                    toggleSwitchFunction={toggleEnableTransformation}
                    action="enableTransformation"
                    darkMode={darkMode}
                    dataCy={'transformation'}
                  />
                  <span className="ps-1">Enable transformation</span>
                </span>
              </div>
              <div className="d-flex  text-placeholder justify-content-end">
                <p>Powered by AI copilot </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <br></br>
      <div className="d-flex copilot-codehinter-wrap">
        <div className="form-label"></div>
        <div className="col flex-grow-1">
          {enableTransformation && (
            <div
              style={{ borderRadius: '6px', marginBottom: '20px', background: `${darkMode ? '#272822' : '#F8F9FA'}` }}
            >
              <div className="py-3 px-3 d-flex justify-content-between copilot-section-header">
                <div className="right">
                  <Tab.Container
                    activeKey={lang}
                    onSelect={(value) => {
                      setLang(value);
                      changeOption('transformationLanguage', value);
                      changeOption('transformation', state[value]);
                    }}
                    defaultActiveKey="JavaScript"
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
                                data-cy={`preview-tab-${String(tab).toLowerCase()}`}
                                style={{ width: '100%' }}
                                className="rounded"
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
              </div>
              <div className="codehinter-border-bottom mx-3"></div>
              <CodeHinter
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
                callgpt={noop}
                isCopilotEnabled={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
