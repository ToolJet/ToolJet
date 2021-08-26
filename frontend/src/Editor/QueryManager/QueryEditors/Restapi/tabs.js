import React from 'react';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';

import Headers from './tab-headers';
import Params from './tab-params';
import Body from './tab-body';

function ControlledTabs({ options, currentState, theme, onChange, removeKeyValuePair }) {
  const [key, setKey] = React.useState('headers');

  console.log(key)
  return (
    <Tabs activeKey={key} onSelect={(k) => setKey(k)} className="mb-3">
      <Tab eventKey="headers" title="Headers">
        <Headers
          removeKeyValuePair={removeKeyValuePair}
          onChange={onChange}
          options={options['headers']}
          currentState={currentState}
          theme={theme}
        />
      </Tab>
      <Tab eventKey="params" title="Params">
        <Params
          removeKeyValuePair={removeKeyValuePair}
          onChange={onChange}
          options={options['url_params']}
          currentState={currentState}
          theme={theme}
        />
      </Tab>
      <Tab eventKey="body" title="Body">
        <Body
          removeKeyValuePair={removeKeyValuePair}
          onChange={onChange}
          options={options['body']}
          currentState={currentState}
          theme={theme}
        />
      </Tab>
    </Tabs>
  );
}

export default ControlledTabs;
