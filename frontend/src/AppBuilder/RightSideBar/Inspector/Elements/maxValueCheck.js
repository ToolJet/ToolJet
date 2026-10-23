/** The check for a config's declared range on a number field (`minValue`, `maxValue`): a plain number outside it is
 *  flagged, saying what the widget takes instead. Undefined when the field declares none (the panel's own check, or
 *  the schema's, applies). Bindings are not checked: their value is only known in the app. */
export const limitCheck = ({ minValue, maxValue } = {}) => {
  const min = typeof minValue === 'number' ? minValue : undefined;
  const max = typeof maxValue === 'number' ? maxValue : undefined;
  if (min === undefined && max === undefined) return undefined;
  const range =
    min !== undefined && max !== undefined
      ? `${min} to ${max}`
      : min !== undefined
      ? `At least ${min}`
      : `At most ${max}`;
  return (value) => {
    const n = Number(value);
    if (!Number.isFinite(n) || String(value).trim() === '') return [true, null];
    if (max !== undefined && n > max) return [false, `${range}; a larger number is taken as ${max}.`];
    if (min !== undefined && n < min) return [false, `${range}; a smaller number is taken as ${min}.`];
    return [true, null];
  };
};

/** The check for a config's `maxValue` alone (kept for callers that pass only the maximum). */
export const maxValueCheck = (max) => limitCheck({ maxValue: max });
