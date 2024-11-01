import React from 'react';
import TabContent from './TabContent';

export default ({ options = [], theme, removeKeyValuePair, addNewKeyValuePair, onChange, componentName }) => {
  return (
    <>
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
