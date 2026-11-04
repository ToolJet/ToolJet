/**
 * The table's column filters after a chip's value changes. `chip` is a quick filter from `getQuickFilters`
 * (`appliedIndex` is where its applied filter sits, -1 if none). For a chip with a value box `value` is the text
 * (empty takes the filter off); for one without (is empty / is not empty) it is whether the filter is applied.
 * The given list is not changed.
 */
export const applyChipValue = (columnFilters, chip, value) => {
  const isApplied = chip.appliedIndex >= 0;
  const remove = () => columnFilters.filter((_, index) => index !== chip.appliedIndex);

  if (!chip.needsValue) {
    if (value === isApplied) return columnFilters;
    return value
      ? [...columnFilters, { id: chip.columnId, value: { column: chip.column, condition: chip.condition, value: '' } }]
      : remove();
  }

  if (value === '') return isApplied ? remove() : columnFilters;
  if (isApplied) {
    return columnFilters.map((filter, index) =>
      index === chip.appliedIndex ? { ...filter, value: { ...filter.value, value } } : filter
    );
  }
  return [...columnFilters, { id: chip.columnId, value: { column: chip.column, condition: chip.condition, value } }];
};
