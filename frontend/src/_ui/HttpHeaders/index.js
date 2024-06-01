import React from 'react';
import _ from 'lodash';
import QueryEditor from './QueryEditor';
import SourceEditor from './SourceEditor';
import { deepClone } from '@/_helpers/utitlities/utils.helpers';

export default ({ getter, options = [['', '']], optionchanged, isRenderedAsQueryEditor, workspaceConstants }) => {
  function addNewKeyValuePair(options) {
    const newPairs = [...options, ['', '']];
    optionchanged(getter, newPairs);
  }

  function removeKeyValuePair(index) {
    options.splice(index, 1);
    optionchanged(getter, options);
  }

  function keyValuePairValueChanged(value, keyIndex, index) {
    if (!isRenderedAsQueryEditor) {
      const newOptions = deepClone(options);
      newOptions[index][keyIndex] = value;
      options.length - 1 === index ? addNewKeyValuePair(newOptions) : optionchanged(getter, newOptions);
    } else {
      options[index][keyIndex] = value;
      optionchanged(getter, options);
    }
  }

  const commonProps = {
    options,
    addNewKeyValuePair,
    removeKeyValuePair,
    keyValuePairValueChanged,
  };

  return isRenderedAsQueryEditor ? (
    <QueryEditor {...commonProps} />
  ) : (
    <SourceEditor {...commonProps} workspaceConstants={workspaceConstants} />
  );
};
