import React from 'react';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';

import Headers from './TabHeaders';
import Params from './TabParams';
import Body from './TabBody';
import { Col, ListGroup, Nav, Row } from 'react-bootstrap';

function ControlledTabs({
  options,
  currentState,
  theme,
  onChange,
  removeKeyValuePair,
  addNewKeyValuePair,
  darkMode,
  componentName,
}) {
  const [key, setKey] = React.useState('headers');
  const tabs = ['Headers', 'Params', 'Body'];
  return (
    <Tab.Container activeKey={key} onSelect={(k) => setKey(k)} defaultActiveKey="headers">
      <Row>
        <Col sm={2} className={`keys ${darkMode ? 'dark' : ''}`}>
          <ListGroup className="query-pane-rest-api-keys-list-group" variant="flush">
            {tabs.map((tab) => (
              <ListGroup.Item key={tab} eventKey={tab.toLowerCase()}>
                <span>{tab}</span>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Col>
        <Col sm={10}>
          <Tab.Content bsPrefix="rest-api-tab-content">
            <Tab.Pane eventKey="headers">
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
            <Tab.Pane eventKey="params">Tab two content</Tab.Pane>
            <Tab.Pane eventKey="body">Tab three content</Tab.Pane>
          </Tab.Content>
        </Col>
      </Row>
    </Tab.Container>
  );
}

export default ControlledTabs;
