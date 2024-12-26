import React from 'react';
import TabContent from './TabContent';

export default ({
  options = [],
  jsonBody,
  theme,
  removeKeyValuePair,
  addNewKeyValuePair,
  onChange,
  onJsonBodyChange,
  componentName,
  bodyToggle,
  onInputChange,
}) => {
  return (
    <>
      <TabContent
        options={options}
        theme={theme}
        removeKeyValuePair={removeKeyValuePair}
        onChange={onChange}
        onInputChange={onInputChange}
        onJsonBodyChange={onJsonBodyChange}
        componentName={componentName}
        tabType={'body'}
        jsonBody={jsonBody}
        paramType={'body'}
        bodyToggle={bodyToggle}
        addNewKeyValuePair={addNewKeyValuePair}
      />
    </>
  );
};
