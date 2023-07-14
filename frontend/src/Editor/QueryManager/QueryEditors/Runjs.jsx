import React, { useState, useEffect, useRef } from 'react';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';
import { changeOption } from './utils';
import { defaults } from 'lodash';
import { Badge, Button, ButtonGroup, Card, CloseButton } from 'react-bootstrap';
import CardHeader from 'react-bootstrap/esm/CardHeader';
import ArgumentFormPopup, { PillButton } from './ArgumentFormPopup';
import Remove from '@/_ui/Icon/bulkIcons/Remove';
import { RunjsArgumentList } from './RunjsArgumentList';

const Runjs = (props) => {
  const initialOptions = defaults({ ...props.options }, { code: '//Type your JavaScript code here', arguments: [] });
  const [options, setOptions] = useState(initialOptions);

  const handleAddArgument = (newArgument) => {
    setOptions((prevOptions) => ({
      ...prevOptions,
      arguments: [...prevOptions.arguments, newArgument],
    }));
  };

  useEffect(() => {
    props.optionsChanged(options);
  }, [options]);

  const handleArgumentChange = (index, updatedArgument) => {
    setOptions((prevOptions) => {
      const updatedArguments = [...prevOptions.arguments];
      updatedArguments[index] = updatedArgument;
      return { ...prevOptions, arguments: updatedArguments };
    });
  };

  const handleArgumentRemove = (index) => {
    setOptions((prevOptions) => {
      const updatedArguments = prevOptions.arguments.filter((arg, i) => index !== i);
      return { ...prevOptions, arguments: updatedArguments };
    });
  };

  return (
    <Card className="runjs-editor">
      <RunjsArgumentList
        args={options.arguments}
        handleAddArgument={handleAddArgument}
        handleArgumentChange={handleArgumentChange}
        handleArgumentRemove={handleArgumentRemove}
        currentState={props.currentState}
        darkMode={props.darkMode}
      />

      <CodeHinter
        currentState={props.currentState}
        initialValue={props.options.code}
        mode="javascript"
        theme={props.darkMode ? 'monokai' : 'base16-light'}
        lineNumbers={true}
        height={400}
        className="query-hinter"
        ignoreBraces={true}
        onChange={(value) => setOptions({ ...options, code: value })}
        isMultiLineJs={false}
        enablePreview={false}
        componentName="Runjs"
        cyLabel={`runjs`}
      />
    </Card>
  );
};

export { Runjs };
