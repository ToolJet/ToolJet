import { get } from 'lodash';
/**
 * Checks if the queryOptions object contains a filter with an 'eq' (equal) operator and a value equal to '{{null}}'.
 *
 * @function hasNullValueInFilters
 * @param {Object} queryOptions - The query options object to check for the presence of the specified filter.
 * @property {Object} queryOptions.list_rows.where_filters - An object containing the filters to be checked.
 * @returns {boolean} - Returns true if the specified filter is found, false otherwise.
 *
 * @example
 * const queryOptions = {
 *   list_rows: {
 *     where_filters: {
 *       filter1: {
 *         operator: 'eq',
 *         value: '{{null}}',
 *       },
 *     },
 *   },
 * };
 *
 * const result = hasNullValueInFilters(queryOptions); // true
 */
export const hasNullValueInFilters = (queryOptions, operation) => {
  const filters = get(queryOptions, `${operation}.where_filters`);
  if (filters) {
    const filterKeys = Object.keys(filters);
    for (let i = 0; i < filterKeys.length; i++) {
      const filter = filters[filterKeys[i]];
      if (filter.operator !== 'is' && filter.value === null) {
        return true;
      }
    }
  }
  return false;
};

export const isOperatorOptions = [
  { value: 'null', label: 'null' },
  { value: 'notNull', label: 'not null' },
];

export const filterOperatorOptions = [
  { label: 'equals', value: '=' },
  { label: 'greater than', value: '>' },
  { label: 'greater than or equal', value: '>=' },
  { label: 'less than', value: '<' },
  { label: 'less than or equal', value: '<=' },
  { label: 'not equal', value: '!=' },
  { label: 'like', value: 'LIKE' },
  { label: 'not like', value: 'NOT LIKE' },
  { label: 'ilike', value: 'ILIKE' },
  { label: 'not ilike', value: 'NOT ILIKE' },
  { label: 'match', value: '~' },
  { label: 'imatch', value: '~*' },
  { label: 'in', value: 'IN' },
  { label: 'not in', value: 'NOT IN' },
  { label: 'is', value: 'IS' },
];

export const nullOperatorOptions = [
  { label: 'null', value: 'NULL' },
  { label: 'not null', value: 'NOT NULL' },
];

export const convertToDateType = (dateString, timeZone) => {
  const date = new Date(dateString);
  if (date.toString() === 'Invalid Date') return null;
  return new Date(date.toLocaleString('en-US', { timeZone, hour12: false }));
};

export const convertDateToTimeZoneFormatted = (
  dateString,
  targetTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  formatString = 'dd/MM/yyyy, hh:mm a'
) => {
  try {
    const utcDate = new Date(dateString);
    const options = {
      timeZone: targetTimeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };

    const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(utcDate);
    const dateComponents = {};

    parts.forEach(({ type, value }) => {
      dateComponents[type] = value;
    });

    let formattedDate = formatString
      .replace('dd', dateComponents.day)
      .replace('MM', dateComponents.month)
      .replace('yyyy', dateComponents.year)
      .replace('hh', dateComponents.hour.padStart(2, '0'))
      .replace('mm', dateComponents.minute.padStart(2, '0'))
      .replace('a', dateComponents.dayPeriod.toUpperCase());

    return formattedDate;
  } catch (e) {
    return dateString;
  }
};

// Function to get the current date in a specific time zone
const getDateInTimeZone = (timeZone) => new Date().toLocaleString('en-US', { timeZone, hour12: false });

export const formatDate = (date, timeZone) => {
  if (date) {
    const dateInSeconds = Math.floor(new Date(date).getTime() / 1000);

    const dateInTimeZone = new Date(getDateInTimeZone(timeZone));
    const dateInTimeZoneInSeconds = Math.floor(dateInTimeZone.getTime() / 1000);

    const dateInUTC = new Date(getDateInTimeZone('UTC'));
    const dateInUTCInSeconds = Math.floor(dateInUTC.getTime() / 1000);

    const offset = dateInTimeZoneInSeconds - dateInUTCInSeconds;

    const dateWithRemovedOffset = dateInSeconds - offset - new Date().getTimezoneOffset() * 60;
    return new Date(dateWithRemovedOffset * 1000).toISOString();
  } else {
    return null;
  }
};

// Function to get the UTC offset for a given time zone
export const getUTCOffset = (timeZone) => {
  const dateInTimeZone = new Date(getDateInTimeZone(timeZone));
  const dateInTimeZoneInSeconds = dateInTimeZone.getTime() / 1000;

  const dateInUTC = new Date(getDateInTimeZone('UTC'));
  const dateInUTCInSeconds = dateInUTC.getTime() / 1000;

  const difference = Math.floor((dateInTimeZoneInSeconds - dateInUTCInSeconds) / 60);

  const offsetHours = Math.floor(difference / 60);
  const offsetMinutes = difference % 60;
  const offsetSign = difference >= 0 ? '+ ' : '- ';
  const formattedOffset = `${offsetSign}${Math.abs(offsetHours).toString()}:${Math.abs(offsetMinutes)
    .toString()
    .padStart(2, '0')}`;
  return formattedOffset;
};

// Function to format the time zone display name
const formatTimeZoneLabel = (timeZone, offset) => `${timeZone} (UTC ${offset})`;

// Function to get the local time zone with its UTC offset
const getLocalTimeZoneWithOffset = () => {
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localOffset = getUTCOffset(localTimeZone);
  return {
    label: `Local time (UTC ${localOffset})`,
    value: localTimeZone,
  };
};

// Main function to get and log the list of time zones with UTC offsets
export const timeZonesWithOffsets = () => {
  const timeZones = Intl.supportedValuesOf('timeZone');
  const localTimeZone = getLocalTimeZoneWithOffset();
  const formattedTimeZones = timeZones.map((tz) => ({
    label: formatTimeZoneLabel(tz, getUTCOffset(tz)),
    value: tz,
  }));
  const timeZonesWithLocal = [localTimeZone, ...formattedTimeZones];
  return timeZonesWithLocal;
};

export const getLocalTimeZone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};
