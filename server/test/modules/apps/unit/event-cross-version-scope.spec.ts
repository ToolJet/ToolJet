/** @group platform */
import { BadRequestException } from '@nestjs/common';

// Captures the `where` passed to manager.find so we can assert read scoping.
let mockFindWhere: Record<string, unknown> | undefined;

jest.mock('@helpers/database.helper', () => ({
  dbTransactionWrap: (operation: (manager: unknown) => unknown) => {
    const qb: Record<string, unknown> = {};
    qb.select = () => qb;
    qb.from = () => qb;
    qb.innerJoin = () => qb;
    qb.where = () => qb;
    qb.andWhere = () => qb;
    qb.getRawOne = async () => undefined; // attach target not found in this version
    const manager = {
      find: async (_entity: unknown, opts: { where?: Record<string, unknown> }) => {
        mockFindWhere = opts?.where;
        return [];
      },
      findOne: async () => undefined, // data_query/page not found in this version
      createQueryBuilder: () => qb,
    };
    return operation(manager);
  },
}));

import { EventsService } from 'src/modules/apps/services/event.service';

describe('Events are scoped to the guarded app version', () => {
  const service = new EventsService({ check: jest.fn(async () => undefined) } as any);
  const app = { appVersions: [{ id: 'version-A' }] } as any;

  beforeEach(() => {
    mockFindWhere = undefined;
  });

  it('reads events by BOTH the guarded version and the sourceId (not sourceId alone)', async () => {
    await service.getEvents(app, 'source-from-another-workspace');
    expect(mockFindWhere).toEqual({ appVersionId: 'version-A', sourceId: 'source-from-another-workspace' });
  });

  it('rejects creating an event attached to a data query from another version', async () => {
    await expect(
      service.createEvent(
        { name: 'e', event: {}, eventType: 'data_query', attachedTo: 'foreign-query', index: 0 } as any,
        'version-A',
        true // skip history capture
      )
    ).rejects.toThrow(BadRequestException);
  });
});
