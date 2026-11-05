import React from 'react';
import config from 'config';
import BigInt from './Icons/Biginteger.svg';
import Float from './Icons/Float.svg';
import Integer from './Icons/Integer.svg';
import CharacterVar from './Icons/Text.svg';
import Boolean from './Icons/Toggle.svg';
import Serial from './Icons/Serial.svg';
import Datetime from './Icons/Datetime.svg';
import Jsonb from './Icons/Jsonb.svg';

export const dataTypes = [
  {
    name: 'Varying character strings',
    label: 'varchar',
    icon: <CharacterVar width="16" height="16" />,
    value: 'character varying',
  },
  {
    name: 'JSON data type',
    label: 'jsonb',
    icon: <Jsonb width="16" height="16" />,
    value: 'jsonb',
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
  {
    name: 'Timestamp in ISO8601 format',
    label: 'Date with time',
    icon: <Datetime width="16" height="16" />,
    value: 'timestamp with time zone',
  },
  // { name: 'Binary JSON data', label: 'jsonb', icon: <Jsonb width="16" height="16" />, value: 'jsonb' },
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
        backgroundColor:
          state.isFocused && !darkMode ? '#F0F4FF' : state.isFocused && darkMode ? '#323C4B' : 'transparent',
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
      zIndex: 10001,
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
    case 'timestamp with time zone':
      return <Datetime width="18" height="18" className="tjdb-column-header-name" />;
    case 'jsonb':
      return <Jsonb width="18" height="18" className="tjdb-column-header-name" />;
    default:
      return type;
  }
};

// The last of `appliedMigrationIds` (an environment's applied set) that is still present in the
// full ordered `migrations` chain - i.e. the environment's head migration. Shared by
// MigrationHistoryDrawer (the "<env> is here" badge, matched by id) and ExportCsvModal (the row
// label, derived from the id's index) so this lookup exists in exactly one place.
export const findHeadMigrationId = (migrations = [], appliedMigrationIds = []) =>
  [...appliedMigrationIds].reverse().find((id) => migrations.some((m) => m.id === id)) ?? null;

// Zero-pads the backend-computed `migration_number` (this table's chain position) to 4 digits -
// the fallback label everywhere a migration has no user-given name.
export const formatMigrationNumber = (migrationNumber) => String(migrationNumber).padStart(4, '0');

// Fallback label for the environment's head migration, or null when nothing has been applied yet
// / the head migration has since been dropped from the chain.
export const headMigrationLabel = (migrations = [], appliedMigrationIds = []) => {
  const headId = findHeadMigrationId(migrations, appliedMigrationIds);
  if (headId == null) return null;
  const head = migrations.find((m) => m.id === headId);
  if (!head) return null;
  return head.name || formatMigrationNumber(head.migration_number);
};

export const envHasRelation = (relationsByEnvironment = [], environmentId) =>
  relationsByEnvironment.find((r) => r.environment_id === environmentId)?.has_relation ?? false;

// After a multi-environment licence lapse the server still lists every environment but flags the
// unlicensed ones `enabled: false`. `multiEnvLocked` is the live licence verdict, for a list loaded
// before the lapse.
export const isEnvironmentLocked = (environment, multiEnvLocked = false) =>
  environment.priority !== 1 && (environment.enabled === false || multiEnvLocked);

export const SCHEMA_ENV_TOOLTIP = 'Schema changes can only be made in the Development environment';
export const TABLE_ABSENT_TOOLTIP = 'Table does not exist in this environment';

export const listAllPrimaryKeyColumns = (columns) => {
  const primarykeyColumns = [];
  columns.forEach((column) => {
    if ((column?.constraints_type?.is_primary_key ?? false) && column.accessor) primarykeyColumns.push(column.accessor);
  });
  return primarykeyColumns;
};

export const isSqlModeDisabled = () => {
  // Check legacy environment variable for backward compatibility
  if (window.public_config?.TJDB_SQL_MODE_DISABLE === 'true') {
    return true;
  }

  // Read inline: importing fetchEdition from @/modules/common/helpers/utils creates an import cycle.
  const edition = config.TOOLJET_EDITION?.toLowerCase() || 'ce';
  if (edition === 'cloud') {
    return true;
  }

  return false;
};
