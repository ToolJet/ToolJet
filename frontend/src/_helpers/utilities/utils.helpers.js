const rfdc = require('rfdc')({ proto: false, circles: false });
const { cloneDeepWith } = require('lodash');

export const deepClone = (obj) => {
  try {
    return rfdc(obj);
  } catch (error) {
    console.error('Error while cloning object', error);
    return obj;
  }
};

/**
 * Deep clones an object while preserving function references.
 * Functions are kept as references, everything else is deep cloned.
 */
export const deepCloneWithFunctions = (obj) => {
  return cloneDeepWith(obj, (value) => {
    if (typeof value === 'function') {
      return value; // Return function reference as-is
    }
    // Return undefined to let lodash handle default cloning
  });
};
