import moment from 'moment';

export const VALIDATION_RANGE_TYPES = {
  LENGTH: 'length',
  VALUE: 'value',
  DATE: 'date',
  TIME: 'time',
};

export const RANGE_TYPE_BY_MIN_PROPERTY = {
  minLength: VALIDATION_RANGE_TYPES.LENGTH,
  minValue: VALIDATION_RANGE_TYPES.VALUE,
  minDate: VALIDATION_RANGE_TYPES.DATE,
  minTime: VALIDATION_RANGE_TYPES.TIME,
};

const isBindingExpression = (value) => typeof value === 'string' && value.includes('{{');

const toNumber = (value) => {
  if (value === undefined || value === null || value === '' || isBindingExpression(value)) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const toMoment = (value, format) => {
  if (value === undefined || value === null || value === '' || isBindingExpression(value)) return null;
  const parsed = moment(value, format, true);
  return parsed.isValid() ? parsed : null;
};

export const hasMinMaxConflict = (rangeType, minRaw, maxRaw) => {
  switch (rangeType) {
    case VALIDATION_RANGE_TYPES.LENGTH:
    case VALIDATION_RANGE_TYPES.VALUE: {
      const min = toNumber(minRaw);
      const max = toNumber(maxRaw);
      return min !== null && max !== null && min > max;
    }
    case VALIDATION_RANGE_TYPES.DATE: {
      const min = toMoment(minRaw, 'MM/DD/YYYY');
      const max = toMoment(maxRaw, 'MM/DD/YYYY');
      return Boolean(min && max && min.isAfter(max));
    }
    case VALIDATION_RANGE_TYPES.TIME: {
      const min = toMoment(minRaw, 'HH:mm');
      const max = toMoment(maxRaw, 'HH:mm');
      return Boolean(min && max && min.isAfter(max));
    }
    default:
      return false;
  }
};
