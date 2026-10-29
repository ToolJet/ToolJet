import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { LibraryQuery } from '@entities/library_query.entity';
import { LibraryQueryState } from '@entities/library_query_state.entity';
import { LibraryQueryVersion } from '@entities/library_query_version.entity';
import { User } from '@entities/user.entity';

const findOne = jest.fn();
const softDelete = jest.fn();
const rawQuery = jest.fn();
const countBy = jest.fn();
const save = jest.fn();
const manager = { findOne, softDelete, query: rawQuery, countBy, save };
import * as databaseHelpers from '@helpers/database.helper';
import { LibraryLifecycleService } from '@modules/query-library/lifecycle.service';

const VERSION_ID = '11111111-1111-4111-8111-111111111111';
/** @group platform */
describe('LibraryLifecycleService.deleteVersion', () => {
  const service = new LibraryLifecycleService(null, null, null, { perform: jest.fn().mockResolvedValue(undefined) });
  const user = { id: 'user', organizationId: 'workspace' } as User;
  const query = { id: 'query', name: 'getCustomer', organizationId: user.organizationId } as LibraryQuery;
  const version = { id: VERSION_ID, libraryQueryId: query.id, versionNumber: 2, name: 'releaseB', kind: 'restapi' };
  beforeEach(() => {
    jest.resetAllMocks();
    jest
      .spyOn(databaseHelpers, 'dbTransactionWrap')
      .mockImplementation(async (callback) => callback(manager as unknown as EntityManager));
    findOne.mockImplementation(async (entity) => {
      if (entity === LibraryQueryVersion) return version;
      if (entity === LibraryQueryState) return { releasedVersionId: null };
      return query;
    });
    rawQuery.mockResolvedValue([]);
    countBy.mockResolvedValue(1);
    save.mockResolvedValue({});
  });
  it('should lock the standalone query and soft-delete an unused scoped version', async () => {
    await service.deleteVersion(user, query, VERSION_ID);
    expect(rawQuery).toHaveBeenCalledWith(
      'SELECT id FROM library_queries WHERE id = $1 AND organization_id = $2 FOR UPDATE',
      [query.id, user.organizationId]
    );
    expect(findOne).toHaveBeenCalledWith(LibraryQueryVersion, {
      where: { id: VERSION_ID, libraryQueryId: query.id },
    });
    expect(softDelete).toHaveBeenCalledWith(LibraryQueryVersion, { id: VERSION_ID, libraryQueryId: query.id });
  });
  it('should refuse a pinned version with the used-by message and 409', async () => {
    rawQuery.mockImplementation(async (sql: string) =>
      sql.includes('FROM data_queries')
        ? [{ appId: 'app', appName: 'Sales CRM', appType: 'front-end', appVersionName: 'v1' }]
        : []
    );
    await expect(service.deleteVersion(user, query, VERSION_ID)).rejects.toThrow(
      new ConflictException('Used by 1 app(s): Sales CRM · v1. Remove it from those first.')
    );
    expect(softDelete).not.toHaveBeenCalled();
  });
  it('should refuse deleting the released version with 400', async () => {
    findOne.mockImplementation(async (entity) =>
      entity === LibraryQueryVersion
        ? version
        : entity === LibraryQueryState
          ? { releasedVersionId: VERSION_ID }
          : query
    );
    await expect(service.deleteVersion(user, query, VERSION_ID)).rejects.toThrow(
      new BadRequestException("The released version can't be deleted")
    );
    expect(softDelete).not.toHaveBeenCalled();
  });
  it('should return 404 for a missing or already deleted version', async () => {
    findOne.mockImplementation(async (entity) => (entity === LibraryQueryVersion ? null : query));
    await expect(service.deleteVersion(user, query, VERSION_ID)).rejects.toThrow(
      new NotFoundException('Library query version not found')
    );
  });
  it('should return 404 for a missing workspace query before naming consumers', async () => {
    findOne.mockResolvedValue(null);
    await expect(service.deleteVersion(user, query, VERSION_ID)).rejects.toThrow(
      new NotFoundException('Library query not found')
    );
    expect(rawQuery).toHaveBeenCalledTimes(1);
    expect(softDelete).not.toHaveBeenCalled();
  });
});
