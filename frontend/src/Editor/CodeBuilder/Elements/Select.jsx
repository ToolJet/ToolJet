import React, { useEffect } from 'react';
import SelectComponent from '@/_ui/Select';
import { components } from 'react-select';
import Check from '@/_ui/Icon/solidIcons/Check';
import Icon from '@/_ui/Icon/solidIcons/index';
import {
  DeprecatedColumnTooltip,
  checkIfTableColumnDeprecated,
} from '../../Inspector/Components/Table/ColumnManager/DeprecatedColumnTypeMsg';

export const Option = (props) => {
  const isDeprecated = checkIfTableColumnDeprecated(props.value);
  return (
    <components.Option {...props}>
      <DeprecatedColumnTooltip columnType={props.value}>
        <div className="d-flex justify-content-between">
          <span>{props.label}</span>
          {props.isSelected && (
            <span>
              <Check width={'20'} fill={'#3E63DD'} />
            </span>
          )}
          {isDeprecated && (
            <span>
              <Icon name={'warning'} height={16} width={16} fill="#DB4324" />
            </span>
          )}
        </div>
      </DeprecatedColumnTooltip>
    </components.Option>
  );
};

const CustomMenuList = (props) => {
  return (
    <div>
      <input
        style={{
          height: 0,
          width: 0,
          outline: 'none',
          border: 'none',
          position: 'fixed',
          top: 0,
          left: 0,
          backgroundColor: 'transparent',
        }}
        id="crash-hack-select"
        type="text"
      />
      <components.MenuList {...props} />
    </div>
  );
};

const selectCustomStyles = (width) => {
  return {
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
        width: width,
        minHeight: '32px',
        color: 'var(--slate12)',
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
    singleValue: (provided) => ({
      ...provided,
      color: 'var(--slate12)',
    }),
  };
};

export const Select = ({ value, onChange, meta, width = '144px' }) => {
  useEffect(() => {
    document.getElementById('crash-hack-select')?.focus();
    document.getElementById('crash-hack-select-container')?.focus();
  });
  return (
    <div
      onMouseEnter={() => {
        document.getElementById('crash-hack-select')?.focus();
        document.getElementById('crash-hack-select-container')?.focus();
      }}
      className="row fx-container"
      data-cy={`dropdown-${
        meta?.displayName ? String(meta?.displayName).toLowerCase().replace(/\s+/g, '-') : 'common'
      }`}
    >
      <div className="field" onClick={(e) => e.stopPropagation()}>
        <input
          style={{
            height: 0,
            width: 0,
            outline: 'none',
            border: 'none',
            position: 'fixed',
            top: 0,
            left: 0,
            backgroundColor: 'transparent',
          }}
          id="crash-hack-select-container"
          type="text"
        />
        <SelectComponent
          options={meta.options}
          value={value}
          hasSearch={true}
          onChange={onChange}
          width={224}
          height={32}
          styles={selectCustomStyles(width)}
          useCustomStyles={true}
          classNamePrefix="inspector-select"
          components={{
            IndicatorSeparator: () => null,
            Option,
            MenuList: CustomMenuList, // Add custom MenuList
          }}
        />
      </div>
    </div>
  );
};
