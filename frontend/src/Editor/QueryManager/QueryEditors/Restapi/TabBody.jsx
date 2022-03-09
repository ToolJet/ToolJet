import React from 'react';
import GroupHeader from './GroupHeader';
import TabContent from './TabContent';

export default ({
  options = [],
  currentState,
  theme,
  removeKeyValuePair,
  addNewKeyValuePair,
  onChange,
  darkMode,
  componentName,
}) => {
  return (
    <>
      <GroupHeader addNewKeyValuePair={addNewKeyValuePair} tabType={'body'} descText={'Body Parameters'} />

      <TabContent
        options={options}
        currentState={currentState}
        theme={theme}
        removeKeyValuePair={removeKeyValuePair}
        onChange={onChange}
        componentName={componentName}
        tabType={'body'}
        paramType={'body'}
      />
    </>
  );
};
