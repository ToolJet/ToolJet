import React from 'react';
import { CodeBuilder } from '../../CodeBuilder/CodeBuilder';

export const Code = ({ param, definition, onChange, paramType, dataQueries, components }) => {
  const initialValue = definition ? definition.value : '';

  function handleCodeChanged(value) {
    onChange(param, 'value', value, paramType);
  }

  return (
    <div className="field mb-2">
      <label class="form-label">{param.name}</label>
      <CodeBuilder
        initialValue={initialValue}
        components={components}
        dataQueries={dataQueries}
        onChange={handleCodeChanged}
      />
    </div>
  );
};
