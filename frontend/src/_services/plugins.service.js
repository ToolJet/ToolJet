import HttpClient from '@/_helpers/http-client';

const adapter = new HttpClient();

function getPlugins() {
  return adapter.get(`/plugins`);
}

export const pluginsService = {
  getPlugins,
};
