import { INestApplication } from '@nestjs/common';
import { LibraryQuery } from '@entities/library_query.entity';
import { LibraryQueryFolder } from '@entities/library_query_folder.entity';
import { LibraryQueryVersion } from '@entities/library_query_version.entity';
import { LibraryQueryDraft } from '@entities/library_query_draft.entity';
import { LibraryQueryState } from '@entities/library_query_state.entity';
import { DataSource } from '@entities/data_source.entity';
import { closeTestApp, createAdmin, getDefaultDataSource, initTestApp } from 'test-helper';

/** @group platform */
describe('LibraryQuerySchema', () => {
  let app: INestApplication;
  let organizationId: string;
  let otherOrganizationId: string;

  beforeAll(async () => {
    ({ app } = await initTestApp());
    organizationId = (await createAdmin(app, 'library-schema@example.com')).workspace.id;
    otherOrganizationId = (await createAdmin(app, 'library-schema-other@example.com')).workspace.id;
  });
  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  const createQuery = (extra: Partial<LibraryQuery> = {}) =>
    getDefaultDataSource()
      .getRepository(LibraryQuery)
      .save({
        organizationId,
        name: 'Shared query',
        ...extra,
      });

  it('should refuse a second library query with the same name in one workspace', async () => {
    await createQuery();
    await expect(createQuery()).rejects.toMatchObject({ code: '23505' });
  });

  it('should allow the same name in two workspaces', async () => {
    await createQuery();
    await expect(createQuery({ organizationId: otherOrganizationId })).resolves.toMatchObject({
      organizationId: otherOrganizationId,
      name: 'Shared query',
    });
  });

  it('should null data_source_id when the data source is deleted', async () => {
    const connection = getDefaultDataSource();
    const dataSource = await connection.getRepository(DataSource).save({
      name: 'Library source',
      kind: 'restapi',
      organizationId,
      scope: 'global',
    });
    const query = await createQuery();
    const draft = await connection.getRepository(LibraryQueryDraft).save({
      libraryQueryId: query.id,
      name: 'v1',
      kind: 'restapi',
      dataSourceId: dataSource.id,
      options: {},
    });
    await connection.getRepository(DataSource).delete(dataSource.id);
    expect(await connection.getRepository(LibraryQueryDraft).findOneByOrFail({ id: draft.id })).toMatchObject({
      dataSourceId: null,
    });
  });

  it('should cascade versions and state when a library query is deleted', async () => {
    const connection = getDefaultDataSource();
    const query = await createQuery();
    await connection.getRepository(LibraryQueryVersion).save({
      libraryQueryId: query.id,
      name: 'v1',
      versionNumber: 1,
      kind: 'restapi',
      options: {},
    });
    await connection.getRepository(LibraryQueryState).save({ libraryQueryId: query.id });
    await connection.getRepository(LibraryQuery).delete(query.id);
    expect(await connection.getRepository(LibraryQueryVersion).countBy({ libraryQueryId: query.id })).toBe(0);
    expect(await connection.getRepository(LibraryQueryState).countBy({ libraryQueryId: query.id })).toBe(0);
  });

  it.each([LibraryQueryDraft, LibraryQueryVersion])('should require a persisted name for %p', async (entity) => {
    const query = await createQuery();
    await expect(
      getDefaultDataSource().manager.save(entity, {
        libraryQueryId: query.id,
        versionNumber: 1,
        kind: 'restapi',
        options: {},
      })
    ).rejects.toMatchObject({ code: '23502' });
  });

  it('should null folder_id when its folder is deleted', async () => {
    const connection = getDefaultDataSource();
    const folder = await connection.getRepository(LibraryQueryFolder).save({ organizationId, name: 'Folder' });
    const query = await createQuery({ folderId: folder.id });
    await connection.getRepository(LibraryQueryFolder).delete(folder.id);
    expect(await connection.getRepository(LibraryQuery).findOneByOrFail({ id: query.id })).toMatchObject({
      folderId: null,
    });
  });
});
