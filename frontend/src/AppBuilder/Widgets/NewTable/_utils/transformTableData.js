import { isArray } from 'lodash';

// The rows that aren't null/undefined, found once per data array: this re-runs whenever a column property's dependency
// changes, and scanning every row each time is 10-20 ms at 5M rows.
const rowsWithoutEmpty = new WeakMap();
const presentRows = (data) => {
  let rows = rowsWithoutEmpty.get(data);
  if (!rows) {
    rows = data.some((row) => row === null || row === undefined)
      ? data.filter((row) => row !== null && row !== undefined)
      : data;
    rowsWithoutEmpty.set(data, rows);
  }
  return rows;
};

export const transformTableData = (dataFromProps, transformations, getResolvedValue) => {
  const resolvedData = dataFromProps;
  if (!Array.isArray(resolvedData) && !isArray(resolvedData)) {
    return [];
  } else {
    const rows = presentRows(resolvedData);
    // Nothing to transform: the data itself, not a copy of every row. A new array on every call made the table
    // rebuild its whole row model each time this re-ran, which is whenever any column property's dependency changes.
    if (!transformations?.length) return rows;
    return rows.map((row) => {
      const transformedObject = {};

      transformations.forEach(({ key, transformation }) => {
        const nestedKeys = key.includes('.') && key.split('.');
        if (nestedKeys) {
          // Single-level nested property
          const [nestedKey, subKey] = nestedKeys;
          const nestedObject = transformedObject?.[nestedKey] || { ...row[nestedKey] }; // Retain existing nested object
          const newValue =
            getResolvedValue(transformation, {
              cellValue: row?.[nestedKey]?.[subKey],
              rowData: row,
            }) ?? row[key];

          // Apply transformation to subKey
          nestedObject[subKey] = newValue;

          // Update transformedObject with the new nested object
          transformedObject[nestedKey] = nestedObject;
        } else {
          // Non-nested property
          transformedObject[key] =
            getResolvedValue(transformation, {
              cellValue: row[key],
              rowData: row,
            }) ?? row[key];
        }
      });
      return {
        ...row,
        ...transformedObject,
      };
    });
  }
};
