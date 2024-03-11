import React, { useState, useEffect } from 'react';
import { CodeHinter } from '@/Editor/CodeBuilder/CodeHinter';
import { defaults } from 'lodash';
import { Card } from 'react-bootstrap';
import { useCurrentState } from '@/_stores/currentStateStore';

const Runjs = (props) => {
  const currentState = useCurrentState();
  const [currStateForCodeHinter, setCurrStateForCodeHinter] = useState(currentState);
  const initialOptions = defaults({ ...props.options }, { code: '//Type your JavaScript code here' });
  const [options, setOptions] = useState(initialOptions);

  useEffect(() => {
    setCurrStateForCodeHinter({
      ...currentState,
      parameters: options?.parameters?.reduce((params, param) => ({ ...params, [param.name]: param.defaultValue }), {}),
    });
  }, [currentState?.components, options?.parameters]);

  useEffect(() => {
    setOptions(props.options);
  }, [props.options]);

  return (
    <Card className="runjs-editor mb-3">
      <CodeHinter
        initialValue={props.options.code}
        mode="javascript"
        theme={props.darkMode ? 'monokai' : 'base16-light'}
        lineNumbers={true}
        height={400}
        className="query-hinter"
        ignoreBraces={true}
        onChange={(value) => {
          const newOptions = { ...options, code: value };
          props.optionsChanged(newOptions);
        }}
        isMultiLineJs={false}
        enablePreview={false}
        componentName="Runjs"
        cyLabel={`runjs`}
        currentState={currStateForCodeHinter}
      />
    </Card>
  );
};

export default Runjs;
