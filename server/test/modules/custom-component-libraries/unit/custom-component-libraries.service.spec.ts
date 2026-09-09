/**
 * Unit tests for the EE CustomComponentLibrariesService (server/ee/custom-component-libraries/service.ts).
 * Calls the service directly (no HTTP layer) to cover logic that's awkward to exercise
 * through guards/multipart: version normalization, unique-constraint handling,
 * upsert semantics, and the delete usage-guard.
 *
 * @group platform
 */
import * as os from 'os';
import * as path from 'path';

process.env.CUSTOM_COMPONENT_STORAGE_PATH = path.join(os.tmpdir(), `ccl-unit-${Date.now()}`);

import { ConflictException, NotFoundException, BadRequestException, INestApplication } from '@nestjs/common';
import {
  initTestApp,
  closeTestApp,
  createUser,
  createApplication,
  createApplicationVersion,
  updateEntity,
  findEntity,
  createLibrary,
  createLibraryRevision,
  createDevBundle,
  buildManifest,
  BUNDLE_JS,
  BUNDLE_CSS,
  countEntities,
} from 'test-helper';
import { CustomComponentLibrariesService } from '@ee/custom-component-libraries/service';
import { StorageService } from '@modules/custom-component-libraries/storage.service';
import { CustomComponentLibrary } from '@entities/custom_component_library.entity';
import { CustomComponentLibraryRevision } from '@entities/custom_component_library_revision.entity';
import { CustomComponentDevBundle } from '@entities/custom_component_dev_bundle.entity';
import { AppVersion } from '@entities/app_version.entity';

