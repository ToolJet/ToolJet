import React, { useEffect, useState } from 'react';
// import { resolveWidgetFieldValue } from '@/_helpers/utils';
import { CodeHinter } from '../CodeBuilder/CodeHinter';
export const CodeEditor = ({ width, height, component, currentState, onComponentOptionChanged, darkMode }) => {
  const [value, setValue] = useState('');

  function codeChanged(code) {
    setValue(code);
  }

  useEffect(() => {
    onComponentOptionChanged(component, 'value', value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const styles = {
    width: width,
    height: height,
    display: '',
  };

  console.log('component', JSON.stringify(currentState));
  return (
    <div style={styles} className="container p-1">
      <CodeHinter
        placeholder="placeholder"
        currentState={currentState}
        height={height}
        initialValue={value}
        theme={darkMode ? 'monokai' : 'duotone-light'}
        lineNumbers={true}
        className="query-hinter, mb-1"
        ignoreBraces={true}
        onChange={(value) => codeChanged(value)}
        mode="javascript"
        enablePreview={true}
      />
    </div>
  );
};
