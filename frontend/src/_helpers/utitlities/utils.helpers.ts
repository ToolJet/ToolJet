const rfdc = require('rfdc')({ proto: false, circles: false });

export const deepClone = (obj: Record<string, unknown>) => {
  try {
    return rfdc(obj);
  } catch (error) {
    console.error('Error while cloning object', error);
    return obj;
  }
};
