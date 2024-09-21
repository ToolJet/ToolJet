import { isString } from 'lodash';

const processErrorMessage = (error) => {
  if (isString(error)) {
    return error;
  }
  return error?.error || 'Something went wrong. Please try again.';
};

function clearPageHistory() {
  history.replaceState(null, null, '/');
}

export { processErrorMessage, clearPageHistory };
