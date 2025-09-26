import { isArray } from 'lodash';

export const transformTableData = (dataFromProps, transformations, getResolvedValue) => {
  const resolvedData = dataFromProps;
  if (!Array.isArray(resolvedData) && !isArray(resolvedData)) {
    return [];
  } else {
    return resolvedData
      .filter((data) => data !== null && data !== undefined)
      .map((row) => {
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
