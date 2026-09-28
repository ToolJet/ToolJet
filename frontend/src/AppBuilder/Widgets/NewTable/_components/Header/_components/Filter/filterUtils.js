// eslint-disable-next-line import/no-unresolved
import { diff as deepDiff } from 'deep-object-diff';

// Values a cell may be matched against: its raw stored value, plus any display value(s) from the
// column's `getFilterDisplayValues` resolver (set by generateColumnsData.js). `rawValueOverride`
// lets a caller substitute the raw value (e.g. useTable.js's edited-cell overlay).
export const getComparableValues = (row, columnId, rawValueOverride) => {
  const rawValue = rawValueOverride !== undefined ? rawValueOverride : row.getValue(columnId);
  const resolver = row.getAllCells().find((cell) => cell.column.id === columnId)?.column.columnDef
    .meta?.getFilterDisplayValues;
  return resolver ? resolver(rawValue) : [rawValue];
};

// Case-insensitive substring match against any of a cell's comparable values.
export const matchesAnyValue = (values, target) => {
  const needle = String(target || '').toLowerCase();
  return values.some((value) =>
    String(value || '')
      .toLowerCase()
      .includes(needle)
  );
};

export const filterFunctions = {
  contains: (row, columnId, filterValue) => matchesAnyValue(getComparableValues(row, columnId), filterValue.value),
  doesNotContains: (row, columnId, filterValue) =>
    !matchesAnyValue(getComparableValues(row, columnId), filterValue.value),
  matches: (row, columnId, filterValue) => {
    try {
      const regex = new RegExp(filterValue.value);
      return getComparableValues(row, columnId).some((value) => regex.test(String(value || '')));
    } catch (e) {
      return false;
    }
  },
  nl: (row, columnId, filterValue) => {
    try {
      const regex = new RegExp(filterValue.value);
      return !getComparableValues(row, columnId).some((value) => regex.test(String(value || '')));
    } catch (e) {
      return false;
    }
  },
  equals: (row, columnId, filterValue) => {
    const target = String(filterValue.value || '');
    return getComparableValues(row, columnId).some((value) => String(value || '') === target);
  },
  ne: (row, columnId, filterValue) => {
    const target = String(filterValue.value || '');
    return !getComparableValues(row, columnId).some((value) => String(value || '') === target);
  },
  isEmpty: (row, columnId) => {
    const value = row.getValue(columnId);
    if (value === null || value === undefined || value === '') return true;
    if (Array.isArray(value) || typeof value === 'string') return value.length === 0;
    return false;
  },
  isNotEmpty: (row, columnId) => {
    const value = row.getValue(columnId);
    if (value === null || value === undefined || value === '') return false;
    if (Array.isArray(value) || typeof value === 'string') return value.length > 0;
    return true;
  },
  gt: (row, columnId, filterValue) => {
    const value = row.getValue(columnId);
    return value > filterValue.value;
  },
  lt: (row, columnId, filterValue) => {
    const value = row.getValue(columnId);
    return value < filterValue.value;
  },
  gte: (row, columnId, filterValue) => {
    const value = row.getValue(columnId);
    return value >= filterValue.value;
  },
  lte: (row, columnId, filterValue) => {
    const value = row.getValue(columnId);
    return value <= filterValue.value;
  },
};

export const findFilterDiff = (oldFilters, newFilters) => {
  const filterDiff = deepDiff(oldFilters, newFilters);

  const getType = (obj) => {
    if (!obj?.column && !obj?.condition) return 'value';
    if (obj?.column) return 'column';
    if (obj?.condition) return 'condition';
  };

  const diff = Object.entries(filterDiff).reduce((acc, [key, value]) => {
    const type = getType(value?.value);
    return { ...acc, keyIndex: key, type: type, diff: value?.value?.[type] };
  }, {});

  return shouldFireEvent(diff, newFilters);
};

const shouldFireEvent = (diff, filter) => {
  if (!diff || !filter) return false;

  const forEmptyOperationAndNotEmptyOperation = (condition) => {
    if (condition !== 'isEmpty' || condition !== 'isNotEmpty') {
      return filter[diff.keyIndex]?.value?.column ? true : false;
    }
    return filter[diff.keyIndex]?.value?.value && filter[diff.keyIndex]?.value?.column ? true : false;
  };

  switch (diff.type) {
    case 'value':
      return filter[diff.keyIndex]?.value?.column && filter[diff.keyIndex]?.value?.condition ? true : false;
    case 'column':
      return filter[diff.keyIndex]?.value?.value && filter[diff.keyIndex]?.value?.condition ? true : false;
    case 'condition':
      return forEmptyOperationAndNotEmptyOperation(filter[diff.keyIndex]?.value?.condition);
    default:
      return false;
  }
};

export const applyFilters = (row, columnId, columnFilters) =>
  columnFilters.every((filter) => {
    const { value, condition } = filter.value;
    const filterFn = filterFunctions[condition];
    const result = filterFn(row, columnId, { value });
    return result;
  });
