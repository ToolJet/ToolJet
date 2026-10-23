/** The check for a config's `maxValue` on a number field: a plain number past it is flagged, saying what the widget
 *  takes instead. Undefined when the field has none (the panel's own check, or the schema's, applies). */
export const maxValueCheck = (max) =>
  typeof max === 'number'
    ? (value) => {
        const n = Number(value);
        return Number.isFinite(n) && n > max
          ? [false, `At most ${max}; a larger number is taken as ${max}.`]
          : [true, null];
      }
    : undefined;
