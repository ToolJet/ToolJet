import HttpClient from '@/_helpers/http-client';

const adapter = new HttpClient();

function getExtensions() {
  return adapter.get(`/extensions`);
}

export const extensionsService = {
  getExtensions,
};
