import { INestApplication } from '@nestjs/common';
import { lockCarriedLibraryPins, lockLibraryPins, setsLibraryReference } from '@modules/query-library/locking';
import { AppsUtilService } from '@modules/apps/util.service';
import {
  initTestApp,
  closeTestApp,
  createAdmin,
  createApplication,
  createApplicationVersion,
  createDataQuery,
  createDataSource,
  createLibraryQuery,
  getDefaultDataSource,
} from 'test-helper';

const missingQuery = '00000000-0000-4000-8000-0000000000aa';
const missingVersion = '00000000-0000-4000-8000-0000000000bb';
const pinTo = (libraryQueryId: string, libraryQueryVersionId: string) => ({
  kind: 'library',
  options: { libraryQueryId, libraryQueryVersionId },
});

/**
 * Only a reference that is being set or changed is checked. A reference carried along unchanged (version create,
 * import, git pull, edits to other fields) may point at a library query that is not in this workspace.
 */
/** @group platform */
describe('Library reference checks', () => {
  let app: INestApplication;
  let admin: Awaited<ReturnType<typeof createAdmin>>;
  let workspaceId: string;
  let existing: Awaited<ReturnType<typeof createLibraryQuery>>;
  const manager = () => getDefaultDataSource().manager;

  beforeAll(async () => {
    ({ app } = await initTestApp());
    admin = await createAdmin(app, 'library-pin-checks@tooljet.io');
    workspaceId = admin.workspace.id;
    existing = await createLibraryQuery(workspaceId, { kind: 'runjs', options: { code: 'return 1;' } });
  });
  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  describe('lockLibraryPins | writes that may change a reference', () => {
    it('should accept a new reference to an existing snapshot and return it', async () => {
      await expect(
        lockLibraryPins(manager(), workspaceId, [pinTo(existing.id, existing.draftId)])
      ).resolves.toMatchObject([{ id: existing.draftId }]);
    });

    it('should 404 a new reference to a library query that is not in this workspace', async () => {
      await expect(
        lockLibraryPins(manager(), workspaceId, [pinTo(missingQuery, missingVersion)])
      ).rejects.toMatchObject({ status: 404 });
    });

    it('should 404 a changed reference to a missing version', async () => {
      await expect(
        lockLibraryPins(manager(), workspaceId, [
          { ...pinTo(existing.id, missingVersion), previous: pinTo(existing.id, existing.draftId) },
        ])
      ).rejects.toMatchObject({ status: 404 });
    });

    it('should accept an unchanged reference to a missing library query', async () => {
      const pin = pinTo(missingQuery, missingVersion);
      await expect(
        lockLibraryPins(manager(), workspaceId, [{ ...pin, options: { ...pin.options, inputs: {} }, previous: pin }])
      ).resolves.toEqual([]);
    });

    it('should treat a query newly moved onto the library as a change', async () => {
      await expect(
        lockLibraryPins(manager(), workspaceId, [
          { ...pinTo(missingQuery, missingVersion), previous: { kind: 'runjs', options: {} } },
        ])
      ).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('setsLibraryReference | which writes need the licence', () => {
    const pin = pinTo(missingQuery, missingVersion);
    it.each([
      ['a new consumer', [pin], true],
      ['a changed version', [{ ...pin, previous: pinTo(missingQuery, missingQuery) }], true],
      ['a query moved onto the library', [{ ...pin, previous: { kind: 'runjs' } }], true],
      ['an edit that keeps the reference', [{ ...pin, options: { ...pin.options, inputs: {} }, previous: pin }], false],
      ['a query moved off the library', [{ kind: 'runjs', options: {}, previous: pin }], false],
      [
        'an edit of a consumer with no reference',
        [{ kind: 'library', options: {}, previous: { kind: 'library' } }],
        true,
      ],
      ['a non-library query', [{ kind: 'runjs', options: {} }], false],
    ])('should report %s as %s', (_label, writes, expected) => {
      expect(setsLibraryReference(writes)).toBe(expected);
    });
  });

  describe('lockCarriedLibraryPins | references carried along unchanged', () => {
    it('should accept references to missing library queries, versions and malformed ids', async () => {
      await expect(
        lockCarriedLibraryPins(manager(), workspaceId, [
          pinTo(missingQuery, missingVersion),
          pinTo(existing.id, missingVersion),
          pinTo('not-a-uuid', 'not-a-uuid'),
          pinTo(existing.id, existing.draftId),
        ])
      ).resolves.toBeUndefined();
    });
  });

  // Carried references are allowed into a version, but never released or promoted while they point nowhere.
  describe('release and promote gates | a reference to a library query that is not in this workspace', () => {
    let versionId: string;
    const blocked = (verb: string) => ({
      response: {
        message: {
          error: expect.stringContaining(`${verb} blocked`),
          details: `Library query "dangling" uses a library query that isn't in this workspace. Pick one from the library.`,
        },
      },
    });

    beforeAll(async () => {
      const application = await createApplication(app, { name: 'Dangling consumer', user: admin.user });
      const version = await createApplicationVersion(app, application);
      const source = await createDataSource(app, { name: 'librarydefault', kind: 'library', appVersion: version });
      const { options } = pinTo(missingQuery, missingVersion);
      await createDataQuery(app, { name: 'dangling', dataSource: source, appVersion: version, options });
      versionId = version.id;
    });

    it('should block release', async () => {
      await expect(
        app.get(AppsUtilService).checkLibraryQueriesReleasedInApp(versionId, workspaceId, manager())
      ).rejects.toMatchObject(blocked('Release'));
    });

    it('should block promote', async () => {
      await expect(
        app
          .get(AppsUtilService)
          .checkLibraryQueriesPromotableToEnvironment(versionId, 'staging', 2, workspaceId, manager())
      ).rejects.toMatchObject(blocked('Promote'));
    });
  });
});
