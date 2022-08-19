import HttpClient from '@/_helpers/http-client';
import config from 'config';

const adapter = new HttpClient({ host: config.apiUrl.replace('/api', '') });

function findAll() {
  return adapter.get(`/assets/marketplace/plugins.json`);
}

export const marketplaceService = {
  findAll,
};
