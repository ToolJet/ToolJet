import HttpClient from '@/_helpers/http-client';

const adapter = new HttpClient();

function findAll() {
  return adapter.get(`/plugins`);
}

function installPlugin(body) {
  return adapter.post(`/plugins/install`, body);
}

function updatePlugin(body) {
  return adapter.patch(`/plugins/${body.id}`, body);
}

function deletePlugin(id) {
  return adapter.delete(`/plugins/${id}`);
}

function reloadPlugin(id) {
  return adapter.post(`/plugins/${id}/reload`);
}

export const pluginsService = {
  findAll,
  installPlugin,
  updatePlugin,
  deletePlugin,
  reloadPlugin,
};
