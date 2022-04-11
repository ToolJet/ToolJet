import React, { useState } from 'react';
import GroupHeader from './GroupHeader';
import TabContent from './TabContent';

export default ({
  options = [],
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
      <div style={{ display: 'flex' }}></div>
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
        paramType={'body'}
        bodyToggle={bodyToggle}
      />
    </>
  );
};
