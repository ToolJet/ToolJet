// OpenApiSpecProcessor is a BullMQ WorkerHost, but process(job) is a plain async method - there is
// no queue harness here on purpose. Construct the processor directly with stub dependencies and
// call process({ id, data }); dbTransactionWrap is mocked so no database is needed either.
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import type { OpenApiSpecProcessor as OpenApiSpecProcessorType } from '../../../../src/modules/openapi-spec/processors/openapi-spec.processor';
import { OpenApiSpecSourceType, OpenApiSpecStatus } from '../../../../src/modules/openapi-spec/constants';

// ── Mocks ────────────────────────────────────────────────────────────────────

let mockManager: any;

jest.mock('../../../../src/helpers/database.helper', () => ({
  dbTransactionWrap: jest.fn().mockImplementation(async (cb: (manager: any) => Promise<any>) => cb(mockManager)),
}));

jest.mock('got', () => ({ __esModule: true, default: jest.fn() }));

// Records what the processor hands the dereferencer. Keys are captured BEFORE delegating because
// dereferenceInternal mutates parser.schema in place.
const mockDereferenceCalls: { keys: string[]; nodes?: number }[] = [];
let mockCountDereferencedNodes = false;

jest.mock('@apidevtools/json-schema-ref-parser', () => {
  const actual = jest.requireActual('@apidevtools/json-schema-ref-parser');
  const countNodes = (root: unknown) => {
    const visited = new Set<object>();
    const walk = (node: any) => {
      if (!node || typeof node !== 'object' || visited.has(node)) return;
      visited.add(node);
      Object.values(node).forEach(walk);
    };
    walk(root);
    return visited.size;
  };
  return {
    ...actual,
    dereferenceInternal: jest.fn((parser: any, options: any) => {
      const call: { keys: string[]; nodes?: number } = { keys: Object.keys(parser.schema) };
      mockDereferenceCalls.push(call);
      const result = actual.dereferenceInternal(parser, options);
      if (mockCountDereferencedNodes) call.nodes = countNodes(parser.schema);
      return result;
    }),
  };
});

// jest-transaction-setup loads the app module graph (this processor included) with the real
// database helper before the mocks above are registered - reload so the processor sees them.
let OpenApiSpecProcessor: typeof OpenApiSpecProcessorType;
let got: jest.Mock;
beforeAll(async () => {
  jest.resetModules();
  ({ OpenApiSpecProcessor } = await import('../../../../src/modules/openapi-spec/processors/openapi-spec.processor'));
  got = (await import('got')).default as unknown as jest.Mock;
});

// ── Harness ──────────────────────────────────────────────────────────────────

const DATA_SOURCE_ID = 'ds-1';

function makeManager() {
  const saved: Record<string, any>[] = [];
  const updates: Record<string, any>[] = [];
  const manager = {
    query: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue({}),
    create: jest.fn((_entity: unknown, row: Record<string, any>) => row),
    save: jest.fn(async (_entity: unknown, rows: Record<string, any>[]) => {
      saved.push(...rows);
      return rows;
    }),
    findOne: jest.fn().mockResolvedValue({ options: {} }),
    update: jest.fn(async (_entity: unknown, where: Record<string, any>, patch: Record<string, any>) => {
      updates.push({ where, ...patch });
    }),
  };
  return { manager, saved, updates };
}

function makeProcessor({ terminated = false } = {}) {
  const terminationRegistry = {
    isTerminated: jest.fn().mockResolvedValue(terminated),
    clear: jest.fn(),
  };
  const logger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };
  const processor = new OpenApiSpecProcessor(terminationRegistry as any, logger as any);
  return { processor, logger, terminationRegistry };
}

function definitionJob(definition: string, environmentIds = ['env-1']) {
  return {
    id: 'job-1',
    data: {
      dataSourceId: DATA_SOURCE_ID,
      organizationId: 'org-1',
      environmentIds,
      sourceType: OpenApiSpecSourceType.DEFINITION,
      definition,
    },
  } as any;
}

const rowsFor = (saved: Record<string, any>[], environmentId: string) =>
  saved.filter((row) => row.environmentId === environmentId);

const byOperationId = (rows: Record<string, any>[], operationId: string) =>
  rows.find((row) => row.operationId === operationId);

// ── Fixtures ─────────────────────────────────────────────────────────────────

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

