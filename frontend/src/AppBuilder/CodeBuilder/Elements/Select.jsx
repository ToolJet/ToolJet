import React from 'react';
import SelectComponent from '@/_ui/Select';
import { components } from 'react-select';
import Check from '@/_ui/Icon/solidIcons/Check';
import Icon from '@/_ui/Icon/solidIcons/index';
import { DeprecatedColumnTooltip } from '@/AppBuilder/RightSideBar/Inspector/Components/Table/ColumnManager/DeprecatedColumnTypeMsg';
import { checkIfInputWidgetTypeIsDeprecated } from '@/AppBuilder/Widgets/BaseComponents/hooks/useInput';
import { checkIfStarRatingLabelTypeIsDeprecated } from '@/AppBuilder/Widgets/Rating/Rating';

// An option of a generic inspector select is marked only for the deprecated styles below. A Table column type's
// deprecation is marked by the Table's own column-type field (ColumnTypeOption): read from any option's raw value here,
// it marked a UI 2.0 Button's Variant "Default" (value 'default') as a "Deprecating column type".
export const Option = (props) => {
  const isDeprecatedStyle =
    checkIfInputWidgetTypeIsDeprecated(props.value) || checkIfStarRatingLabelTypeIsDeprecated(props.value);

  return (
    <components.Option {...props}>
      <DeprecatedColumnTooltip isDeprecatedStyle={isDeprecatedStyle}>
        <div className="d-flex justify-content-between">
          <span>{props.label}</span>
          {props.isSelected && (
            <span>
              <Check width={'20'} fill={'#3E63DD'} />
            </span>
          )}
          {isDeprecatedStyle && (
            <span>
              <Icon name={'warning'} height={16} width={16} fill="#DB4324" />
            </span>
          )}
        </div>
      </DeprecatedColumnTooltip>
    </components.Option>
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
      display: 'flex',
      alignItems: 'center',
    }),
    singleValue: (provided) => ({
      ...provided,
      paddingLeft: '0px',
      color: 'var(--slate12)',
    }),
  };
};

// An option whose value is '' (a UI 2.0 Heading's or Text's "Default" weight, which leaves the theme's) never showed as
// chosen: the select reads '' as no value and drew a blank field, also right after picking it. It is offered under a
// stand-in value, shown when the value is '' or unset, and written back as ''.
const EMPTY_OPTION = '__tj-empty-option__';

export const Select = ({ value, onChange, meta, width = '144px' }) => {
  const hasEmpty = (meta?.options ?? []).some((option) => option?.value === '');
  const options = hasEmpty
    ? meta.options.map((option) => (option?.value === '' ? { ...option, value: EMPTY_OPTION } : option))
    : meta.options;
  const shown = hasEmpty && (value === '' || value === undefined || value === null) ? EMPTY_OPTION : value;
  return (
    <div
      className="row fx-container"
      data-cy={`dropdown-${
        meta?.displayName ? String(meta?.displayName).toLowerCase().replace(/\s+/g, '-') : 'common'
      }`}
    >
      <div className="field" onClick={(e) => e.stopPropagation()}>
        <SelectComponent
          options={options}
          value={shown}
          hasSearch={true}
          onChange={hasEmpty ? (next) => onChange(next === EMPTY_OPTION ? '' : next) : onChange}
          width={224}
          height={32}
          styles={selectCustomStyles(width)}
          useCustomStyles={true}
          customClassPrefix="inspector-select"
          components={{
            IndicatorSeparator: () => null,
            Option,
          }}
        />
      </div>
    </div>
  );
};
