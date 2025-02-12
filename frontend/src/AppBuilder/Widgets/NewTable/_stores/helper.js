export const removeNullValues = (arr = []) => arr.filter((element) => element !== null);

// utilityForNestedNewRow function is used to construct nested object while adding or updating new row when '.' is present in column key for adding new row
export const utilityForNestedNewRow = (row) => {
  let obj = {};

  Object.keys(row).forEach((key) => {
    let nestedKeys = key.split('.');
    let tempObj = obj;

    nestedKeys.forEach((nestedKey, i) => {
      if (!tempObj[nestedKey]) {
        tempObj[nestedKey] = i === nestedKeys.length - 1 ? row[key] : {};
      }
      tempObj = tempObj[nestedKey];
    });
  });

  return obj;
};
