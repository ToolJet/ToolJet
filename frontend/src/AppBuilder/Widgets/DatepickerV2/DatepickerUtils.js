import moment from 'moment-timezone';

export const getUnixTime = (date) => {
  return moment(date).valueOf();
};

export const getSelectedTimestampFromUnixTimestamp = (unixTimestamp, displayTimezone, isTimezoneEnabled) => {
  if (!isTimezoneEnabled) return unixTimestamp;
  const localTimeOffset = moment(unixTimestamp).utcOffset();
  const selectedTimeOffset = moment(unixTimestamp).tz(displayTimezone).utcOffset();
  const modifiedTime = moment(unixTimestamp).subtract(localTimeOffset - selectedTimeOffset, 'minutes');
  return modifiedTime.valueOf();
};

export const getUnixTimestampFromSelectedTimestamp = (selectedTime, displayTimezone, isTimezoneEnabled) => {
  if (!isTimezoneEnabled) return selectedTime;
  const localTimeOffset = moment(selectedTime).utcOffset();
  const selectedTimeOffset = moment(selectedTime).tz(displayTimezone).utcOffset();
  const modifiedTime = moment(selectedTime).add(localTimeOffset - selectedTimeOffset, 'minutes');
  return modifiedTime.valueOf();
};

export const convertToIsoWithTimezoneOffset = (timestamp, timezone) => {
  return moment.tz(timestamp, timezone).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
};

export const getFormattedSelectTimestamp = (selectedTime, displayFormat) => {
  return moment(selectedTime).format(displayFormat);
};

export const is24HourFormat = (displayFormat) => {
  const uses24HourTokens = /H{1,2}/.test(displayFormat);
  const hasAmPm = /[aA]/.test(displayFormat);
  return uses24HourTokens && !hasAmPm;
};
