import React from 'react';
import config from 'config';
import { dataTypeIcon, hasDataTypeIcon } from './dataTypeIcons';

const typeIcon = (type) => {
  const Icon = dataTypeIcon(type);
  return <Icon size={16} aria-hidden />;
};

export const dataTypes = [
  {
    name: 'Varying character strings',
    label: 'varchar',
    icon: typeIcon('character varying'),
    value: 'character varying',
  },
  {
    name: 'JSON data type',
    label: 'jsonb',
    icon: typeIcon('jsonb'),
    value: 'jsonb',
  },
  { name: 'Integers up to 4 bytes', label: 'int', icon: typeIcon('integer'), value: 'integer' },
  { name: 'Integers up to 8 bytes', label: 'bigint', icon: typeIcon('bigint'), value: 'bigint' },
  { name: 'Decimal numbers', label: 'float', icon: typeIcon('double precision'), value: 'double precision' },
  { name: 'Boolean True/False', label: 'boolean', icon: typeIcon('boolean'), value: 'boolean' },
  {
    name: 'Auto-incrementing integers',
    label: 'serial',
    icon: typeIcon('serial'),
    value: 'serial',
  },
  {
    name: 'Timestamp in ISO8601 format',
    label: 'Date with time',
    icon: typeIcon('timestamp with time zone'),
    value: 'timestamp with time zone',
  },
  // { name: 'Binary JSON data', label: 'jsonb', icon: typeIcon('jsonb'), value: 'jsonb' },
];

export const serialDataType = [
  {
    name: 'Auto-incrementing integers',
    label: 'serial',
    icon: typeIcon('serial'),
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
  if (!hasDataTypeIcon(type)) return type;
  const Icon = dataTypeIcon(type);
  return <Icon size={18} aria-hidden className="tjdb-column-header-name" />;
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

// Development holds every table. Elsewhere, unknown (tables not loaded yet) counts as present: only a table
// the list says is missing counts as missing.
export const isTableMissingFromEnvironment = (tables, tableId, environment) => {
  if (!environment || environment.priority === 1) return false;
  const relations = tables?.find((table) => table.id === tableId)?.environments;
  return !!relations && !envHasRelation(relations, environment.id);
};

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
