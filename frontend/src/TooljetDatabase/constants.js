import React from 'react';
import BigInt from './Icons/Biginteger.svg';
import Float from './Icons/Float.svg';
import Integer from './Icons/Integer.svg';
import CharacterVar from './Icons/Text.svg';
import Boolean from './Icons/Toggle.svg';
import Serial from './Icons/Serial.svg';
import ArrowRight from './Icons/ArrowRight.svg';
import RightFlex from './Icons/Right-flex.svg';

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
  {
    name: 'Auto-incrementing integers',
    label: 'serial',
    icon: <Serial width="16" height="16" />,
    value: 'serial',
  },
];

export const serialDataType = [
  {
    name: 'Auto-incrementing integers',
    label: 'serial',
    icon: <Serial width="16" height="16" />,
    value: 'serial',
  },
];

export const postgresErrorCode = {
  UniqueViolation: '23505',
  CheckViolation: '23514',
  NotNullViolation: '23502',
  ForeignKeyViolation: '23503',
  DataTypeMismatch: '22P02',
};

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

export const checkDefaultValue = (inputString) => {
  // const regex = /^nextval\(.+::regclass\)$/;
  const regex = /^nextval\(/;
  return regex.test(inputString);
};

export const getColumnDataType = (columnDetails) => {
  const { data_type = '', column_default = '' } = columnDetails;
  const result = checkDefaultValue(column_default);

  if (data_type === 'integer' && result) {
    if (result) return 'serial';
  }
  return data_type;
};

export const ChangesComponent = ({
  currentPrimaryKeyIcons,
  newPrimaryKeyIcons,
  foreignKeyChanges,
  existingReferencedTableName,
  existingReferencedColumnName,
  currentReferencedTableName,
  currentReferencedColumnName,
}) => {
  return (
    <div className="new-changes-container">
      <div className="changes-title">
        <span>{foreignKeyChanges && foreignKeyChanges.length > 0 ? 'Current relation' : 'Current primary key'}</span>
        <ArrowRight />
        <span>{foreignKeyChanges && foreignKeyChanges.length > 0 ? 'New relation' : 'New primary key'}</span>
      </div>
      <div className="key-changes-container">
        <div className="primarykeyDetails-container">
          {foreignKeyChanges && foreignKeyChanges.length > 0 ? (
            <>
              <span className="currentPrimaryKey-columnName">{existingReferencedTableName}</span>
              <div className="currentKey-details align-item-center">
                <RightFlex width={16} height={16} />
                <span className="currentPrimaryKey-columnName">{existingReferencedColumnName}</span>
              </div>
            </>
          ) : (
            <>
              {Object.entries(currentPrimaryKeyIcons)?.map(([index, item]) => (
                <div className="currentKey-details" key={index}>
                  {renderDatatypeIcon(item.icon)}
                  <span className="currentPrimaryKey-columnName">{item.columnName}</span>
                </div>
              ))}
            </>
          )}
        </div>
        <div className="newkeyDetails-container">
          {foreignKeyChanges && foreignKeyChanges.length > 0 ? (
            <>
              <span className="currentPrimaryKey-columnName">{currentReferencedTableName}</span>
              <div className="currentKey-details align-item-center">
                <RightFlex width={16} height={16} />
                <span className="currentPrimaryKey-columnName">{currentReferencedColumnName}</span>
              </div>
            </>
          ) : (
            <>
              {Object.entries(newPrimaryKeyIcons)?.map(([index, item]) => (
                <div className="newKey-details" key={index}>
                  {renderDatatypeIcon(item.icon)}
                  <span className="newPrimaryKey-columnName">{item.columnName}</span>
                </div>
              ))}
            </>
          )}
        </div>
        <div></div>
      </div>
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
    menuList: (provided, _state) => ({
      ...provided,
      padding: '8px',
      color: darkMode ? '#fff' : '#232e3c',
    }),
    menu: (base) => ({
      ...base,
      width: dropdownContainerWidth,
      background: darkMode ? 'rgb(31,40,55)' : 'white',
      zIndex: 10,
    }),
    singleValue: (provided) => ({
      ...provided,
      color: darkMode ? '#fff' : '#232e3c',
    }),
    placeholder: () => ({
      position: 'absolute',
      left: '10px',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: '1',
      color: '#7E868C',
      fontSize: '12px',
      lineHeight: '20px',
      fontWeight: '400',
    }),
  };
}

export const renderDatatypeIcon = (type) => {
  switch (type) {
    case 'integer':
      return <Integer width="18" height="18" className="tjdb-column-header-name" />;
    case 'bigint':
      return <BigInt width="18" height="18" className="tjdb-column-header-name" />;
    case 'character varying':
      return <CharacterVar width="18" height="18" className="tjdb-column-header-name" />;
    case 'boolean':
      return <Boolean width="18" height="18" className="tjdb-column-header-name" />;
    case 'double precision':
      return <Float width="18" height="18" className="tjdb-column-header-name" />;
    case 'serial':
      return <Serial width="18" height="14" className="tjdb-column-header-name" />;
    default:
      return type;
  }
};

export const listAllPrimaryKeyColumns = (columns) => {
  const primarykeyColumns = [];
  columns.forEach((column) => {
    if ((column?.constraints_type?.is_primary_key ?? false) && column.accessor) primarykeyColumns.push(column.accessor);
  });
  return primarykeyColumns;
};
