import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { DataQueriesModule } from '../../src/modules/data_queries/data_queries.module';
import { DataSourcesModule } from '../../src/modules/data_sources/data_sources.module';
import { DataQueriesService } from './data_queries.service';

describe('DataQueriesService', () => {
  let service: DataQueriesService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DataSourcesModule, DataQueriesModule, AppModule],
      providers: [],
    }).compile();

    service = module.get<DataQueriesService>(DataQueriesService);
  });

  it('should be able to parse query options without dynamic variables', async () => {
    const queryOptions = { 'foo': 'bar' };
    const options = { };

    const parsedOptions = await service.parseQueryOptions(queryOptions, options);

    expect(parsedOptions['foo']).toBe('bar');
  });

  it('should be able to parse query options with whole value as a dynamic variable', async () => {
    const queryOptions = { 'foo': '{{bar}}' };
    const options = { '{{bar}}': 'bar' };

    const parsedOptions = await service.parseQueryOptions(queryOptions, options);

    expect(parsedOptions['foo']).toBe('bar');
  });

  it('should be able to parse query options with one dynamic variable', async () => {
    const queryOptions = { 'foo': 'is a {{bar}}' };
    const options = { '{{bar}}': 'bar' };

    const parsedOptions = await service.parseQueryOptions(queryOptions, options);

    expect(parsedOptions['foo']).toBe('is a bar');
  });

  it('should be able to parse query options with whole value as a dynamic variable that contains js code', async () => {
    const queryOptions = { 'foo': '{{bar * 100 + parseInt("500")}}' };
    const options = { '{{bar * 100 + parseInt("500")}}': 20 };

    const parsedOptions = await service.parseQueryOptions(queryOptions, options);

    expect(parsedOptions['foo']).toBe(20);
  });

  it('should be able to parse query options with the value containing more than one dynamic variable', async () => {
    const queryOptions = { 'email': '{{sam}}@{{example.com}}' };
    const options = { 
      '{{sam}}': 'sam',
      '{{example.com}}': 'example.com' 
    };

    const parsedOptions = await service.parseQueryOptions(queryOptions, options);

    expect(parsedOptions['email']).toBe('sam@example.com');
  });

  it('should be able to parse query options that has an object', async () => {
    const queryOptions = { 
      user: {
        email: '{{email}}',
        name: '{{name}}'
      } 
    };
    const options = { 
      '{{email}}': 'sam@example.com',
      '{{name}}': 'sam'
    };

    const parsedOptions = await service.parseQueryOptions(queryOptions, options);

    expect(parsedOptions['user']['name']).toBe('sam');
    expect(parsedOptions['user']['email']).toBe('sam@example.com');
  });

  it('should be able to parse query options that has an array', async () => {
    const queryOptions = { 
      user: ['{{email}}', '{{name}}']
    };

    const options = { 
      '{{email}}': 'sam@example.com',
      '{{name}}': 'sam'
    };

    const parsedOptions = await service.parseQueryOptions(queryOptions, options);

    expect(parsedOptions['user']).toContain('sam');
    expect(parsedOptions['user']).toContain('sam@example.com');
  });

  it('should be able to parse query options that has an array of objects', async () => {
    const queryOptions = { 
      user: [ { email: '{{email}}' } , { name: '{{name}}' }]
    };

    const options = { 
      '{{email}}': 'sam@example.com',
      '{{name}}': 'sam'
    };

    const parsedOptions = await service.parseQueryOptions(queryOptions, options);

    expect(parsedOptions['user'][1]['name']).toBe('sam');
    expect(parsedOptions['user'][0]['email']).toBe('sam@example.com');
  });

});
