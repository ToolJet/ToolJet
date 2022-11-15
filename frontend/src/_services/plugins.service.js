import HttpClient from '@/_helpers/http-client';

const adapter = new HttpClient();

function findAll() {
  return adapter.get(`/plugins`);
}

function installPlugin(body) {
  return adapter.post(`/plugins/install`, body);
}

function updatePlugin(id) {
  return adapter.patch(`/plugins/${id}`);
}

function deletePlugin(id) {
  return adapter.delete(`/plugins/${id}`);
}

export const pluginsService = {
  findAll,
  installPlugin,
  updatePlugin,
  deletePlugin,
};
