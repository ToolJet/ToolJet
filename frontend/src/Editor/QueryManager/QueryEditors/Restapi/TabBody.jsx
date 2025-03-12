import React from 'react';
import TabContent from './TabContent';

export default ({
  options = [],
  jsonBody, // FIXME: Remove this once data migration to raw_body is complete
  rawBody,
  theme,
  removeKeyValuePair,
  addNewKeyValuePair,
  onChange,
  onRawBodyChange,
  componentName,
  bodyToggle,
}) => {
  return (
    <>
      <TabContent
        options={options}
        theme={theme}
        removeKeyValuePair={removeKeyValuePair}
        onChange={onChange}
        onRawBodyChange={onRawBodyChange}
        componentName={componentName}
        tabType={'body'}
        jsonBody={jsonBody} // FIXME: Remove this once data migration to raw_body is complete
        rawBody={rawBody}
        paramType={'body'}
        bodyToggle={bodyToggle}
        addNewKeyValuePair={addNewKeyValuePair}
      />
    </>
  );
};
