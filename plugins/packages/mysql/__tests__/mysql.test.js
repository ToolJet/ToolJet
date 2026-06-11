'use strict';

const mysql = require('../lib');

describe('mysql', () => {
  it('should generate the query for bulk update operation', async () => {
    const queryOptions = {
      table: 'customers',
      primary_key_column: 'id',
      records: [
        {
          id: 1,
          name: 'sam',
          email: 'sam@example.com',
        },
        {
          id: 2,
          name: 'jon',
          email: 'jon@example.com',
        },
      ],
    };

    const _mysql = new mysql.default();

    const builtQuery = await _mysql.buildBulkUpdateQuery(queryOptions);
    const expectedQuery =
      "UPDATE customers SET name = 'sam', email = 'sam@example.com' WHERE id = 1; UPDATE customers SET name = 'jon', email = 'jon@example.com' WHERE id = 2;";

    expect(builtQuery).toBe(expectedQuery);
  });
});
