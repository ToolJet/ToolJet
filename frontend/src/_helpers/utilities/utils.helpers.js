const rfdc = require('rfdc')({ proto: false, circles: false });

export const deepClone = (obj) => {
  try {
    return rfdc(obj);
  } catch (error) {
    console.error('Error while cloning object', error);
    return obj;
  }
};
