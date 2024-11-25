import { isString } from 'lodash';
import { getSubpath } from '@/_helpers/routes';

const processErrorMessage = (error) => {
  if (isString(error)) {
    return error;
  }
  return error?.error || 'Something went wrong. Please try again.';
};

function clearPageHistory() {
  const subpath = getSubpath() || '';
  history.replaceState(null, null, `${subpath}/`);
}

export { processErrorMessage, clearPageHistory };
