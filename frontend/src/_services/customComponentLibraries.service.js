import config from 'config';
import { authHeader, handleResponse } from '@/_helpers';

export const customComponentLibrariesService = {
  list,
};

// B9: libraries + revisions (newest first) + latest manifest + dev bundles.
// Session-guarded — the builder user browses with their cookie, not a CLI token.
function list() {
  const requestOptions = { method: 'GET', headers: authHeader(), credentials: 'include' };
  return fetch(`${config.apiUrl}/custom-component-libraries`, requestOptions).then(handleResponse);
}
