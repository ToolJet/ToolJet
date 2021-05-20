import React from 'react';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';
import { ToolTip } from './Components/ToolTip';

export const Code = ({
  param, definition, onChange, paramType, dataQueries, components, componentMeta, currentState
}) => {
  const initialValue = definition ? definition.value : '';
  const paramMeta = componentMeta[paramType][param.name];
  const displayName = paramMeta.displayName || param.name;

  function handleCodeChanged(value) {
    onChange(param, 'value', value, paramType);
  }

  const options = paramMeta.options || {}

  return (
    <div className={`mb-2 field ${options.className}`}>
      <ToolTip label={displayName} meta={paramMeta}/>
      <CodeHinter
          currentState={currentState}
          initialValue={initialValue}
          mode={options.mode}
          theme={options.theme}
          className={options.className}
          onChange={(value) => handleCodeChanged(value)}
      />
    </div>
  );
};
