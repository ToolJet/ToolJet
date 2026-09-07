import React from 'react';
import BigInt from './Icons/Biginteger.svg';
import Float from './Icons/Float.svg';
import Integer from './Icons/Integer.svg';
import CharacterVar from './Icons/Text.svg';
import Boolean from './Icons/Toggle.svg';
import Serial from './Icons/Serial.svg';
import ArrowRight from './Icons/ArrowRight.svg';
import RightFlex from './Icons/Right-flex.svg';
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

export const tzStrings = [
  { label: '(GMT-12:00) International Date Line West', value: 'Etc/GMT+12' },
  { label: '(GMT-11:00) Midway Island, Samoa', value: 'Pacific/Midway' },
  { label: '(GMT-10:00) Hawaii', value: 'Pacific/Honolulu' },
  { label: '(GMT-09:00) Alaska', value: 'US/Alaska' },
  { label: '(GMT-08:00) Pacific Time (US & Canada)', value: 'America/Los_Angeles' },
  { label: '(GMT-08:00) Tijuana, Baja California', value: 'America/Tijuana' },
  { label: '(GMT-07:00) Arizona', value: 'US/Arizona' },
  { label: '(GMT-07:00) Chihuahua, La Paz, Mazatlan', value: 'America/Chihuahua' },
  { label: '(GMT-07:00) Mountain Time (US & Canada)', value: 'US/Mountain' },
  { label: '(GMT-06:00) Central America', value: 'America/Managua' },
  { label: '(GMT-06:00) Central Time (US & Canada)', value: 'US/Central' },
  { label: '(GMT-06:00) Guadalajara, Mexico City, Monterrey', value: 'America/Mexico_City' },
  { label: '(GMT-06:00) Saskatchewan', value: 'Canada/Saskatchewan' },
  { label: '(GMT-05:00) Bogota, Lima, Quito, Rio Branco', value: 'America/Bogota' },
  { label: '(GMT-05:00) Eastern Time (US & Canada)', value: 'US/Eastern' },
  { label: '(GMT-05:00) Indiana (East)', value: 'US/East-Indiana' },
  { label: '(GMT-04:00) Atlantic Time (Canada)', value: 'Canada/Atlantic' },
  { label: '(GMT-04:00) Caracas, La Paz', value: 'America/Caracas' },
  { label: '(GMT-04:00) Manaus', value: 'America/Manaus' },
  { label: '(GMT-04:00) Santiago', value: 'America/Santiago' },
  { label: '(GMT-03:30) Newfoundland', value: 'Canada/Newfoundland' },
  { label: '(GMT-03:00) Brasilia', value: 'America/Sao_Paulo' },
  { label: '(GMT-03:00) Buenos Aires, Georgetown', value: 'America/Argentina/Buenos_Aires' },
  { label: '(GMT-03:00) Greenland', value: 'America/Godthab' },
  { label: '(GMT-03:00) Montevideo', value: 'America/Montevideo' },
  { label: '(GMT-02:00) Mid-Atlantic', value: 'America/Noronha' },
  { label: '(GMT-01:00) Cape Verde Is.', value: 'Atlantic/Cape_Verde' },
  { label: '(GMT-01:00) Azores', value: 'Atlantic/Azores' },
  { label: '(GMT+00:00) UTC', value: 'UTC' },
  { label: '(GMT+00:00) Casablanca, Monrovia, Reykjavik', value: 'Africa/Casablanca' },
  { label: '(GMT+00:00) Greenwich Mean Time : Dublin, Edinburgh, Lisbon, London', value: 'Etc/Greenwich' },
  { label: '(GMT+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna', value: 'Europe/Amsterdam' },
  { label: '(GMT+01:00) Belgrade, Bratislava, Budapest, Ljubljana, Prague', value: 'Europe/Belgrade' },
  { label: '(GMT+01:00) Brussels, Copenhagen, Madrid, Paris', value: 'Europe/Brussels' },
  { label: '(GMT+01:00) Sarajevo, Skopje, Warsaw, Zagreb', value: 'Europe/Sarajevo' },
  { label: '(GMT+01:00) West Central Africa', value: 'Africa/Lagos' },
  { label: '(GMT+02:00) Amman', value: 'Asia/Amman' },
  { label: '(GMT+02:00) Athens, Bucharest, Istanbul', value: 'Europe/Athens' },
  { label: '(GMT+02:00) Beirut', value: 'Asia/Beirut' },
  { label: '(GMT+02:00) Cairo', value: 'Africa/Cairo' },
  { label: '(GMT+02:00) Harare, Pretoria', value: 'Africa/Harare' },
  { label: '(GMT+02:00) Helsinki, Kyiv, Riga, Sofia, Tallinn, Vilnius', value: 'Europe/Helsinki' },
  { label: '(GMT+02:00) Jerusalem', value: 'Asia/Jerusalem' },
  { label: '(GMT+02:00) Minsk', value: 'Europe/Minsk' },
  { label: '(GMT+02:00) Windhoek', value: 'Africa/Windhoek' },
  { label: '(GMT+03:00) Kuwait, Riyadh, Baghdad', value: 'Asia/Kuwait' },
  { label: '(GMT+03:00) Moscow, St. Petersburg, Volgograd', value: 'Europe/Moscow' },
  { label: '(GMT+03:00) Nairobi', value: 'Africa/Nairobi' },
  { label: '(GMT+03:00) Tbilisi', value: 'Asia/Tbilisi' },
  { label: '(GMT+03:30) Tehran', value: 'Asia/Tehran' },
  { label: '(GMT+04:00) Abu Dhabi, Muscat', value: 'Asia/Muscat' },
  { label: '(GMT+04:00) Baku', value: 'Asia/Baku' },
  { label: '(GMT+04:00) Yerevan', value: 'Asia/Yerevan' },
  { label: '(GMT+04:30) Kabul', value: 'Asia/Kabul' },
  { label: '(GMT+05:00) Yekaterinburg', value: 'Asia/Yekaterinburg' },
  { label: '(GMT+05:00) Islamabad, Karachi, Tashkent', value: 'Asia/Karachi' },
  { label: '(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi', value: 'Asia/Calcutta' },
  { label: '(GMT+05:30) Sri Jayawardenapura', value: 'Asia/Calcutta' },
  { label: '(GMT+05:45) Kathmandu', value: 'Asia/Katmandu' },
  { label: '(GMT+06:00) Almaty, Novosibirsk', value: 'Asia/Almaty' },
  { label: '(GMT+06:00) Astana, Dhaka', value: 'Asia/Dhaka' },
  { label: '(GMT+06:30) Yangon (Rangoon)', value: 'Asia/Rangoon' },
  { label: '(GMT+07:00) Bangkok, Hanoi, Jakarta', value: 'Asia/Bangkok' },
  { label: '(GMT+07:00) Krasnoyarsk', value: 'Asia/Krasnoyarsk' },
  { label: '(GMT+08:00) Beijing, Chongqing, Hong Kong, Urumqi', value: 'Asia/Hong_Kong' },
  { label: '(GMT+08:00) Kuala Lumpur, Singapore', value: 'Asia/Kuala_Lumpur' },
  { label: '(GMT+08:00) Irkutsk, Ulaan Bataar', value: 'Asia/Irkutsk' },
  { label: '(GMT+08:00) Perth', value: 'Australia/Perth' },
  { label: '(GMT+08:00) Taipei', value: 'Asia/Taipei' },
  { label: '(GMT+09:00) Osaka, Sapporo, Tokyo', value: 'Asia/Tokyo' },
  { label: '(GMT+09:00) Seoul', value: 'Asia/Seoul' },
  { label: '(GMT+09:00) Yakutsk', value: 'Asia/Yakutsk' },
  { label: '(GMT+09:30) Adelaide', value: 'Australia/Adelaide' },
  { label: '(GMT+09:30) Darwin', value: 'Australia/Darwin' },
  { label: '(GMT+10:00) Brisbane', value: 'Australia/Brisbane' },
  { label: '(GMT+10:00) Canberra, Melbourne, Sydney', value: 'Australia/Canberra' },
  { label: '(GMT+10:00) Hobart', value: 'Australia/Hobart' },
  { label: '(GMT+10:00) Guam, Port Moresby', value: 'Pacific/Guam' },
  { label: '(GMT+10:00) Vladivostok', value: 'Asia/Vladivostok' },
  { label: '(GMT+11:00) Magadan, Solomon Is., New Caledonia', value: 'Asia/Magadan' },
  { label: '(GMT+12:00) Auckland, Wellington', value: 'Pacific/Auckland' },
  { label: '(GMT+12:00) Fiji, Kamchatka, Marshall Is.', value: 'Pacific/Fiji' },
  { label: "(GMT+13:00) Nuku'alofa", value: 'Pacific/Tongatapu' },
];

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

export const listAllPrimaryKeyColumns = (columns) => {
  const primarykeyColumns = [];
  columns.forEach((column) => {
    if ((column?.constraints_type?.is_primary_key ?? false) && column.accessor) primarykeyColumns.push(column.accessor);
  });
  return primarykeyColumns;
};
