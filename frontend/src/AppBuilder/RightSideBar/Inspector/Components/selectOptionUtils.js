// Option rows are identified by value, so these keep values unique for newly entered options.

export const isValueTaken = (options = [], value, index) =>
  options.some((option, i) => i !== index && option?.value === value);

export const nextFreeOption = (options = []) => {
  let currentNumber = options.length + 1;
  // The value has to be free too, not just the label, or the new row collides on reorder.
  while (options.some((o) => o?.label === `option${currentNumber}` || o?.value === `${currentNumber}`)) {
    currentNumber += 1;
  }
  return { label: `option${currentNumber}`, value: `${currentNumber}` };
};

// Saved duplicates still exist, so a row needs an identity that survives them.
export const optionRowId = (option, index) => `${option?.value}-${index}`;

// Values are stored trimmed, so a padded copy is the same value and a blank one is no value at all.
export const validateOptionValue = (options = [], value, index) => {
  const trimmed = typeof value === 'string' ? value.trim() : value;
  if (trimmed === '' || trimmed === null || trimmed === undefined) return [false, 'Option value cannot be empty'];
  if (options.some((option, i) => i !== index && String(option?.value).trim() === String(trimmed))) {
    return [false, 'Option value must be unique. This value is already used by another option.'];
  }
  return [true, null];
};
