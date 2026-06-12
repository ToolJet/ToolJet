import React, { useRef } from 'react';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import AddRectangle from '@/_ui/Icon/bulkIcons/AddRectangle';
import CodeHinter from '@/AppBuilder/CodeEditor';
import InfoIcon from '@assets/images/icons/info.svg';
import Trash from '@/_ui/Icon/solidIcons/Trash';
import { generateCypressDataCy } from '@/modules/common/helpers/cypressHelpers.js';

const darkMode = localStorage.getItem('darkMode') === 'true';

const ParamRow = React.memo(({ option, index, onKeyChange, onValueChange, onRemove }) => {
  return (
    <div className="d-flex" data-cy={`key-value-pair-${index}`}>
      <div className="d-flex mb-2 justify-content-between w-100">
        <div className="w-100">
          <CodeHinter
            initialValue={option[0]}
            type={'basic'}
            height="32px"
            placeholder="Key"
            onChange={onKeyChange}
            componentName={`HttpHeaders::key::${index}`}
            cyLabel={`key-${index}`}
          />
        </div>
        <div className="w-100">
          <CodeHinter
            initialValue={option[1]}
            type={'basic'}
            height="32px"
            placeholder="Value"
            onChange={onValueChange}
            componentName={`HttpHeaders::value::${index}`}
            cyLabel={`value-${index}`}
          />
        </div>
      </div>
      <button
        className={`d-flex justify-content-center align-items-center delete-field-option bg-transparent border-0 rounded-0 border-top border-bottom border-end border-start rounded-start rounded-end trash ${
          darkMode ? 'delete-field-option-dark' : ''
        }`}
        role="button"
        onClick={onRemove}
        data-cy={`delete-button-${index}`}
      >
        <Trash fill="var(--slate9)" style={{ height: '16px' }} />
      </button>
    </div>
  );
});

export default ({ options, addNewKeyValuePair, removeKeyValuePair, keyValuePairValueChanged, buttonText }) => {
  // Always-current refs so stable row callbacks don't go stale
  const removeKeyValuePairRef = useRef(removeKeyValuePair);
  removeKeyValuePairRef.current = removeKeyValuePair;
  const keyValuePairValueChangedRef = useRef(keyValuePairValueChanged);
  keyValuePairValueChangedRef.current = keyValuePairValueChanged;

  // Per-index callback cache: callbacks are created once per index and reused,
  // so React.memo on ParamRow can skip re-renders for existing rows on every add.
  const rowCallbacksRef = useRef({});
  const getRowCallbacks = (index) => {
    if (!rowCallbacksRef.current[index]) {
      rowCallbacksRef.current[index] = {
        onKeyChange: (value) => keyValuePairValueChangedRef.current(value, 0, index),
        onValueChange: (value) => keyValuePairValueChangedRef.current(value, 1, index),
        onRemove: () => removeKeyValuePairRef.current(index),
      };
    }
    return rowCallbacksRef.current[index];
  };

  return (
    <div>
      {options.length === 0 && (
        <div className="empty-key-value" data-cy="empty-key-value">
          <InfoIcon style={{ width: '16px', marginRight: '5px' }} />
          <span data-cy="empty-key-value-message">There are no key value pairs added</span>
        </div>
      )}
      {options.map((option, index) => (
        <ParamRow key={index} option={option} index={index} {...getRowCallbacks(index)} />
      ))}
      <ButtonSolid
        variant="ghostBlue"
        size="sm"
        onClick={() => addNewKeyValuePair(options)}
        data-cy={`${generateCypressDataCy(buttonText)}-button`}
      >
        <AddRectangle width="15" fill="#3E63DD" opacity="1" secondaryFill="#ffffff" />
        &nbsp;&nbsp; {buttonText}
      </ButtonSolid>
    </div>
  );
};
