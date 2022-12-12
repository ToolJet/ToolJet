'use strict';

const airtable = require('../lib');
const nock = require('nock');

describe('airtable', () => {
  const _airtable = new airtable.default();
  describe('airtable operations', () => {
    const sourceOptions = { api_key: '123456' };
    test('#list_records', async () => {
      nock(`https://api.airtable.com`)
        .get('/v0/1/consumer/')
        .query({ pageSize: '', offset: '' })
        .reply(200, { message: 'ok' });
      const queryOptions = { operation: 'list_records', base_id: 1, table_name: 'consumer' };
      const response = await _airtable.run(sourceOptions, queryOptions);
      expect(response.status).toEqual('ok');
    });

    test('#retrieve_record', async () => {
      nock(`https://api.airtable.com`).get('/v0/1/consumer/1').reply(200, { message: 'ok' });
      const queryOptions = { operation: 'retrieve_record', base_id: 1, table_name: 'consumer', record_id: 1 };
      const response = await _airtable.run(sourceOptions, queryOptions);
      expect(response.status).toEqual('ok');
    });

    test('#update_record', async () => {
      nock(`https://api.airtable.com`).intercept('/v0/1/consumer', 'patch').reply(200, { message: 'ok' });
      const queryOptions = { operation: 'update_record', base_id: 1, table_name: 'consumer', record_id: 1, body: '{}' };
      const response = await _airtable.run(sourceOptions, queryOptions);
      expect(response.status).toEqual('ok');
    });

    test('#delete_record', async () => {
      nock(`https://api.airtable.com`).intercept('/v0/1/consumer/1', 'delete').reply(200, { message: 'ok' });
      const queryOptions = { operation: 'delete_record', base_id: 1, table_name: 'consumer', record_id: 1 };
      const response = await _airtable.run(sourceOptions, queryOptions);
      expect(response.status).toEqual('ok');
    });
  });
});
