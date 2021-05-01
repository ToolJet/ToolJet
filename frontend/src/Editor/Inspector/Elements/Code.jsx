import React from 'react';
import { CodeBuilder } from '../../CodeBuilder/CodeBuilder';
import { getToolTipProps } from './utils';

export const Code = ({
  param, definition, onChange, paramType, dataQueries, components, componentMeta
}) => {
  const initialValue = definition ? definition.value : '';
  const paramMeta = componentMeta[paramType][param.name];
  const displayName = paramMeta.displayName || param.name;

  function handleCodeChanged(value) {
    onChange(param, 'value', value, paramType);
  }

  return (
    <div className="field mb-2">
      <label {...getToolTipProps(paramMeta)}  className="form-label">{displayName}</label>
      <CodeBuilder
        initialValue={initialValue}
        components={components}
        dataQueries={dataQueries}
        onChange={handleCodeChanged}
      />
    </div>
  );
};
