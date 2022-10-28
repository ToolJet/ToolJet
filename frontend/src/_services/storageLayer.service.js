import HttpClient from '@/_helpers/http-client';
import config from 'config';

const tooljetAdapter = new HttpClient();
const postgrestAdapter = new HttpClient({ host: config.apiUrl + `/tooljet_db/proxy` });

function findOne(selectedTable) {
  return postgrestAdapter.get(`/${selectedTable}`);
}

function findAll() {
  return tooljetAdapter.post(`/tooljet_db/perform`, { action: 'view_tables' });
}

function createTable() {
  return tooljetAdapter.post(`/tooljet_db/perform`, {
    action: 'create_table',
    table_name: 'test123',
    columns: [
      {
        column_name: 'name',
        data_type: 'varchar',
      },
      {
        column_name: 'kind',
        data_type: 'varchar',
      },
    ],
  });
}

export const storageLayerService = {
  findOne,
  findAll,
  createTable,
};
