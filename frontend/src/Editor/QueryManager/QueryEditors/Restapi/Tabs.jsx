import React from 'react';
import Headers from './TabHeaders';
import Params from './TabParams';
import Body from './TabBody';
import { Tab, ListGroup, Row } from 'react-bootstrap';

function ControlledTabs({
  options,
  currentState,
  theme,
  onChange,
  onJsonBodyChange,
  removeKeyValuePair,
  addNewKeyValuePair,
  darkMode,
  componentName,
  setBodyToggle,
  bodyToggle,
}) {
  const [key, setKey] = React.useState('headers');
  const tabs = ['Headers', 'Params', 'Body'];
  return (
    <Tab.Container activeKey={key} onSelect={(k) => setKey(k)} defaultActiveKey="headers">
      <Row>
        <div className="keys">
          <ListGroup className="query-pane-rest-api-keys-list-group" variant="flush">
            {tabs.map((tab) => (
              <ListGroup.Item key={tab} eventKey={tab.toLowerCase()}>
                <span>{tab}</span>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </div>

        <div className="col">
          <Tab.Content bsPrefix="rest-api-tab-content">
            <Tab.Pane eventKey="headers" t bsPrefix="rest-api-tabpanes" transition={false}>
              <Headers
                removeKeyValuePair={removeKeyValuePair}
                addNewKeyValuePair={addNewKeyValuePair}
                onChange={onChange}
                options={options['headers']}
                currentState={currentState}
                theme={theme}
                darkMode={darkMode}
                componentName={componentName}
              />
            </Tab.Pane>
            <Tab.Pane eventKey="params" bsPrefix="rest-api-tabpanes" transition={false}>
              <Params
                removeKeyValuePair={removeKeyValuePair}
                addNewKeyValuePair={addNewKeyValuePair}
                onChange={onChange}
                options={options['url_params']}
                currentState={currentState}
                theme={theme}
                darkMode={darkMode}
                componentName={componentName}
              />
            </Tab.Pane>
            <Tab.Pane eventKey="body" bsPrefix="rest-api-tabpanes" transition={false}>
              <Body
                removeKeyValuePair={removeKeyValuePair}
                addNewKeyValuePair={addNewKeyValuePair}
                onChange={onChange}
                onJsonBodyChange={onJsonBodyChange}
                options={options['body']}
                jsonBody={options['json_body']}
                currentState={currentState}
                theme={theme}
                bodyToggle={bodyToggle}
                setBodyToggle={setBodyToggle}
                darkMode={darkMode}
                componentName={componentName}
              />
            </Tab.Pane>
          </Tab.Content>
        </div>
      </Row>
    </Tab.Container>
  );
}

export default ControlledTabs;
