/**
 * Duplicating a page gives each copied component a co_relation_id of its own.
 *
 * It must not inherit the source's (git keeps one file per co_relation_id, so the clone would overwrite its source on
 * push) and it must not stay empty (an empty id leaves the clone without an identity a version compare can match).
 *
 * Strategy: mock dbTransactionWrap with an in-memory manager, as slotted-parent-copy.spec.ts does, and read the
 * components clonePageEventsAndComponents saves.
 */

let pageComponents: any[] = [];
const saved: any[] = [];

function makeMockManager() {
  return {
    find: jest.fn().mockImplementation(async (entity: any) => (entity?.name === 'Component' ? pageComponents : [])),
    create: jest.fn().mockImplementation((_entity: any, values: any) => ({ ...values })),
    save: jest.fn().mockImplementation(async (entityOrRows: any, rows?: any) => {
      const list = Array.isArray(entityOrRows) ? entityOrRows : rows;
      if (Array.isArray(list)) saved.push(...list);
      return list;
    }),
  };
}

jest.mock('../../../../src/helpers/database.helper', () => ({
  dbTransactionWrap: jest.fn().mockImplementation(async (cb: (manager: any) => Promise<any>) => cb(makeMockManager())),
  dbTransactionForAppVersionAssociationsUpdate: jest.fn(),
}));

jest.mock('../../../../src/modules/apps/services/component.service');
jest.mock('../../../../src/modules/apps/services/page.util.service');
jest.mock('../../../../src/modules/apps/services/event.service');

import { PageService } from '../../../../src/modules/apps/services/page.service';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SOURCE_CO_RELATION_ID = '11111111-1111-4111-8111-111111111111';

const makeService = () =>
  new PageService(
    null as any, // componentsService
    null as any, // pageHelperService
    { findAllEventsWithSourceId: jest.fn().mockResolvedValue([]) } as any, // eventHandlerService
    { warn: jest.fn() } as any, // transactionLogger
    null as any // appValidationService
  );

describe('page duplicate: co_relation_id of the copied components', () => {
  beforeEach(() => {
    saved.length = 0;
    pageComponents = [
      {
        id: '22222222-2222-4222-8222-222222222222',
        name: 'tracked',
        type: 'Button',
        parent: null,
        pageId: 'page-1',
        properties: {},
        styles: {},
        co_relation_id: SOURCE_CO_RELATION_ID,
      },
      {
        id: '33333333-3333-4333-8333-333333333333',
        name: 'untracked',
        type: 'Button',
        parent: null,
        pageId: 'page-1',
        properties: {},
        styles: {},
        co_relation_id: null,
      },
    ];
  });

  it('gives a copy of a component that had an id a new one, not the source id', async () => {
    await makeService().clonePageEventsAndComponents('page-1', 'page-2');
    const copy = saved.find((c) => c.pageId === 'page-2' && c.name === 'tracked');

    expect(copy.co_relation_id).toMatch(UUID);
    expect(copy.co_relation_id).not.toBe(SOURCE_CO_RELATION_ID);
  });

  it('gives a copy of a component that had no id one', async () => {
    await makeService().clonePageEventsAndComponents('page-1', 'page-2');
    const copy = saved.find((c) => c.pageId === 'page-2' && c.name === 'untracked');

    expect(copy.co_relation_id).toMatch(UUID);
  });
});
