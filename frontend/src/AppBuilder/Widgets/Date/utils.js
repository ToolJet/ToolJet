import moment from 'moment-timezone';

export const getUnixTime = (date, displayFormat) => {
  if (!date && date !== 0) return null;
  const numberDate = Number(date);
  if (!isNaN(numberDate) && numberDate > 99999) return Number(date);
  const momentObj = moment(date, displayFormat);
  const val = momentObj.utc().valueOf();
  return val === 'Invalid date' ? null : val;
};

export const getSelectedTimestampFromUnixTimestamp = (
  unixTimestamp,
  displayTimezone = moment.tz.guess(),
  isTimezoneEnabled = false
) => {
  if (!isTimezoneEnabled || !unixTimestamp) return unixTimestamp;
  const localTimeOffset = moment(unixTimestamp).utcOffset();
  const selectedTimeOffset = moment(unixTimestamp).tz(displayTimezone).utcOffset();
  const modifiedTime = moment(unixTimestamp).subtract(localTimeOffset - selectedTimeOffset, 'minutes');
  return modifiedTime.valueOf() === 'Invalid date' ? null : modifiedTime.valueOf();
};

export const getUnixTimestampFromSelectedTimestamp = (
  selectedTime,
  displayTimezone = moment.tz.guess(),
  isTimezoneEnabled = false
) => {
  if (!isTimezoneEnabled || !selectedTime) return selectedTime;
  const localTimeOffset = moment(selectedTime).utcOffset();
  const selectedTimeOffset = moment(selectedTime).tz(displayTimezone).utcOffset();
  const modifiedTime = moment(selectedTime).add(localTimeOffset - selectedTimeOffset, 'minutes');
  return modifiedTime.valueOf() === 'Invalid date' ? null : modifiedTime.valueOf();
};

export const convertToIsoWithTimezoneOffset = (timestamp, timezone) => {
  const val = moment.tz(timestamp, timezone).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
  return val === 'Invalid date' ? null : val;
};

export const getFormattedSelectTimestamp = (selectedTime, displayFormat) => {
  const val = moment(selectedTime).format(displayFormat);
  return val === 'Invalid date' ? null : val;
};

export const is24HourFormat = (displayFormat) => {
  const uses24HourTokens = /H{1,2}/.test(displayFormat);
  const hasAmPm = /[aA]/.test(displayFormat);
  return uses24HourTokens && !hasAmPm;
};

<<<<<<< HEAD
export const isMinTimeValid = (minTime, selectedDate) => {
  try {
    if (!minTime) return true;
    const momentObj = moment(selectedDate);
    const [minHour, minMinute] = minTime.split(':');
    const [selectedHour, selectedMinute] = [momentObj.hour(), momentObj.minute()];
    if (selectedHour < minHour) return false;
    if (selectedHour == minHour && selectedMinute < minMinute) return false;
    return true;
  } catch (e) {
    return true;
  }
};

export const isMaxTimeValid = (maxTime, selectedDate) => {
  try {
    if (!maxTime) return true;
    const momentObj = moment(selectedDate);
    const [maxHour, maxMinute] = maxTime.split(':');
    const [selectedHour, selectedMinute] = [momentObj.hour(), momentObj.minute()];
    if (selectedHour > maxHour) return false;
    if (selectedHour == maxHour && selectedMinute > maxMinute) return false;
    return true;
  } catch (e) {
    return true;
  }
};

export const isMaxDateValid = (maxDate, selectedDate) => {
  if (!maxDate) return true;
  const val = moment(selectedDate).isSameOrBefore(maxDate);
  return val === 'Invalid date' ? true : val;
};

