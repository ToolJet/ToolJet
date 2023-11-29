import React from 'react';
import SelectComponent from '@/_ui/Select';
import { components } from 'react-select';
import Check from '@/_ui/Icon/solidIcons/Check';

const Option = (props) => {
  return (
    <components.Option {...props}>
      <div className="d-flex justify-content-between">
        <span>{props.label}</span>
        {props.isSelected && (
          <span>
            <Check width={'20'} fill={'#3E63DD'} />
          </span>
        )}
      </div>
    </components.Option>
  );
};

const selectCustomStyles = {
  control: (base, state) => {
    return {
      ...base,
      border: state.isFocused ? '1px solid #3E63DD' : '1px solid #cccccc',
      boxShadow: state.isFocused ? '0px 0px 6px #3E63DD' : 'none',
      backgroundColor: state.isFocused ? 'var(--indigo2)' : 'var(--base)',
      '&:hover': {
        border: '1px solid #3E63DD !important',
        boxShadow: '0px 0px 6px #3E63DD',
      },
      borderRadius: '6px',
      width: '144px',
      minHeight: '32px',
    };
  },

  dropdownIndicator: (base) => ({
    ...base,
    padding: '4px',
  }),
  menuList: (base) => ({
    ...base,
    padding: '4px',
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? '#F0F4FF !important' : 'white',
    color: '#11181C',
    borderRadius: '6px',
  }),
};

export const Select = ({ value, onChange, meta }) => {
  return (
    <div
      className="row fx-container"
      data-cy={`dropdown-${meta.displayName ? String(meta.displayName).toLowerCase().replace(/\s+/g, '-') : 'common'}`}
    >
      <div className="field" onClick={(e) => e.stopPropagation()}>
        <SelectComponent
          options={meta.options}
          value={value}
          hasSearch={true}
          onChange={onChange}
          width={224}
          height={32}
          styles={selectCustomStyles}
          useCustomStyles={true}
          classNamePrefix="inspector-select"
          components={{
            IndicatorSeparator: () => null,
            Option,
          }}
        />
      </div>
    </div>
  );
};
