// OpenApiSpecProcessor is a BullMQ WorkerHost, but process(job) is a plain async method - there is
// no queue harness here on purpose. Construct the processor directly with stub dependencies and
// call process({ id, data }); dbTransactionWrap is mocked so no database is needed either.
import type { OpenApiSpecProcessor as OpenApiSpecProcessorType } from '../../../../src/modules/openapi-spec/processors/openapi-spec.processor';
import { OpenApiSpecSourceType } from '../../../../src/modules/openapi-spec/constants';

export const mockDb: { manager: any } = { manager: undefined };

jest.mock('../../../../src/helpers/database.helper', () => ({
  dbTransactionWrap: jest.fn().mockImplementation(async (cb: (manager: any) => Promise<any>) => cb(mockDb.manager)),
}));

let OpenApiSpecProcessor: typeof OpenApiSpecProcessorType;

// jest-transaction-setup loads the app module graph (this processor included) with the real
// database helper before the mocks are registered - reload so the processor sees them. Call from
// beforeAll, after the test file's own jest.mock calls.
export async function loadProcessor(): Promise<void> {
  jest.resetModules();
  ({ OpenApiSpecProcessor } = await import('../../../../src/modules/openapi-spec/processors/openapi-spec.processor'));
}

export const DATA_SOURCE_ID = 'ds-1';

export function makeManager() {
  const saved: Record<string, any>[] = [];
  const updates: Record<string, any>[] = [];
  const manager = {
    delete: jest.fn().mockResolvedValue({}),
    save: jest.fn(async (_entity: unknown, rows: Record<string, any>[]) => {
      saved.push(...rows);
      return rows;
    }),
    findOne: jest.fn().mockResolvedValue({ options: {} }),
    update: jest.fn(async (_entity: unknown, where: Record<string, any>, patch: Record<string, any>) => {
      updates.push({ where, ...patch });
    }),
  };
  mockDb.manager = manager;
  return { manager, saved, updates };
}

export function makeProcessor({ terminated = false } = {}) {
  const terminationRegistry = {
    isTerminated: jest.fn().mockResolvedValue(terminated),
    clear: jest.fn(),
  };
  const logger = { log: jest.fn(), error: jest.fn() };
  const processor = new OpenApiSpecProcessor(terminationRegistry as any, logger as any);
  return { processor, logger, terminationRegistry };
}

export function definitionJob(definition: string, environmentIds = ['env-1']) {
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
