import React from 'react';
import Input from '../Input';
import Trash from '@/_ui/Icon/solidIcons/Trash';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import AddRectangle from '@/_ui/Icon/bulkIcons/AddRectangle';
import InfoIcon from '@assets/images/icons/info.svg';
import '@/_ui/Sort/sortStyles.scss';
import Select from '@/_ui/Select';

export default ({
  options,
  addNewKeyValuePair,
  removeKeyValuePair,
  keyValuePairValueChanged,
  workspaceConstants,
  isDisabled,
  width,
}) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const sortOptions = [
    { value: 'asc', label: 'Ascending' },
    { value: 'desc', label: 'Descending' },
  ];
  return (
    <div className="table-content-wrapper">
      {options.length === 0 && (
        <div className="empty-key-value">
          <InfoIcon style={{ width: '16px', marginRight: '5px' }} />
          <span>There are no key value pairs added</span>
        </div>
      )}

      {options.map((option, index) => (
        <div className="d-flex align-items-top row-container query-manager-border-color" key={index}>
          <Input
            value={option[0]}
            className="form-control"
            type="text"
            placeholder="Field"
            style={{ width: width ? width : '300px', borderTopRightRadius: '0px', borderBottomRightRadius: '0px' }}
            onChange={(e) => keyValuePairValueChanged(e.target.value, 0, index)}
          />
          <Select
            options={sortOptions}
            value={sortOptions.find((opt) => opt.value === option[1])}
            onChange={(value) => keyValuePairValueChanged(value, 1, index)}
            width={'316px'}
            height={'35px'}
            placeholder="Select direction"
          />

          <button
            className={`d-flex justify-content-center align-items-center delete-field-option bg-transparent border-0 rounded-0 border-top border-bottom border-end rounded-end ${
              darkMode ? 'delete-field-option-dark' : ''
            }`}
            style={{ height: '35px' }}
            role="button"
            disabled={isDisabled}
            onClick={() => removeKeyValuePair(index)}
          >
            <Trash fill="var(--slate9)" style={{ height: '16px' }} />
          </button>
        </div>
      ))}

      <div className="d-flex mb-2" style={{ height: '16px' }}>
        <ButtonSolid
          variant="ghostBlue"
          size="sm"
          onClick={() => addNewKeyValuePair(options)}
          style={{ gap: '0px', paddingTop: '2px', paddingRight: '8px', paddingBottom: '2px', paddingLeft: '8px' }}
          disabled={isDisabled}
        >
          <AddRectangle width="15" fill="#3E63DD" opacity="1" secondaryFill="#ffffff" />
          &nbsp;&nbsp;Add
        </ButtonSolid>
      </div>
    </div>
  );
};
