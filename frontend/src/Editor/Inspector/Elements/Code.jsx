import React from 'react';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';
import { ToolTip } from './Components/ToolTip';

export const Code = ({
  param,
  definition,
  onChange,
  paramType,
  componentMeta,
  currentState,
  darkMode,
  // dataQueries,
  // components,
}) => {
  const initialValue = definition ? definition.value : '';
  const paramMeta = componentMeta[paramType][param.name];
  const displayName = paramMeta.displayName || param.name;

  function handleCodeChanged(value) {
    onChange(param, 'value', value, paramType);
  }

  const options = paramMeta.options || {};

  return (
    <div className={`mb-2 field ${options.className}`}>
      <ToolTip label={displayName} meta={paramMeta} />
      <CodeHinter
        enablePreview={true}
        currentState={currentState}
        initialValue={initialValue}
        mode={options.mode}
        theme={darkMode ? 'monokai' : options.theme}
        lineWrapping={true}
        className={options.className}
        onChange={(value) => handleCodeChanged(value)}
      />
    </div>
  );
};
