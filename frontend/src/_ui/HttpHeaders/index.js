import React from 'react';
import _ from 'lodash';
import QueryEditor from './QueryEditor';
import SourceEditor from './SourceEditor';
import { deepClone } from '@/_helpers/utilities/utils.helpers';

export default ({
  getter,
  options = [['', '']],
  optionchanged,
  handleOptionChange,
  isRenderedAsQueryEditor,
  workspaceConstants,
  isDisabled,
  buttonText,
  width,
  dataCy,
  classes = null,
}) => {
  function addNewKeyValuePair(options) {
    const newPairs = [...options, ['', '']];

    if (handleOptionChange) {
      handleOptionChange(getter, newPairs, true);
    } else {
      optionchanged(getter, newPairs);
    }
  }

  function removeKeyValuePair(index) {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    if (handleOptionChange) {
      handleOptionChange(getter, newOptions, true);
    } else {
      optionchanged(getter, newOptions);
    }
  }

  function keyValuePairValueChanged(value, keyIndex, index) {
    if (!isRenderedAsQueryEditor) {
      const newOptions = deepClone(options);
      newOptions[index][keyIndex] = value;
      if (options.length - 1 === index) {
        addNewKeyValuePair(newOptions);
      } else {
        if (handleOptionChange) {
          handleOptionChange(getter, newOptions, true);
        } else {
          optionchanged(getter, newOptions);
        }
      }
    } else {
      let newOptions = deepClone(options);
      newOptions[index][keyIndex] = value;
      if (handleOptionChange) {
        handleOptionChange(getter, newOptions, true);
      } else {
        optionchanged(getter, newOptions);
      }
    }
  }

  const commonProps = {
    options,
    addNewKeyValuePair,
    removeKeyValuePair,
    keyValuePairValueChanged,
    isDisabled,
    buttonText,
    dataCy,
    classes,
  };

  return isRenderedAsQueryEditor ? (
    <QueryEditor {...commonProps} />
  ) : (
    <SourceEditor {...commonProps} workspaceConstants={workspaceConstants} width={width} />
  );
};
