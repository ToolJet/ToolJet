import React from 'react';
import Headers from './TabHeaders';
import Params from './TabParams';
import Body from './TabBody';
import Cookies from './TabCookies';
import { Tab, ListGroup, Row } from 'react-bootstrap';
import { CustomToggleSwitch } from '@/Editor/QueryManager/Components/CustomToggleSwitch';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

function ControlledTabs({
  options,
  theme,
  onChange,
  onRawBodyChange,
  removeKeyValuePair,
  addNewKeyValuePair,
  darkMode,
  componentName,
  setBodyToggle,
  bodyToggle,
  onInputChange,
}) {
  const [key, setKey] = React.useState('headers');
  const tabs = ['Headers', 'Params', 'Body', 'Cookies'];

  return (
    <Tab.Container activeKey={key} onSelect={(k) => setKey(k)} defaultActiveKey="headers">
      <Row className="tw-ml-0">
        <div className="keys d-flex justify-content-between query-pane-tabs-header">
          <ListGroup className="query-pane-rest-api-keys-list-group mx-1 mb-2" variant="flush">
            {tabs.map((tab) => (
              <ListGroup.Item key={tab} eventKey={tab.toLowerCase()}>
                <span>{tab}</span>
              </ListGroup.Item>
            ))}
          </ListGroup>
          <div className="text-nowrap d-flex align-items-center">
            {key === 'body' && (
              <>
                Raw &nbsp;&nbsp;
                <CustomToggleSwitch
                  toggleSwitchFunction={setBodyToggle}
                  action="bodyToggle"
                  darkMode={darkMode}
                  isChecked={bodyToggle}
                />
              </>
            )}
            <ButtonSolid
              onClick={() => addNewKeyValuePair(key === 'params' ? 'url_params' : key)}
              id="runjs-param-add-btn"
              data-cy={`runjs-add-param-button`}
              variant="ghostBlack"
              size="sm"
              leftIcon="plus"
              fill={darkMode ? 'var(--icons-default)' : bodyToggle && key === 'body' ? '#E4E7EB' : '#6A727C'}
              iconWidth="18"
              disabled={bodyToggle && key === 'body'}
              className="tw-px-[6px]"
            />
          </div>
        </div>

        <div className="col tw-pl-0">
          <Tab.Content bsPrefix="rest-api-tab-content" className="query-manager-border-color rounded">
            <Tab.Pane eventKey="headers" t bsPrefix="rest-api-tabpanes" transition={false}>
              <Headers
                removeKeyValuePair={removeKeyValuePair}
                addNewKeyValuePair={addNewKeyValuePair}
                onChange={onChange}
                options={options['headers']}
                theme={theme}
                darkMode={darkMode}
                componentName={componentName}
                onInputChange={onInputChange}
              />
            </Tab.Pane>
            <Tab.Pane eventKey="params" bsPrefix="rest-api-tabpanes" transition={false}>
              <Params
                removeKeyValuePair={removeKeyValuePair}
                addNewKeyValuePair={addNewKeyValuePair}
                onChange={onChange}
                options={options['url_params']}
                theme={theme}
                darkMode={darkMode}
                componentName={componentName}
                onInputChange={onInputChange}
              />
            </Tab.Pane>
            <Tab.Pane
              eventKey="body"
              bsPrefix={`rest-api-tabpanes ${bodyToggle && 'rest-api-tabpanes-body'}`}
              transition={false}
            >
              <Body
                removeKeyValuePair={removeKeyValuePair}
                addNewKeyValuePair={addNewKeyValuePair}
                onChange={onChange}
                onRawBodyChange={onRawBodyChange}
                options={options['body']}
                jsonBody={options['json_body']} // FIXME: Remove this once data migration to raw_body is complete
                rawBody={options['raw_body']}
                theme={theme}
                bodyToggle={bodyToggle}
                darkMode={darkMode}
                componentName={componentName}
                onInputChange={onInputChange}
              />
            </Tab.Pane>
            <Tab.Pane eventKey="cookies" bsPrefix="rest-api-tabpanes" transition={false}>
              <Cookies
                removeKeyValuePair={removeKeyValuePair}
                addNewKeyValuePair={addNewKeyValuePair}
                onChange={onChange}
                options={options['cookies']}
                theme={theme}
                darkMode={darkMode}
                componentName={componentName}
                onInputChange={onInputChange}
              />
            </Tab.Pane>
          </Tab.Content>
        </div>
      </Row>
    </Tab.Container>
  );
}

export default ControlledTabs;
