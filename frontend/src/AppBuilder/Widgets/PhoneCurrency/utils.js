// eslint-disable-next-line import/no-unresolved
import { getCountryCallingCode } from 'react-phone-number-input/input';

export const getCountryCallingCodeSafe = (country) => {
  try {
    return getCountryCallingCode(country);
  } catch (error) {
    return '';
  }
};
