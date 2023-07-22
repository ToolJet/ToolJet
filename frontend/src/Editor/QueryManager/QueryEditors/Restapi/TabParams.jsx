import React from 'react';
import GroupHeader from './GroupHeader';
import TabContent from './TabContent';

export default ({ options = [], theme, removeKeyValuePair, addNewKeyValuePair, onChange, componentName }) => {
  return (
    <>
      <GroupHeader paramType={'url_params'} descText={'Query Parameters'} />
      <TabContent
        options={options}
        theme={theme}
        removeKeyValuePair={removeKeyValuePair}
        onChange={onChange}
        componentName={componentName}
        tabType={'params'}
        paramType={'url_params'}
        addNewKeyValuePair={addNewKeyValuePair}
      />
    </>
  );
};
