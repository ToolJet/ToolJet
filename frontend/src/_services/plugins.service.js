import HttpClient from '@/_helpers/http-client';

const adapter = new HttpClient();

function findAll() {
  return adapter.get(`/plugins`);
}

export const pluginsService = {
  findAll,
};
