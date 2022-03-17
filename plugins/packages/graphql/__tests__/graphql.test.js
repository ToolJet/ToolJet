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
});
