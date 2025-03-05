// eslint-disable-next-line import/no-unresolved
import { diff as deepDiff } from 'deep-object-diff';

export const filterFunctions = {
  contains: (row, columnId, filterValue) => {
    const value = String(row.getValue(columnId) || '').toLowerCase();
    return value.includes(String(filterValue.value || '').toLowerCase());
  },
  doesNotContains: (row, columnId, filterValue) => {
    const value = String(row.getValue(columnId) || '').toLowerCase();
    return !value.includes(String(filterValue.value || '').toLowerCase());
  },
  matches: (row, columnId, filterValue) => {
    const value = String(row.getValue(columnId) || '');
    try {
      const regex = new RegExp(filterValue.value);
      return regex.test(value);
    } catch (e) {
      return false;
    }
  },
  nl: (row, columnId, filterValue) => {
    const value = String(row.getValue(columnId) || '');
    try {
      const regex = new RegExp(filterValue.value);
      return !regex.test(value);
    } catch (e) {
      return false;
    }
  },
  equals: (row, columnId, filterValue) => {
    const value = String(row.getValue(columnId) || '').toLowerCase();
    return value === String(filterValue.value || '').toLowerCase();
  },
  ne: (row, columnId, filterValue) => {
    const value = String(row.getValue(columnId) || '').toLowerCase();
    return value !== String(filterValue.value || '').toLowerCase();
  },
  isEmpty: (row, columnId) => {
    const value = row.getValue(columnId);
    return !value || value.length === 0;
  },
  isNotEmpty: (row, columnId) => {
    const value = row.getValue(columnId);
    return value && value.length > 0;
  },
  gt: (row, columnId, filterValue) => {
    const value = row.getValue(columnId);
    return Number(value) > Number(filterValue.value);
  },
  lt: (row, columnId, filterValue) => {
    const value = row.getValue(columnId);
    return Number(value) < Number(filterValue.value);
  },
  gte: (row, columnId, filterValue) => {
    const value = row.getValue(columnId);
    return Number(value) >= Number(filterValue.value);
  },
  lte: (row, columnId, filterValue) => {
    const value = row.getValue(columnId);
    return Number(value) <= Number(filterValue.value);
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
