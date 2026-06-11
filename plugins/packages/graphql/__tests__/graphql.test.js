'use strict';

const graphql = require('../lib');

describe('graphql', () => {
  it('should query graphql datasources', async () => {
    const sourceOptions = {
      url: 'https://api.spacex.land/graphql/',
      headers: [],
      url_params: [],
    };

    const queryOptions = { query: '{ launchesPast(limit: 10) { mission_name } }' };

    const _graphql = new graphql.default();

    const result = await _graphql.run(sourceOptions, queryOptions, 'no-datasource-id');

    expect(result.data['data']['launchesPast'].length).toBe(10);
  });

  it('should merge headers query and source', async () => {
    const sourceOptions = {
      url: 'https://example.com/graphql',
      headers: [
        ['source-only-header', 'source value'],
        ['source-query-header', 'should be overriden'],
      ],
      url_params: [],
    }
    const queryOptions = {
      query: '{ greeting }',
      headers: [
        ['source-query-header', 'query takes precedence over source'],
        ['query-only-header', 'query value'],
      ],
    }

    const _graphql = new graphql.default();

    const spy = jest.spyOn(_graphql, 'sendRequest').mockImplementation(() => ({
      body: JSON.stringify({ data: { greeting: 'hello' }})
    }))

    const result = await _graphql.run(sourceOptions, queryOptions, 'no-datasource-id')

    expect(result.data).toEqual({ data: { greeting: 'hello' } });
    expect(spy).toHaveBeenCalledWith('https://example.com/graphql', {
      method: 'post',
      headers: {
        'source-only-header': 'source value',
        'source-query-header': 'query takes precedence over source',
        'query-only-header': 'query value',
      },
      searchParams: {},
      json: {
        query: '{ greeting }',
        variables: {},
      }
    });
  });
});
