import React, { useState, useEffect } from 'react';
import { defaults } from 'lodash';
import { Card } from 'react-bootstrap';
import ParameterList from '../../Components/ParameterList';
import CodeHinter from '@/AppBuilder/CodeEditor';

const Runjs = (props) => {
  const initialOptions = defaults({ ...props.options }, { code: '//Type your JavaScript code here' });
  const [options, setOptions] = useState(initialOptions);

  useEffect(() => {
    setOptions(props.options);
  }, [props.options]);

  return (
    <Card className="runjs-editor mb-3">
      <CodeHinter
        type="multiline"
        initialValue={props.options.code}
        lang="javascript"
        height={400}
        className="query-hinter"
        onChange={(value) => {
          const newOptions = { ...options, code: value };
          props.optionsChanged(newOptions);
        }}
        componentName="Runjs"
        cyLabel={`runjs`}
        delayOnChange={false}
      />
    </Card>
  );
};

export default Runjs;
