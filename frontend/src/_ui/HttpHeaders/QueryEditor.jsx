import React from 'react';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import AddRectangle from '@/_ui/Icon/bulkIcons/AddRectangle';
import CodeHinter from '@/AppBuilder/CodeEditor';
import InfoIcon from '@assets/images/icons/info.svg';
import Trash from '@/_ui/Icon/solidIcons/Trash';

export default ({ options, addNewKeyValuePair, removeKeyValuePair, keyValuePairValueChanged, buttonText }) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  return (
    <div>
      {options.length === 0 && (
        <div className="empty-key-value">
          <InfoIcon style={{ width: '16px', marginRight: '5px' }} />
          <span>There are no key value pairs added</span>
        </div>
      )}
      {options.map((option, index) => {
        return (
          <div className="d-flex" key={index}>
            <div className="d-flex mb-2 justify-content-between w-100">
              <div className="w-100">
                <CodeHinter
                  initialValue={option[0]}
                  type={'basic'}
                  placeholder="Key"
                  onChange={(value) => keyValuePairValueChanged(value, 0, index)}
                  componentName={`HttpHeaders::key::${index}`}
                />
              </div>
              <div className="w-100">
                <CodeHinter
                  initialValue={option[1]}
                  type={'basic'}
                  placeholder="Value"
                  onChange={(value) => keyValuePairValueChanged(value, 1, index)}
                  componentName={`HttpHeaders::value::${index}`}
                />
              </div>
            </div>
            <button
              className={`d-flex justify-content-center align-items-center delete-field-option bg-transparent border-0 rounded-0 border-top border-bottom border-end border-start rounded-start rounded-end trash ${
                darkMode ? 'delete-field-option-dark' : ''
              }`}
              role="button"
              onClick={() => {
                removeKeyValuePair(index);
              }}
            >
              <Trash fill="var(--slate9)" style={{ height: '16px' }} />
            </button>
          </div>
        );
      })}
      <ButtonSolid variant="ghostBlue" size="sm" onClick={() => addNewKeyValuePair(options)}>
        <AddRectangle width="15" fill="#3E63DD" opacity="1" secondaryFill="#ffffff" />
        &nbsp;&nbsp; {buttonText}
      </ButtonSolid>
    </div>
  );
};
