import rfdc from 'rfdc';
const clone = rfdc({ proto: false, circles: false });

export const deepClone = (obj) => {
  try {
    return clone(obj);
  } catch (error) {
    console.error('Error while cloning object', error);
    return obj;
  }
};
