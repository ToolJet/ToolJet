import { Test, TestingModule } from '@nestjs/testing';
import GraphqlQueryService from '.';

describe('GraphqlQueryService', () => {
  let service: GraphqlQueryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GraphqlQueryService],
    }).compile();

    service = module.get<GraphqlQueryService>(GraphqlQueryService);
  });

  it('should query graphql datasources', async () => {
    const sourceOptions = {
      url: 'https://api.spacex.land/graphql/',
      headers: [],
      url_params: [],
    };

    const queryOptions = { query: '{ launchesPast(limit: 10) { mission_name } }' };

    const result = await service.run(sourceOptions, queryOptions, 'no-datasource-id');

    expect(result.data['data']['launchesPast'].length).toBe(10);
  });
});
