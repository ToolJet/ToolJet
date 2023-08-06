import React, { useState, useEffect } from 'react';
import { CodeHinter } from '@/Editor/CodeBuilder/CodeHinter';
import { defaults } from 'lodash';
import { Card } from 'react-bootstrap';
import { useCurrentState } from '@/_stores/currentStateStore';
import ParameterList from './ParameterList';

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

  const handleAddParameter = (newParameter) => {
    const prevOptions = { ...options };
    //check if paramname already used
    if (!prevOptions?.parameters?.some((param) => param.name === newParameter.name)) {
      props.optionsChanged({
        ...prevOptions,
        parameters: [...prevOptions.parameters, newParameter],
      });
    }
  };

  useEffect(() => {
    setOptions(props.options);
  }, [props.options]);

  const handleParameterChange = (index, updatedParameter) => {
    const prevOptions = { ...options };
    //check if paramname already used
    if (!prevOptions?.parameters?.some((param, idx) => param.name === updatedParameter.name && index !== idx)) {
      const updatedParameters = [...prevOptions.parameters];
      updatedParameters[index] = updatedParameter;
      props.optionsChanged({ ...prevOptions, parameters: updatedParameters });
    }
  };

  const handleParameterRemove = (index) => {
    const prevOptions = { ...options };
    const updatedParameters = prevOptions.parameters.filter((param, i) => index !== i);
    props.optionsChanged({ ...prevOptions, parameters: updatedParameters });
  };

  return (
    <Card className="runjs-editor">
      {(options.hasParamSupport || props.mode === 'create') && (
        <ParameterList
          parameters={options.parameters}
          handleAddParameter={handleAddParameter}
          handleParameterChange={handleParameterChange}
          handleParameterRemove={handleParameterRemove}
          currentState={props.currentState}
          darkMode={props.darkMode}
        />
      )}

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
