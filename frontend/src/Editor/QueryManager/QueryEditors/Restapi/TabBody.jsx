import React, { useState } from 'react';
import GroupHeader from './GroupHeader';
import TabContent from './TabContent';

export default ({
  options = [],
  jsonBody,
  currentState,
  theme,
  removeKeyValuePair,
  addNewKeyValuePair,
  onChange,
  onJsonBodyChange,
  componentName,
  bodyToggle,
  setBodyToggle,
}) => {
  return (
    <>
      <GroupHeader
        addNewKeyValuePair={addNewKeyValuePair}
        paramType={'body'}
        descText={'Raw JSON'}
        bodyToggle={bodyToggle}
        setBodyToggle={setBodyToggle}
      />
      <TabContent
        options={options}
        currentState={currentState}
        theme={theme}
        removeKeyValuePair={removeKeyValuePair}
        onChange={onChange}
        onJsonBodyChange={onJsonBodyChange}
        componentName={componentName}
        tabType={'body'}
        jsonBody={jsonBody}
        paramType={'body'}
        bodyToggle={bodyToggle}
      />
    </>
  );
};
