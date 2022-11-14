import HttpClient from '@/_helpers/http-client';
import config from 'config';

const tooljetAdapter = new HttpClient();
const postgrestAdapter = new HttpClient({ host: config.apiUrl + `/tooljet_db/proxy` });

function findOne(selectedTable) {
  return postgrestAdapter.get('${' + selectedTable + '}');
}

function findAll() {
  return tooljetAdapter.post(`/tooljet_db/perform`, { action: 'view_tables' });
}

function createTable(tableName, columns) {
  return tooljetAdapter.post(`/tooljet_db/perform`, {
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

function deleteTable(tableName) {
  return tooljetAdapter.delete(`/tooljet_db/perform`, {
    action: 'delete_table',
    table_name: tableName,
  });
}

function addColumn(tableName, columnName, dataType) {
  return tooljetAdapter.post(`/tooljet_db/perform`, {
    action: 'add_column',
    table_name: tableName,
    column: {
      column_name: columnName,
      data_type: dataType,
    },
  });
}

export const tooljetDatabaseService = {
  findOne,
  findAll,
  createTable,
  deleteTable,
  addColumn,
};
