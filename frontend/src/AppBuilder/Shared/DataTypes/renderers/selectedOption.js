// The option(s) a select cell shows for its value. A missing or empty value shows the option that stands for empty
// ("Unassigned", value null or ''), when there is one: an unassigned job's technician cell drew an empty pill because
// undefined never equalled the option's null. 0 is a value like any other (it used to read as empty).
const isEmpty = (v) => v === undefined || v === null || v === '';

export const selectedOption = (options, value, isMulti) => {
  const list = Array.isArray(options) ? options : [];
  if (isMulti) {
    if (!Array.isArray(value) || !value.length) return null;
    return list.filter((option) =>
      value.some((v) => (v && typeof v === 'object' && 'value' in v ? option.value === v.value : option.value === v))
    );
  }
  if (isEmpty(value)) return list.find((option) => isEmpty(option?.value)) ?? null;
  return list.find((option) => option?.value === value) || [];
};
