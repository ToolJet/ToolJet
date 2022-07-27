import HttpClient from '@/_helpers/http-client';

const adapter = new HttpClient();

function findAll() {
  return adapter.get(`/plugins`);
}

function installPlugin(body) {
  return adapter.post(`/plugins/install`, body);
}

export const pluginsService = {
  findAll,
  installPlugin,
};