// A response schema that expands to hundreds of distinct objects (200 properties, each a distinct
// component with its own nested properties) next to two tiny parameters - the shape of a
// Microsoft Graph operation, where responses are ~99.9% of the expanded bytes.
function heavyResponsesOpenApi3(): Record<string, any> {
  const leaves: Record<string, any> = {};
  const bigProperties: Record<string, any> = {};
  for (let i = 0; i < 200; i++) {
    leaves[`Leaf${i}`] = { type: 'object', properties: { id: { type: 'string' }, value: { type: 'string' } } };
    bigProperties[`field${i}`] = { $ref: `#/components/schemas/Leaf${i}` };
  }
  return {
    openapi: '3.0.0',
    info: { title: 'Heavy', version: '1.0.0' },
    components: { schemas: { ...leaves, Big: { type: 'object', properties: bigProperties } } },
    paths: {
      '/items': {
        get: {
          operationId: 'listItems',
          parameters: [
            { name: 'top', in: 'query', schema: { type: 'integer' } },
            { name: 'skip', in: 'query', schema: { type: 'integer' } },
          ],
          responses: {
            200: {
              description: 'ok',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Big' } } },
            },
          },
        },
      },
    },
  };
}

/** @group marketplace */
describe('OpenApiSpecProcessor', () => {
  let harness: ReturnType<typeof makeManager>;

  beforeEach(() => {
    harness = makeManager();
    mockManager = harness.manager;
    mockDereferenceCalls.length = 0;
    mockCountDereferencedNodes = false;
    got.mockReset();
  });

  describe('parsing', () => {
    it('should extract the same operations from a JSON and a YAML definition', async () => {
      const spec = petStoreOpenApi3();

      await makeProcessor().processor.process(definitionJob(JSON.stringify(spec)));
      const fromJson = harness.saved;

      harness = makeManager();
      mockManager = harness.manager;
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
  });

  describe('termination and failure', () => {
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

  // Replicates the Microsoft Graph stall: the whole operation (responses included) was cloned and
  // dereferenced, then everything but parameters/requestBody was thrown away.
  describe('dereference scope', () => {
    it('should hand the dereferencer only parameters and requestBody, never responses', async () => {
      await makeProcessor().processor.process(definitionJob(JSON.stringify(heavyResponsesOpenApi3())));

      const unexpectedKeys = mockDereferenceCalls
        .flatMap((call) => call.keys)
        .filter((key) => !['parameters', 'requestBody'].includes(key));
      expect(mockDereferenceCalls.length).toBeGreaterThan(0);
      expect(unexpectedKeys).toEqual([]);
    });

    it('should not expand response schemas at all', async () => {
      mockCountDereferencedNodes = true;

      await makeProcessor().processor.process(definitionJob(JSON.stringify(heavyResponsesOpenApi3())));

      const expandedNodes = mockDereferenceCalls.reduce((total, call) => total + (call.nodes ?? 0), 0);
      expect(harness.saved).toHaveLength(1);
      expect(expandedNodes).toBeLessThan(50);
    });

    it('should not persist response schemas or raw schema columns', async () => {
      await makeProcessor().processor.process(definitionJob(JSON.stringify(petStoreOpenApi3())));

      for (const row of harness.saved) {
        expect(row).not.toHaveProperty('responseSchemas');
        expect(row).not.toHaveProperty('requestBodySchemaRaw');
        expect(row).not.toHaveProperty('responseSchemasRaw');
      }
    });
  });

  // On-demand run against a real, large spec (e.g. Microsoft Graph v1.0, 17,777 operations):
  //   OPENAPI_SPEC_GRAPH_FIXTURE=/path/to/openapi.yaml SKIP_GLOBAL_SETUP=1 NODE_ENV=test npx jest --config jest.config.ts test/modules/openapi-spec/unit/openapi-spec.processor.spec.ts -t Graph
  const describeGraph = process.env.OPENAPI_SPEC_GRAPH_FIXTURE ? describe : describe.skip;

  describeGraph('Microsoft Graph spec', () => {
    it('should process every operation within the memory and time budget', async () => {
      const definition = fs.readFileSync(process.env.OPENAPI_SPEC_GRAPH_FIXTURE as string, 'utf8');
      let savedRows = 0;
      let peakHeapUsedMB = 0;
      // Count instead of retaining rows, so the measured heap is the processor's, not the test's.
      harness.manager.save.mockImplementation(async (_entity: unknown, rows: Record<string, any>[]) => {
        savedRows += rows.length;
        peakHeapUsedMB = Math.max(peakHeapUsedMB, process.memoryUsage().heapUsed / 1024 / 1024);
        return rows;
      });

      const startedAt = Date.now();
      await makeProcessor().processor.process(definitionJob(definition));
      const elapsedSeconds = (Date.now() - startedAt) / 1000;

      // Surfaced even with the console silenced by jest-setup.
      process.stdout.write(
        `[graph] rows=${savedRows} peakHeapUsedMB=${peakHeapUsedMB.toFixed(0)} seconds=${elapsedSeconds.toFixed(1)}\n`
      );
      expect(savedRows).toBe(17777);
      expect(peakHeapUsedMB).toBeLessThan(1500);
      expect(elapsedSeconds).toBeLessThan(60);
    }, 120000);
  });
});
