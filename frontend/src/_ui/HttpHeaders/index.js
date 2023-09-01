import React from 'react';
import QueryEditor from './QueryEditor';
import SourceEditor from './SourceEditor';

export default ({
  getter,
  options = [['', '']],
  optionchanged,
  currentState,
  isRenderedAsQueryEditor,
  workspaceConstants,
  isDisabled,
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
    options[index][keyIndex] = value;
    optionchanged(getter, options);
  }

  const commonProps = {
    options,
    addNewKeyValuePair,
    removeKeyValuePair,
    keyValuePairValueChanged,
    isDisabled,
  };

  return isRenderedAsQueryEditor ? (
    <QueryEditor {...commonProps} currentState={currentState} />
  ) : (
    <SourceEditor {...commonProps} workspaceConstants={workspaceConstants} />
  );
};
