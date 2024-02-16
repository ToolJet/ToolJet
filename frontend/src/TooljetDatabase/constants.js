import React from 'react';
import BigInt from './Icons/Biginteger.svg';
import Float from './Icons/Float.svg';
import Integer from './Icons/Integer.svg';
import CharacterVar from './Icons/Text.svg';
import Boolean from './Icons/Toggle.svg';

export const dataTypes = [
  {
    name: 'Varying character strings',
    label: 'varchar',
    icon: <CharacterVar width="16" height="16" />,
    value: 'character varying',
  },
  { name: 'Integers up to 4 bytes', label: 'int', icon: <Integer width="16" height="16" />, value: 'integer' },
  { name: 'Integers up to 8 bytes', label: 'bigint', icon: <BigInt width="16" height="16" />, value: 'bigint' },
  { name: 'Decimal numbers', label: 'float', icon: <Float width="16" height="16" />, value: 'double precision' },
  { name: 'Boolean True/False', label: 'boolean', icon: <Boolean width="16" height="16" />, value: 'boolean' },
];

export const primaryKeydataTypes = [{ value: 'serial', label: 'serial' }];

export const operators = [
  { value: 'eq', label: 'equals' },
  { value: 'gt', label: 'greater than' },
  { value: 'gte', label: 'greater than or equal' },
  { value: 'lt', label: 'less than' },
  { value: 'lte', label: 'less than or equal' },
  { value: 'neq', label: 'not equal' },
  { value: 'like', label: 'like' },
  { value: 'ilike', label: 'ilike' },
  { value: 'match', label: 'match' },
  { value: 'imatch', label: 'imatch' },
  { value: 'in', label: 'in' },
  { value: 'is', label: 'is' },
];

export const formatOptionLabel = ({ label, icon }) => {
  return (
    <div>
      <span style={{ marginRight: '4px' }}>{icon}</span>
      <span>{label}</span>
    </div>
  );
};

export default function tjdbDropdownStyles(
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
) {
  return {
    option: (base, state) => ({
      ...base,
      backgroundColor:
        state.isSelected && !darkMode ? '#F0F4FF' : state.isSelected && darkMode ? '#323C4B' : 'transparent',
      ':hover': {
        backgroundColor: state.isFocused && !darkMode ? '#F0F4FF' : '#323C4B',
      },
      color: darkMode ? '#fff' : '#232e3c',
      cursor: 'pointer',
    }),
    control: (provided, state) => ({
      ...provided,
      background:
        state.isDisabled && darkMode
          ? darkDisabledBackground
          : state.isDisabled && !darkMode
          ? lightDisabledBackground
          : state.isFocused && !darkMode
          ? lightFocussedBackground
          : state.isFocused && darkMode
          ? darkFocussedBackground
          : !darkMode
          ? lightBackground
          : darkBackground,
      borderColor:
        state.isFocused && !darkMode
          ? lightFocussedBorder
          : state.isFocused && darkMode
          ? darkFocussedBorder
          : darkMode && state.isDisabled
          ? !darkMode && state.isDisabled
            ? lightDisabledBorder
            : darkDisabledBorder
          : darkMode
          ? darkBorder
          : lightBorder,
      '&:hover': {
        borderColor: darkMode ? darkBorderHover : lightBorderHover,
      },
      boxShadow: state.isFocused ? 'none' : 'none',
      height: '36px !important',
      minHeight: '36px',
    }),
    menuList: (provided, state) => ({
      ...provided,
      padding: '8px',
      color: darkMode ? '#fff' : '#232e3c',
    }),
    menu: (base) => ({
      ...base,
      width: dropdownContainerWidth,
      background: darkMode ? 'rgb(31,40,55)' : 'white',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: darkMode ? '#fff' : '#232e3c',
    }),
  };
}
