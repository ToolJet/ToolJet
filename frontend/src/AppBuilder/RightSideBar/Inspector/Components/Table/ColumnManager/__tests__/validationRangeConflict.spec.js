import { hasMinMaxConflict, VALIDATION_RANGE_TYPES } from '../validationRangeConflict';

describe('[Table-BUG-026] hasMinMaxConflict', () => {
  // Break this catches: Min length/value/date/time silently accepted as larger than Max,
  // leaving the column impossible to ever satisfy with no warning to the app builder.
  it('flags Min strictly greater than Max for length and value pairs', () => {
    expect(hasMinMaxConflict(VALIDATION_RANGE_TYPES.LENGTH, 5, 3)).toBe(true);
    expect(hasMinMaxConflict(VALIDATION_RANGE_TYPES.VALUE, 10, 1)).toBe(true);
  });

  it('does not flag Min less than or equal to Max for length and value pairs', () => {
    expect(hasMinMaxConflict(VALIDATION_RANGE_TYPES.LENGTH, 3, 5)).toBe(false);
    expect(hasMinMaxConflict(VALIDATION_RANGE_TYPES.LENGTH, 5, 5)).toBe(false);
    expect(hasMinMaxConflict(VALIDATION_RANGE_TYPES.VALUE, -5, 10)).toBe(false);
    expect(hasMinMaxConflict(VALIDATION_RANGE_TYPES.VALUE, 10, 10)).toBe(false);
  });

  it('flags Minimum date after Maximum date, but not an equal or correctly ordered pair', () => {
    expect(hasMinMaxConflict(VALIDATION_RANGE_TYPES.DATE, '02/01/2024', '01/01/2024')).toBe(true);
    expect(hasMinMaxConflict(VALIDATION_RANGE_TYPES.DATE, '01/01/2024', '02/01/2024')).toBe(false);
    expect(hasMinMaxConflict(VALIDATION_RANGE_TYPES.DATE, '01/01/2024', '01/01/2024')).toBe(false);
  });

  it('flags Minimum time after Maximum time, but not an equal or correctly ordered pair', () => {
    expect(hasMinMaxConflict(VALIDATION_RANGE_TYPES.TIME, '14:00', '09:00')).toBe(true);
    expect(hasMinMaxConflict(VALIDATION_RANGE_TYPES.TIME, '09:00', '14:00')).toBe(false);
    expect(hasMinMaxConflict(VALIDATION_RANGE_TYPES.TIME, '09:00', '09:00')).toBe(false);
  });

  it('skips the check when either side is blank, non-numeric/non-parseable, or an fx binding', () => {
    expect(hasMinMaxConflict(VALIDATION_RANGE_TYPES.LENGTH, undefined, 3)).toBe(false);
    expect(hasMinMaxConflict(VALIDATION_RANGE_TYPES.LENGTH, '', 3)).toBe(false);
    expect(hasMinMaxConflict(VALIDATION_RANGE_TYPES.LENGTH, 'abc', 3)).toBe(false);
    expect(hasMinMaxConflict(VALIDATION_RANGE_TYPES.LENGTH, '{{1+10}}', 3)).toBe(false);
    expect(hasMinMaxConflict(VALIDATION_RANGE_TYPES.VALUE, 10, '{{queries.q1.data}}')).toBe(false);
    expect(hasMinMaxConflict(VALIDATION_RANGE_TYPES.DATE, 'not-a-date', '01/01/2024')).toBe(false);
  });

  it('returns false for an unrecognized range type', () => {
    expect(hasMinMaxConflict('unknown', 5, 3)).toBe(false);
  });
});
