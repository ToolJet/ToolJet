import moment from 'moment';

export const getDate = (date, format) => {
  const dateMomentInstance = date && moment(date, format);
  if (dateMomentInstance && dateMomentInstance.isValid()) {
    return dateMomentInstance.toDate();
  } else {
    return null;
  }
};
