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
