import '@/_services';
import { queryLibraryUrl } from '../queryLibraryApp';
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
