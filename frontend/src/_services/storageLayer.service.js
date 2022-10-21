import HttpClient from '@/_helpers/http-client';
import config from 'config';

const adapter = new HttpClient({ host: config.apiUrl + `/tooljet_db/proxy` });

function findOne(selectedTable) {
  return adapter.get(`/${selectedTable}`);
}

export const storageLayerService = {
  findOne,
};
