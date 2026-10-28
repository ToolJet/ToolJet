/**
 * deleteLibraryQueryVersion: soft-deletes one released version unless an app or module still pins it.
 * Stub collaborators; the pin match itself (SQL) is covered by the e2e spec.
 */
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { DataQueriesService } from '@modules/data-queries/service';
import { LibraryQueryVersion } from '@entities/library_query_version.entity';

const VERSION_ID = '11111111-1111-4111-8111-111111111111';

describe('DataQueriesService.deleteLibraryQueryVersion', () => {
  const findOne = jest.fn();
  const softDelete = jest.fn();
  const findLibraryConsumers = jest.fn();
  const service = new DataQueriesService(
    { manager: { findOne, softDelete }, findLibraryConsumers } as any,
    null as any,
    null as any,
    null as any
  );
  const app = { id: 'lib-app', type: 'query_library', organizationId: 'org1' } as any;
  const query = { id: 'q1', name: 'getCustomer', appVersionId: 'av1', appVersion: { appId: 'lib-app' } };
  const version = { id: VERSION_ID, dataQueryId: 'q1', versionNumber: 2, kind: 'restapi' };

  beforeEach(() => {
    jest.resetAllMocks();
    // First lookup is the library query, the second is the version row.
    findOne.mockImplementation(async (entity) => (entity === LibraryQueryVersion ? version : query));
    findLibraryConsumers.mockResolvedValue([]);
  });

  it('soft-deletes an unused version', async () => {
    await service.deleteLibraryQueryVersion('q1', VERSION_ID, app);

    expect(findLibraryConsumers).toHaveBeenCalledWith('org1', 'av1', 'q1', VERSION_ID);
    expect(softDelete).toHaveBeenCalledWith(LibraryQueryVersion, { id: VERSION_ID });
  });

  it('409s with the used-by message while a consumer pins the version', async () => {
    findLibraryConsumers.mockResolvedValue([
      { appId: 'a1', appName: 'Sales CRM', appType: 'front-end', appVersionName: 'v1' },
    ]);

    await expect(service.deleteLibraryQueryVersion('q1', VERSION_ID, app)).rejects.toThrow(
      new ConflictException('Used by 1 app(s): Sales CRM · v1. Remove it from those first.')
    );
    expect(softDelete).not.toHaveBeenCalled();
  });

  it('404s a version that is missing or already deleted', async () => {
    findOne.mockImplementation(async (entity) => (entity === LibraryQueryVersion ? null : query));

    await expect(service.deleteLibraryQueryVersion('q1', VERSION_ID, app)).rejects.toThrow(
      new NotFoundException('Library query version not found')
    );
  });

  it('404s an id that is not a uuid without querying', async () => {
    await expect(service.deleteLibraryQueryVersion('q1', 'nope', app)).rejects.toThrow(
      new NotFoundException('Library query version not found')
    );
  });

  it('404s a query of another app before naming any consumer', async () => {
    findOne.mockResolvedValue({ ...query, appVersion: { appId: 'other-app' } });

    await expect(service.deleteLibraryQueryVersion('q1', VERSION_ID, app)).rejects.toThrow(
      new NotFoundException('Library query not found')
    );
    expect(findLibraryConsumers).not.toHaveBeenCalled();
  });

  it('400s in an app that is not a query library', async () => {
    await expect(service.deleteLibraryQueryVersion('q1', VERSION_ID, { ...app, type: 'front-end' })).rejects.toThrow(
      BadRequestException
    );
  });
});
