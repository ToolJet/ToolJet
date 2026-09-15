import { createHash } from 'crypto';
import * as yaml from 'js-yaml';
import { OpenApiSpecSourceType, OpenApiSpecStatus } from '../../../../src/modules/openapi-spec/constants';
import { DATA_SOURCE_ID, definitionJob, loadProcessor, makeManager, makeProcessor } from './processor-harness';

jest.mock('got', () => ({ __esModule: true, default: jest.fn() }));

let got: jest.Mock;
beforeAll(async () => {
  await loadProcessor();
  got = (await import('got')).default as unknown as jest.Mock;
});

const rowsFor = (saved: Record<string, any>[], environmentId: string) =>
  saved.filter((row) => row.environmentId === environmentId);

const byOperationId = (rows: Record<string, any>[], operationId: string) =>
  rows.find((row) => row.operationId === operationId);

const ok = { 200: { description: 'ok' } };

function petStoreOpenApi3(): Record<string, any> {
  return {
    openapi: '3.0.0',
    info: { title: 'Pets', version: '1.0.0' },
    servers: [{ url: 'https://api.example.com/v1' }],
    tags: [{ name: 'pets' }],
    security: [{ apiKey: [] }],
    components: {
      securitySchemes: {
        apiKey: { type: 'apiKey', in: 'header', name: 'X-Api-Key' },
        oauth: { type: 'oauth2', flows: {} },
      },
      parameters: {
        PetId: { name: 'petId', in: 'path', required: true, schema: { type: 'string' } },
      },
      schemas: {
        Pet: { type: 'object', properties: { name: { type: 'string' } } },
      },
    },
    paths: {
      '/pets': {
        parameters: [
          { name: 'offset', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        get: {
          operationId: 'listPets',
          summary: 'List pets',
          tags: ['pets'],
          parameters: [{ name: 'limit', in: 'query', required: true, schema: { type: 'string' } }],
          responses: ok,
        },
        post: {
          security: [{ oauth: ['write'], apiKey: [] }],
          requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Pet' } } } },
          responses: ok,
        },
      },
      '/pets/{petId}': {
        parameters: [{ $ref: '#/components/parameters/PetId' }],
        get: { operationId: 'getPet', responses: ok },
        delete: { operationId: 'deletePet', security: [], deprecated: true, responses: ok },
      },
    },
  };
}

function petStoreSwagger2(): Record<string, any> {
  return {
    swagger: '2.0',
    info: { title: 'Pets', version: '1.0.0' },
    host: 'api.example.com',
    basePath: '/v1',
    schemes: ['https'],
    definitions: {
      Pet: { type: 'object', properties: { name: { type: 'string' } } },
    },
    paths: {
      '/pets': {
        post: {
          operationId: 'createPet',
          parameters: [{ name: 'body', in: 'body', required: true, schema: { $ref: '#/definitions/Pet' } }],
          responses: ok,
        },
      },
    },
  };
}

// 60 operations: more than one batch at the default batch size of 50.
function manyOperationsOpenApi3(count = 60): Record<string, any> {
  const paths: Record<string, any> = {};
  for (let i = 0; i < count; i++) {
    paths[`/items/${i}`] = { get: { operationId: `getItem${i}`, responses: ok } };
  }
  return { openapi: '3.0.0', info: { title: 'Many', version: '1.0.0' }, paths };
}

/** @group marketplace */
describe('OpenApiSpecProcessor', () => {
  let harness: ReturnType<typeof makeManager>;

  beforeEach(() => {
    harness = makeManager();
    got.mockReset();
  });

  describe('parsing', () => {
    it('should extract the same operations from a JSON and a YAML definition', async () => {
      const spec = petStoreOpenApi3();

      await makeProcessor().processor.process(definitionJob(JSON.stringify(spec)));
      const fromJson = harness.saved;

      harness = makeManager();
      await makeProcessor().processor.process(definitionJob(yaml.dump(spec)));

      expect(fromJson).toHaveLength(4);
      expect(harness.saved).toEqual(fromJson);
    });
  });

  describe('operation extraction', () => {
    it('should write one row per path and method, falling back to method_path when operationId is missing', async () => {
      await makeProcessor().processor.process(definitionJob(JSON.stringify(petStoreOpenApi3())));

      expect(harness.saved.map(({ operationId, method, path }) => ({ operationId, method, path }))).toEqual([
        { operationId: 'listPets', method: 'get', path: '/pets' },
        { operationId: 'post_/pets', method: 'post', path: '/pets' },
        { operationId: 'getPet', method: 'get', path: '/pets/{petId}' },
        { operationId: 'deletePet', method: 'delete', path: '/pets/{petId}' },
      ]);
      expect(byOperationId(harness.saved, 'listPets')).toMatchObject({
        dataSourceId: DATA_SOURCE_ID,
        environmentId: 'env-1',
        serviceId: 'default',
        name: 'List pets',
        tags: ['pets'],
        deprecated: false,
        hasRequestBody: false,
        requestBodySchema: null,
      });
      expect(byOperationId(harness.saved, 'deletePet')).toMatchObject({ name: 'deletePet', deprecated: true });
    });

    it('should merge path-item parameters under operation parameters, the operation winning on the same name and location', async () => {
      await makeProcessor().processor.process(definitionJob(JSON.stringify(petStoreOpenApi3())));

      expect(byOperationId(harness.saved, 'listPets').parameters).toMatchObject([
        { name: 'offset', in: 'query', required: false, schema: { type: 'integer' } },
        { name: 'limit', in: 'query', required: true, schema: { type: 'string' } },
      ]);
      expect(byOperationId(harness.saved, 'getPet').parameters).toMatchObject([
        { name: 'petId', in: 'path', required: true, schema: { type: 'string' } },
      ]);
    });

    it('should resolve an OpenAPI 3 requestBody $ref into requestBodySchema', async () => {
      await makeProcessor().processor.process(definitionJob(JSON.stringify(petStoreOpenApi3())));

      expect(byOperationId(harness.saved, 'post_/pets')).toMatchObject({
        hasRequestBody: true,
        requestBodySchema: { type: 'object', properties: { name: { type: 'string' } } },
      });
    });

    it('should turn a Swagger 2.0 body parameter into requestBodySchema', async () => {
      await makeProcessor().processor.process(definitionJob(JSON.stringify(petStoreSwagger2())));

      expect(harness.saved).toMatchObject([
        {
          operationId: 'createPet',
          hasRequestBody: true,
          requestBodySchema: { type: 'object', properties: { name: { type: 'string' } } },
        },
      ]);
    });

    it('should flatten security to scheme names, operation-level requirements overriding the spec-level ones', async () => {
      await makeProcessor().processor.process(definitionJob(JSON.stringify(petStoreOpenApi3())));

      expect(harness.saved.map(({ operationId, security }) => ({ operationId, security }))).toEqual([
        { operationId: 'listPets', security: ['apiKey'] },
        { operationId: 'post_/pets', security: ['oauth', 'apiKey'] },
        { operationId: 'getPet', security: ['apiKey'] },
        { operationId: 'deletePet', security: [] },
      ]);
    });
  });

  describe('persistence', () => {
    it('should save the batch once per environment and mark each environment ready with version, checksum and metadata', async () => {
      const definition = JSON.stringify(petStoreOpenApi3());

      await makeProcessor().processor.process(definitionJob(definition, ['env-1', 'env-2']));

      expect(harness.manager.save).toHaveBeenCalledTimes(2);
      expect(rowsFor(harness.saved, 'env-1')).toHaveLength(4);
      expect(rowsFor(harness.saved, 'env-2')).toHaveLength(4);

      const expectedOptions = {
        spec_status: { value: OpenApiSpecStatus.READY, encrypted: false },
        spec_error: { value: null, encrypted: false },
        spec_version: { value: '3.0', encrypted: false },
        spec_checksum: { value: createHash('sha256').update(definition).digest('hex'), encrypted: false },
        spec_metadata: {
          value: {
            servers: ['https://api.example.com/v1'],
            tags: ['pets'],
            securitySchemes: { apiKey: { type: 'apiKey' }, oauth: { type: 'oauth2' } },
            security: [{ apiKey: [] }],
          },
          encrypted: false,
        },
      };
      expect(harness.updates).toMatchObject([
        { where: { dataSourceId: DATA_SOURCE_ID, environmentId: 'env-1' }, options: expectedOptions },
        { where: { dataSourceId: DATA_SOURCE_ID, environmentId: 'env-2' }, options: expectedOptions },
      ]);
    });

    it('should write status ready only after every batch is saved', async () => {
      await makeProcessor().processor.process(definitionJob(JSON.stringify(manyOperationsOpenApi3())));

      const saveOrder = harness.manager.save.mock.invocationCallOrder;
      const [readyUpdateOrder] = harness.manager.update.mock.invocationCallOrder;
      expect(saveOrder).toHaveLength(2);
      expect(harness.saved).toHaveLength(60);
      expect(harness.updates).toMatchObject([{ options: { spec_status: { value: OpenApiSpecStatus.READY } } }]);
      expect(Math.max(...saveOrder)).toBeLessThan(readyUpdateOrder);
    });
  });

  describe('termination and failure', () => {
    it('should mark the spec cancelled when termination is requested between batches', async () => {
      const { processor, terminationRegistry } = makeProcessor();
      terminationRegistry.isTerminated.mockImplementation(async () => harness.saved.length > 0);

      await expect(processor.process(definitionJob(JSON.stringify(manyOperationsOpenApi3())))).resolves.toBeUndefined();

      expect(harness.saved).toHaveLength(50);
      expect(harness.updates).toMatchObject([{ options: { spec_status: { value: OpenApiSpecStatus.CANCELLED } } }]);
      expect(harness.updates).toHaveLength(1);
      expect(terminationRegistry.clear).toHaveBeenCalledWith(DATA_SOURCE_ID, 'env-1');
    });

    it('should mark the spec cancelled without throwing when termination was requested', async () => {
      const { processor, terminationRegistry } = makeProcessor({ terminated: true });

      await expect(processor.process(definitionJob(JSON.stringify(petStoreOpenApi3())))).resolves.toBeUndefined();

      expect(harness.saved).toEqual([]);
      expect(harness.updates).toMatchObject([{ options: { spec_status: { value: OpenApiSpecStatus.CANCELLED } } }]);
      expect(terminationRegistry.clear).toHaveBeenCalledWith(DATA_SOURCE_ID, 'env-1');
    });

    it('should mark the spec failed with the error message and rethrow when the definition cannot be parsed', async () => {
      const error = await makeProcessor()
        .processor.process(definitionJob('{ not: [valid'))
        .catch((e) => e);

      expect(error).toBeInstanceOf(Error);
      expect(harness.updates).toMatchObject([
        { options: { spec_status: { value: OpenApiSpecStatus.FAILED }, spec_error: { value: error.message } } },
      ]);
    });

    it('should mark the spec failed with the error message and rethrow when fetching the URL fails', async () => {
      got.mockRejectedValue(new Error('getaddrinfo ENOTFOUND specs.example.com'));
      const job = definitionJob('');
      job.data = { ...job.data, sourceType: OpenApiSpecSourceType.URL, url: 'https://specs.example.com/openapi.json' };

      await expect(makeProcessor().processor.process(job)).rejects.toThrow('getaddrinfo ENOTFOUND specs.example.com');

      expect(harness.updates).toMatchObject([
        {
          options: {
            spec_status: { value: OpenApiSpecStatus.FAILED },
            spec_error: { value: 'getaddrinfo ENOTFOUND specs.example.com' },
          },
        },
      ]);
    });

    it('should skip only the operation whose $ref cannot be resolved, log it, and persist the rest', async () => {
      const spec = petStoreOpenApi3();
      spec.paths['/broken'] = {
        post: {
          operationId: 'broken',
          requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Missing' } } } },
          responses: ok,
        },
      };
      const { processor, logger } = makeProcessor();

      await processor.process(definitionJob(JSON.stringify(spec)));

      expect(harness.saved).toHaveLength(4);
      expect(byOperationId(harness.saved, 'broken')).toBeUndefined();
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('skipping operation POST /broken'),
        expect.anything()
      );
      expect(harness.updates).toMatchObject([{ options: { spec_status: { value: OpenApiSpecStatus.READY } } }]);
    });

    it('should prune a circular requestBody schema to {} on its second visit so the row is JSON-serialisable', async () => {
      const spec = petStoreOpenApi3();
      spec.components.schemas.Folder = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          children: { type: 'array', items: { $ref: '#/components/schemas/Folder' } },
        },
      };
      spec.paths['/folders'] = {
        post: {
          operationId: 'createFolder',
          requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Folder' } } } },
          responses: ok,
        },
      };

      await makeProcessor().processor.process(definitionJob(JSON.stringify(spec)));

      const row = byOperationId(harness.saved, 'createFolder');
      expect(row.requestBodySchema).toEqual({
        type: 'object',
        properties: { name: { type: 'string' }, children: { type: 'array', items: {} } },
      });
      expect(() => JSON.stringify(row)).not.toThrow();
    });
  });

  describe('dereference scope', () => {
    it('should persist an operation whose response schema has an unresolvable $ref', async () => {
      const spec = petStoreOpenApi3();
      spec.paths['/orphans'] = {
        get: {
          operationId: 'listOrphans',
          parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer' } }],
          responses: {
            200: { content: { 'application/json': { schema: { $ref: '#/components/schemas/DoesNotExist' } } } },
          },
        },
      };
      const { processor, logger } = makeProcessor();

      await processor.process(definitionJob(JSON.stringify(spec)));

      expect(byOperationId(harness.saved, 'listOrphans')).toMatchObject({
        parameters: [{ name: 'limit', in: 'query', required: false, schema: { type: 'integer' } }],
      });
      expect(logger.error).not.toHaveBeenCalled();
    });
  });
});
