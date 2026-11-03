// The options of a select, multiselect or tags column without dynamic options. Builders wrote them as a binding
// ("{{[...]}}") as often as a list, and a string reached options.map and took the whole table down; a binding is
// resolved, and anything that is still not a list gives no options.
export const columnOptionList = (raw, resolve) => {
  const options = typeof raw === 'string' ? resolve(raw) : raw;
  if (!Array.isArray(options)) return [];
  return options
    .filter((option) => option && typeof option === 'object')
    .map((option) => ({
      label: option.label,
      value: option.value,
      optionColor: option.optionColor,
      labelColor: option.labelColor,
    }));
};
