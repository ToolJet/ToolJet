import React from 'react';
import Select, { components } from 'react-select';
import tjdbDropdownStyles, { dataTypes, formatOptionLabel, defaultdataType } from '../constants';

function TableDetailsDropdown({ firstColumnName, secondColumnName, firstColumnPlaceholder, secondColumnPlaceholder }) {
  const { Option } = components;
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const darkDisabledBackground = '#1f2936';
  const lightDisabledBackground = '#f4f6fa';
  const lightFocussedBackground = '#fff';
  const darkFocussedBackground = 'transparent';
  const lightBackground = '#fff';
  const darkBackground = 'transparent';

  const darkBorderHover = '#dadcde';
  const lightBorderHover = '#dadcde';

  const darkDisabledBorder = '#3a3f42';
  const lightDisabledBorder = '#dadcde';
  const lightFocussedBorder = '#3E63DD !important';
  const darkFocussedBorder = '#3E63DD !important';
  const lightBorder = '#dadcde';
  const darkBorder = '#dadcde';
  const dropdownContainerWidth = '100%';

  const CustomSelectOption = (props) => (
    <Option {...props}>
      <div className="selected-dropdownStyle d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center justify-content-start">
          <div>{props.data.icon}</div>
          <span className="dataType-dropdown-label">{props.data.label}</span>
          <span className="dataType-dropdown-value">{props.data.name}</span>
        </div>
        {/* <div>
          {columns[columnSelection.index].data_type === props.data.value ? (
            <div>
              <Tick width="16" height="16" />
            </div>
          ) : null}
        </div> */}
      </div>
    </Option>
  );

  const customStyles = tjdbDropdownStyles(
    darkMode,
    darkDisabledBackground,
    lightDisabledBackground,
    lightFocussedBackground,
    darkFocussedBackground,
    lightBackground,
    darkBackground,
    darkBorderHover,
    lightBorderHover,
    darkDisabledBorder,
    lightDisabledBorder,
    lightFocussedBorder,
    darkFocussedBorder,
    lightBorder,
    darkBorder,
    dropdownContainerWidth
  );

  return (
    <div className="mt-3">
      <div className="d-flex align-items-center justify-content-between">
        <span className="keyRelation-column-title">{firstColumnName}</span>
        <div style={{ width: '80%' }}>
          <Select
            height="36px"
            options={dataTypes}
            components={{
              Option: CustomSelectOption,
              IndicatorSeparator: () => null,
            }}
            styles={customStyles}
            formatOptionLabel={formatOptionLabel}
            placeholder={firstColumnPlaceholder}
          />
        </div>
      </div>

      <div className="d-flex align-items-center justify-content-between mt-2">
        <span className="keyRelation-column-title">{secondColumnName}</span>
        <div style={{ width: '80%' }}>
          <Select
            height="36px"
            options={dataTypes}
            components={{
              Option: CustomSelectOption,
              IndicatorSeparator: () => null,
            }}
            styles={customStyles}
            formatOptionLabel={formatOptionLabel}
            placeholder={secondColumnPlaceholder}
          />
        </div>
      </div>
    </div>
  );
}

export default TableDetailsDropdown;