describe('CustomComponentLibrariesService', () => {
  let app: INestApplication;
  let service: CustomComponentLibrariesService;
  let storageService: StorageService;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise', freshApp: true }));
    service = app.get<CustomComponentLibrariesService>(CustomComponentLibrariesService);
    storageService = app.get<StorageService>(StorageService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  async function orgWithUser() {
    const { organization, user } = await createUser(app, {
      email: `ccl-unit-${Date.now()}-${Math.random()}@tooljet.io`,
    });
    return { organization, user };
  }

  async function org() {
    return (await orgWithUser()).organization.id;
  }

  describe('createLibrary', () => {
    it('creates a library with an auto-generated correlationId', async () => {
      const organizationId = await org();
      const result = await service.createLibrary(organizationId, 'my-lib');
      expect(result).toMatchObject({ name: 'my-lib', id: expect.any(String), correlationId: expect.any(String) });
    });

    it('throws ConflictException on a duplicate name within the same org', async () => {
      const organizationId = await org();
      await service.createLibrary(organizationId, 'dup');
      await expect(service.createLibrary(organizationId, 'dup')).rejects.toThrow(ConflictException);
    });

    it('allows the same name in a different org', async () => {
      const orgA = await org();
      const orgB = await org();
      await service.createLibrary(orgA, 'shared');
      await expect(service.createLibrary(orgB, 'shared')).resolves.toMatchObject({ name: 'shared' });
    });
  });

  describe('findOrCreateLibrary', () => {
    it('creates on first call and returns the same row on a second call', async () => {
      const organizationId = await org();
      const correlationId = '11111111-2222-3333-4444-555555555555';

      const first = await service.findOrCreateLibrary(organizationId, correlationId, 'foc-lib');
      expect(first).toMatchObject({ correlationId, created: true });

      const second = await service.findOrCreateLibrary(organizationId, correlationId, 'foc-lib');
      expect(second).toMatchObject({ id: first.id, correlationId, created: false });
    });

    it('throws ConflictException when the name collides with a different library', async () => {
      const organizationId = await org();
      await service.createLibrary(organizationId, 'taken-name');

      await expect(
        service.findOrCreateLibrary(organizationId, '66666666-7777-8888-9999-000000000000', 'taken-name')
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getLibrary / getLibraryByCorrelationId', () => {
    it('returns the library when it belongs to the org', async () => {
      const organizationId = await org();
      const library = await createLibrary(organizationId);
      await expect(service.getLibrary(organizationId, library.id)).resolves.toMatchObject({ id: library.id });
      await expect(service.getLibraryByCorrelationId(organizationId, library.correlationId)).resolves.toMatchObject({
        id: library.id,
      });
    });

    it('throws NotFoundException for a nonexistent id', async () => {
      const organizationId = await org();
      await expect(service.getLibrary(organizationId, '00000000-0000-0000-0000-000000000000')).rejects.toThrow(
        NotFoundException
      );
    });

    it('throws NotFoundException when the library belongs to a different org', async () => {
      const orgA = await org();
      const orgB = await org();
      const library = await createLibrary(orgA);
      await expect(service.getLibrary(orgB, library.id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('listLibraries', () => {
    it('returns an empty array for an org with no libraries', async () => {
      const organizationId = await org();
      await expect(service.listLibraries(organizationId)).resolves.toEqual([]);
    });

    it('assembles revisions and dev bundles, latest revision surfaced as manifest, sorted by name', async () => {
      const { organization, user } = await orgWithUser();
      const organizationId = organization.id;

      const libraryB = await createLibrary(organizationId, { name: 'b-lib' });
      const libraryA = await createLibrary(organizationId, { name: 'a-lib' });
      // createdAt uses a SQL-level `now()` default, which is constant for the whole
      // ambient test transaction -- a real setTimeout gap between saves wouldn't
      // produce different timestamps here, so set them explicitly instead.
      await createLibraryRevision(libraryA.id, {
        version: '1.0.0',
        manifest: buildManifest('First'),
        createdAt: new Date(Date.now() - 1000),
      });
      const latest = await createLibraryRevision(libraryA.id, {
        version: '1.1.0',
        manifest: buildManifest('Second'),
        createdAt: new Date(),
      });
      await createDevBundle(libraryA.id, user.id);

      const result = await service.listLibraries(organizationId);

      expect(result.map((l) => l.name)).toEqual(['a-lib', 'b-lib']);
      const libA = result.find((l) => l.id === libraryA.id);
      expect(libA.manifest).toEqual(latest.manifest);
      expect(libA.revisions.map((r) => r.version)).toEqual(['1.1.0', '1.0.0']);
      expect(libA.devBundles).toHaveLength(1);
      expect(result.find((l) => l.id === libraryB.id).revisions).toEqual([]);
    });
  });

  describe('publishRevision', () => {
    it.each([
      ['1', '1.0.0'],
      ['1.2', '1.2.0'],
      ['1.2.3', '1.2.3'],
    ])('normalizes version "%s" to "%s"', async (input, expected) => {
      const organizationId = await org();
      const library = await service.createLibrary(organizationId, `norm-${input}-${Date.now()}`);
      const result = await service.publishRevision(
        organizationId,
        library.correlationId,
        { bundle: BUNDLE_JS, manifest: buildManifest() },
        input
      );
      expect(result.version).toBe(expected);
    });

    it('rejects a version with leading zeros', async () => {
      const organizationId = await org();
      const library = await service.createLibrary(organizationId, `leadingzero-${Date.now()}`);
      await expect(
        service.publishRevision(
          organizationId,
          library.correlationId,
          { bundle: BUNDLE_JS, manifest: buildManifest() },
          '01.2.3'
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException on a duplicate version for the same library', async () => {
      const organizationId = await org();
      const library = await service.createLibrary(organizationId, `dupver-${Date.now()}`);
      await service.publishRevision(
        organizationId,
        library.correlationId,
        { bundle: BUNDLE_JS, manifest: buildManifest() },
        '1.0.0'
      );
      await expect(
        service.publishRevision(
          organizationId,
          library.correlationId,
          { bundle: BUNDLE_JS, manifest: buildManifest() },
          '1.0.0'
        )
      ).rejects.toThrow(ConflictException);
    });

    it('throws NotFoundException for an unknown correlationId', async () => {
      const organizationId = await org();
      await expect(
        service.publishRevision(
          organizationId,
          '00000000-0000-0000-0000-000000000000',
          { bundle: BUNDLE_JS, manifest: buildManifest() },
          '1.0.0'
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('propagates a storage failure instead of silently succeeding', async () => {
      const organizationId = await org();
      const library = await service.createLibrary(organizationId, `storagefail-${Date.now()}`);
      jest.spyOn(storageService, 'upload').mockRejectedValueOnce(new Error('disk full'));

      await expect(
        service.publishRevision(
          organizationId,
          library.correlationId,
          { bundle: BUNDLE_JS, manifest: buildManifest() },
          '1.0.0'
        )
      ).rejects.toThrow('disk full');
    });

    it('persists css when provided', async () => {
      const organizationId = await org();
      const library = await service.createLibrary(organizationId, `withcss-${Date.now()}`);
      const result = await service.publishRevision(
        organizationId,
        library.correlationId,
        { bundle: BUNDLE_JS, css: BUNDLE_CSS, manifest: buildManifest() },
        '1.0.0'
      );
      const served = await service.serveRevisionFile(library.id, '1.0.0', 'index.css');
      expect(served.data.toString()).toBe(BUNDLE_CSS.toString());
      expect(result.version).toBe('1.0.0');
    });
  });

  describe('uploadDev', () => {
    it('creates a dev bundle and overwrites it on a second upload (one mutable slot)', async () => {
      const { organization, user } = await orgWithUser();
      const organizationId = organization.id;
      const library = await service.createLibrary(organizationId, `dev-${Date.now()}`);

      await service.uploadDev(user.id, organizationId, library.correlationId, {
        bundle: Buffer.from('v1'),
        manifest: buildManifest(),
      });
      await service.uploadDev(user.id, organizationId, library.correlationId, {
        bundle: Buffer.from('v2'),
        manifest: buildManifest(),
      });

      const count = await countEntities(CustomComponentDevBundle, { libraryId: library.id, userId: user.id } as any);
      expect(count).toBe(1);

      const served = await service.serveDevFile(library.id, user.id, 'index.js');
      expect(served.data.toString()).toBe('v2');
    });

    it('throws NotFoundException when the library does not belong to the org', async () => {
      const orgA = await org();
      const { organization: orgB, user } = await orgWithUser();
      const library = await service.createLibrary(orgA, `dev-wrongorg-${Date.now()}`);

      await expect(
        service.uploadDev(user.id, orgB.id, library.correlationId, { bundle: BUNDLE_JS, manifest: buildManifest() })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteLibrary', () => {
    it('throws NotFoundException for a nonexistent library', async () => {
      const organizationId = await org();
      await expect(service.deleteLibrary(organizationId, '00000000-0000-0000-0000-000000000000')).rejects.toThrow(
        NotFoundException
      );
    });

    it('deletes the library and cascades revisions/dev bundles, and cleans up storage', async () => {
      const { organization, user } = await orgWithUser();
      const organizationId = organization.id;
      const library = await createLibrary(organizationId);
      await createLibraryRevision(library.id);
      await createDevBundle(library.id, user.id);
      const deleteFolderSpy = jest.spyOn(storageService, 'deleteFolder').mockResolvedValue();

      await service.deleteLibrary(organizationId, library.id);

      expect(await findEntity(CustomComponentLibrary, { id: library.id } as any)).toBeNull();
      expect(await findEntity(CustomComponentLibraryRevision, { libraryId: library.id } as any)).toBeNull();
      expect(await findEntity(CustomComponentDevBundle, { libraryId: library.id } as any)).toBeNull();
      expect(deleteFolderSpy).toHaveBeenCalledWith(`${organizationId}/${library.id}`);
    });

    it('throws ConflictException listing app names when an app pins the library', async () => {
      const { organization, user } = await createUser(app, { email: `ccl-unit-pinuser-${Date.now()}@tooljet.io` });
      const library = await createLibrary(organization.id);
      const pinKey = library.correlationId.replace(/-/g, '');

      const testApp = await createApplication(app, { name: 'pinning-app-unit', user: user as any });
      const version = await createApplicationVersion(app, testApp as any);
      await updateEntity(AppVersion, version.id, {
        globalSettings: { ...version.globalSettings, customComponentLibraries: { [pinKey]: '1.0.0' } } as any,
      });

      // The global exception filter only forwards `.message` to the HTTP response (see the
      // e2e spec's equivalent test) -- `apps` only survives at this service layer, so it's
      // worth pinning here even though callers over HTTP can't see it today.
      await expect(service.deleteLibrary(organization.id, library.id)).rejects.toThrow(ConflictException);
      try {
        await service.deleteLibrary(organization.id, library.id);
      } catch (err) {
        expect(err.getResponse()).toMatchObject({ apps: ['pinning-app-unit'] });
      }
    });
  });

  describe('serveRevisionFile / serveDevFile / readBundleFile', () => {
    it('serves manifest.json from the stored jsonb, without touching disk', async () => {
      const organizationId = await org();
      const library = await createLibrary(organizationId);
      const manifest = buildManifest('FromRevision');
      const revision = await createLibraryRevision(library.id, { manifest, cssUrl: null });

      const served = await service.serveRevisionFile(library.id, revision.version, 'manifest.json');
      expect(JSON.parse(served.data.toString())).toEqual(manifest);
      expect(served.contentType).toBe('application/json');
    });

    it('throws NotFoundException for index.css when the revision has none', async () => {
      const organizationId = await org();
      const library = await createLibrary(organizationId);
      const revision = await createLibraryRevision(library.id, { cssUrl: null });

      await expect(service.serveRevisionFile(library.id, revision.version, 'index.css')).rejects.toThrow(
        NotFoundException
      );
    });

    it('throws NotFoundException for an unknown file name', async () => {
      const organizationId = await org();
      const library = await createLibrary(organizationId);
      const revision = await createLibraryRevision(library.id);

      await expect(service.serveRevisionFile(library.id, revision.version, 'index.html')).rejects.toThrow(
        NotFoundException
      );
    });

    it('throws NotFoundException when no dev bundle exists for the user', async () => {
      const organizationId = await org();
      const library = await createLibrary(organizationId);
      await expect(
        service.serveDevFile(library.id, '00000000-0000-0000-0000-000000000000', 'index.js')
      ).rejects.toThrow(NotFoundException);
    });
  });
});
