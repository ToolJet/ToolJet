import HttpClient from '@/_helpers/http-client';

const tooljetAdapter = new HttpClient();

function findOne(organizationId, selectedTable) {
  return tooljetAdapter.get(`/tooljet_db/${organizationId}/proxy/` + '${' + selectedTable + '}');
}

function findAll(organizationId) {
  return tooljetAdapter.post(`/tooljet_db/${organizationId}/perform`, { action: 'view_tables' });
}

function createTable(organizationId, tableName, columns) {
  return tooljetAdapter.post(`/tooljet_db/${organizationId}/perform`, {
    action: 'create_table',
    table_name: tableName,
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
