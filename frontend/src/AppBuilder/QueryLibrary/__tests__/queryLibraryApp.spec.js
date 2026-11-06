import '@/_services';
import { queryLibraryUrl, isQueryLibraryEnabled } from '../queryLibraryApp';
it('links to the standalone workspace library with the deployment subpath', () => {
  window.public_config = { SUB_PATH: '/tooljet/' };
  window.history.pushState({}, '', '/tooljet/ws1/apps/home');
  try {
    expect(queryLibraryUrl()).toBe('/tooljet/ws1/query-library');
  } finally {
    delete window.public_config;
    window.history.pushState({}, '', '/');
  }
});

it.each([undefined, {}, { queryLibraryEnabled: false }])('requires explicit effective access for %s', (access) => {
  expect(isQueryLibraryEnabled(access)).toBe(false);
});
