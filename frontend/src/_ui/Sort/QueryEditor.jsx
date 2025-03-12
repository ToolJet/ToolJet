import React from 'react';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import AddRectangle from '@/_ui/Icon/bulkIcons/AddRectangle';
import CodeHinter from '@/Editor/CodeEditor';
import InfoIcon from '@assets/images/icons/info.svg';
import Trash from '@/_ui/Icon/solidIcons/Trash';
import Select from '@/_ui/Select';
import Input from '@/_ui/Input';
import '@/_ui/Sort/sortStyles.scss';

export default ({ options, addNewKeyValuePair, removeKeyValuePair, keyValuePairValueChanged, buttonText }) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const sortOptions = [
    { value: 'asc', label: 'Ascending' },
    { value: 'desc', label: 'Descending' },
  ];
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
              <div className="w-100 sort-input">
                <Input
                  value={option[0]}
                  className="form-control"
                  type="text"
                  placeholder="Field"
                  style={{ height: '32px' }}
                  onChange={(e) => keyValuePairValueChanged(e.target.value, 0, index)}
                />
              </div>
              <div className="w-100 sort-input">
                <Select
                  options={sortOptions}
                  value={sortOptions.find((opt) => opt.value === option[1])}
                  onChange={(value) => keyValuePairValueChanged(value, 1, index)}
                  width={'100%'}
                  placeholder="Select direction"
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
      <ButtonSolid
        variant="ghostBlue"
        size="sm"
        onClick={() => addNewKeyValuePair(options)}
        style={{ gap: '0px', padding: '2px 8px' }}
      >
        <AddRectangle width="15" fill="#3E63DD" opacity="1" secondaryFill="#ffffff" />
        &nbsp;&nbsp;{buttonText}
      </ButtonSolid>
    </div>
  );
};
