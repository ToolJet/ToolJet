import React from 'react';
import _ from 'lodash';
import QueryEditor from './QueryEditor';
import SourceEditor from './SourceEditor';

export default ({
  getter,
  options = [['', '']],
  optionchanged,
  currentState,
  isRenderedAsQueryEditor,
  workspaceConstants,
}) => {
  function addNewKeyValuePair() {
    const newPairs = [...options, ['', '']];
    optionchanged(getter, newPairs);
  }

  function removeKeyValuePair(index) {
    options.splice(index, 1);
    optionchanged(getter, options);
  }

  function keyValuePairValueChanged(value, keyIndex, index) {
    if (!isRenderedAsQueryEditor && options.length - 1 === index) {
      setTimeout(() => {
        addNewKeyValuePair();
      }, 100);
    }
    const newOptions = _.cloneDeep(options);
    newOptions[index][keyIndex] = value;
    optionchanged(getter, newOptions);
  }

  const commonProps = {
    options,
    addNewKeyValuePair,
    removeKeyValuePair,
    keyValuePairValueChanged,
  };

  return isRenderedAsQueryEditor ? (
    <QueryEditor {...commonProps} currentState={currentState} />
  ) : (
    <SourceEditor {...commonProps} workspaceConstants={workspaceConstants} />
  );
};