export const isMinDateValid = (minDate, selectedDate) => {
  if (!minDate) return true;
  const val = moment(selectedDate).isSameOrAfter(minDate);
  return val === 'Invalid date' ? true : val;
=======
export const isMinTimeValid = (minDate, selectedDate, dateFormat) => {
  if (!minDate) return true;

  const parsedMinDate = moment(minDate, dateFormat, true);
  if (!parsedMinDate.isValid()) return true;

  const selectedHours = moment(selectedDate).hours();
  const selectedMinutes = moment(selectedDate).minutes();

  const selectedTime = parsedMinDate.clone().hours(selectedHours).minutes(selectedMinutes);

  return selectedTime.isSameOrAfter(parsedMinDate);
};

export const isMaxTimeValid = (minDate, selectedDate, dateFormat) => {
  if (!minDate) return true;

  const parsedMaxDate = moment(minDate, dateFormat, true);
  if (!parsedMaxDate.isValid()) return true;

  const selectedHours = moment(selectedDate).hours();
  const selectedMinutes = moment(selectedDate).minutes();

  const selectedTime = parsedMaxDate.clone().hours(selectedHours).minutes(selectedMinutes);

  return selectedTime.isSameOrBefore(parsedMaxDate);
};

export const isMaxDateValid = (maxDate, selectedDate, dateFormat) => {
  if (!maxDate) return true;
  const parsedSelectedDate = moment(selectedDate);
  const parsedMaxDate = moment(maxDate, dateFormat, true);

  if (!parsedSelectedDate.isValid() || !parsedMaxDate.isValid()) {
    return true;
  }

  return parsedSelectedDate.isSameOrBefore(parsedMaxDate);
};

export const isMinDateValid = (minDate, selectedDate, dateFormat) => {
  if (!minDate) return true;
  const parsedSelectedDate = moment(selectedDate);
  const parsedMinDate = moment(minDate, dateFormat, true);

  if (!parsedSelectedDate.isValid() || !parsedMinDate.isValid()) {
    return true;
  }

  return parsedSelectedDate.isSameOrAfter(parsedMinDate);
>>>>>>> main
};

export const isCustomRuleValid = (customRule) => {
  if (typeof customRule === 'string' && customRule !== '') {
    return false;
  }
  return true;
};

export const isMandatoryValid = (isMandatory, selectedDate) => {
  if (isMandatory && !selectedDate) return false;
  return true;
};

<<<<<<< HEAD
export const isDateValid = (selectedDate, validation) => {
  const { minDate, maxDate, minTime, maxTime, customRule, excludedDates } = validation;
  if (!isMinDateValid(minDate, selectedDate) && moment(minDate, 'DD/MM/YYYY').isValid())
    return {
      isValid: false,
      validationError: `Selected date is less than minimum date (${moment(minDate, 'DD/MM/YYYY').format(
        'DD/MM/YYYY'
      )})`,
    };

  if (!isMaxDateValid(maxDate, selectedDate) && moment(maxDate, 'DD/MM/YYYY').isValid())
    return {
      isValid: false,
      validationError: `Selected date is greater than maximum date (${moment(maxDate, 'DD/MM/YYYY').format(
        'DD/MM/YYYY'
      )})`,
    };

  if (!isMinTimeValid(minTime, selectedDate))
    return { isValid: false, validationError: `Selected time is less than minimum time (${minTime})` };

  if (!isMaxTimeValid(maxTime, selectedDate))
=======
export const isDateRangeValid = (startDate, endDate, excludedDates, format) => {
  const parsedStartDate = moment(startDate, format, true);
  const parsedEndDate = moment(endDate, format, true);

  if (!parsedStartDate.isValid() || !parsedEndDate.isValid()) {
    return { isValid: true, validationError: '' };
  }

  if (excludedDates && excludedDates.length) {
    const isExcluded = excludedDates.find((date) =>
      moment(date, format, true).isBetween(parsedStartDate, parsedEndDate, 'day', '[]')
    );
    console.log('isExcluded', isExcluded);
    if (isExcluded) return { isValid: false, validationError: 'Selected date range is excluded' };
  }

  return { isValid: true, validationError: '' };
};

export const isDateValid = (selectedDate, validation) => {
  const { minDate, maxDate, minTime, maxTime, customRule, excludedDates, isMandatory, dateFormat, timeFormat } =
    validation;

  if (!isMandatoryValid(isMandatory, selectedDate)) return { isValid: false, validationError: 'Input is mandatory' };

  if (!isMinDateValid(minDate, selectedDate, dateFormat) && moment(minDate, dateFormat).isValid())
    return {
      isValid: false,
      validationError: `Selected date is less than minimum date (${moment(minDate, dateFormat).format(dateFormat)})`,
    };

  if (!isMaxDateValid(maxDate, selectedDate, dateFormat) && moment(maxDate, dateFormat).isValid())
    return {
      isValid: false,
      validationError: `Selected date is greater than maximum date (${moment(maxDate, dateFormat).format(dateFormat)})`,
    };

  if (!isMinTimeValid(minTime, selectedDate, timeFormat))
    return { isValid: false, validationError: `Selected time is less than minimum time (${minTime})` };

  if (!isMaxTimeValid(maxTime, selectedDate, timeFormat))
>>>>>>> main
    return { isValid: false, validationError: `Selected time is greater than maximum time (${maxTime})` };

  if (!isCustomRuleValid(customRule)) return { isValid: false, validationError: customRule };

  if (excludedDates && excludedDates.length) {
<<<<<<< HEAD
    const isExcluded = excludedDates.find((date) => moment(date, 'DD/MM/YYYY').isSame(selectedDate, 'day'));
=======
    const isExcluded = excludedDates.find((date) => moment(date, dateFormat).isSame(selectedDate, 'day'));
>>>>>>> main
    if (isExcluded) return { isValid: false, validationError: 'Selected date is excluded' };
  }

  return { isValid: true, validationError: '' };
};
