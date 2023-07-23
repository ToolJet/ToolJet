import React from 'react';
import TabContent from './TabContent';
import GroupHeader from './GroupHeader';

export default ({ options = [], theme, removeKeyValuePair, addNewKeyValuePair, onChange, componentName }) => {
  return (
    <>
      <GroupHeader paramType={'headers'} descText="Query Headers" />
      <TabContent
        options={options}
        theme={theme}
        removeKeyValuePair={removeKeyValuePair}
        onChange={onChange}
        componentName={componentName}
        tabType={'headers'}
        paramType={'headers'}
        addNewKeyValuePair={addNewKeyValuePair}
      />
    </>
  );
};
