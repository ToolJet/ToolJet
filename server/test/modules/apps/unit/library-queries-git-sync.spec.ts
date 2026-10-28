/**
 * The query library is not synced to git: an app pushed to git must not carry the library queries it uses, and a
 * git pull must not write into the library. The file export, import and clone keep bundling them.
 */
jest.mock('@modules/request-context/service', () => ({ RequestContext: { setLocals: jest.fn() } }));
const STOP = new Error('stop here');
const manager = new Proxy({} as Record<string, unknown>, {
  get: (_target, prop) => {
    if (prop === 'then') return undefined;
    // Every query-builder call chains; reads resolve empty.
    const qb: unknown = new Proxy(() => qb, {
      get: (_t, p) =>
        p === 'then' ? undefined : ['getMany', 'getRawMany'].includes(String(p)) ? async () => [] : () => qb,
      apply: () => qb,
    });
    return () => qb;
  },
});
jest.mock('src/helpers/database.helper', () => ({
  dbTransactionWrap: (fn: (m: unknown) => unknown) => fn(manager),
}));
jest.mock('@modules/data-queries/library/library-export.util', () => ({
  ...jest.requireActual('@modules/data-queries/library/library-export.util'),
  collectLibraryExport: jest.fn(async () => []),
  // Called right after the library decision; stopping here keeps the rest of the export out of the test.
  findLibraryExportDataSources: jest.fn(async () => {
    throw STOP;
  }),
}));

import { AppImportExportService } from '@modules/apps/services/app-import-export.service';
import { ImportExportResourcesService } from '@modules/import-export-resources/service';
import { collectLibraryExport } from '@modules/data-queries/library/library-export.util';
import { APP_TYPES } from '@modules/apps/constants';

const user = { id: 'u1', organizationId: 'org-1' } as never;

describe('AppImportExportService.export — library queries and git', () => {
  const exporter = () => {
    const svc = Object.create(AppImportExportService.prototype) as AppImportExportService;
    Object.assign(svc, {
      appsRepository: {
        findById: jest.fn(async () => ({ id: 'app-1', organizationId: 'org-1', type: APP_TYPES.FRONT_END })),
      },
    });
    return svc;
  };

  beforeEach(() => jest.clearAllMocks());

  it('collects library queries for a file export', async () => {
    await expect(exporter().export(user, 'app-1', { version_id: 'v1' })).rejects.toBe(STOP);
    expect(collectLibraryExport).toHaveBeenCalledTimes(1);
  });

  it('skips library queries for a git export', async () => {
    await expect(
      exporter().export(user, 'app-1', { version_id: 'v1' }, undefined, { withLibraryQueries: false })
    ).rejects.toBe(STOP);
    expect(collectLibraryExport).not.toHaveBeenCalled();
  });
});

describe('ImportExportResourcesService.export — git flag', () => {
  const build = () => {
    const appExport = jest.fn(async () => ({ appV2: { id: 'app-1' } }));
    const service = new ImportExportResourcesService(
      { export: appExport } as never,
      { export: jest.fn() } as never,
      { manager: { find: jest.fn(async () => []) } } as never,
      { findOne: jest.fn(async () => ({ id: 'app-1', name: 'App' })) } as never
    );
    return { service, appExport };
  };
  const dto = { organization_id: 'org-1', app: [{ id: 'app-1', search_params: {} }] } as never;

  it('asks for library queries by default', async () => {
    const { service, appExport } = build();
    await service.export(user, dto, 'branch-1');
    expect(appExport).toHaveBeenCalledWith(user, 'app-1', {}, 'branch-1', { withLibraryQueries: true });
  });

  it('leaves library queries out for git', async () => {
    const { service, appExport } = build();
    await service.export(user, dto, 'branch-1', { forGit: true });
    expect(appExport).toHaveBeenCalledWith(user, 'app-1', {}, 'branch-1', { withLibraryQueries: false });
  });
});

describe('AppImportExportService.import — library queries and git', () => {
  const importer = () => {
    const svc = Object.create(AppImportExportService.prototype) as AppImportExportService;
    const importLibraryQueries = jest.fn(async () => ({ queries: {}, versions: {}, skipped: [] }));
    Object.assign(svc, {
      mapModulesForAppImport: jest.fn(async () => ({})),
      createImportedAppForUser: jest.fn(async () => ({ id: 'new-app' })),
      setupImportedAppAssociations: jest.fn(async () => ({ appVersionMapping: {} })),
      updateEntityReferencesForImportedApp: jest.fn(async () => undefined),
      remapCustomComponentLibraries: jest.fn(async () => undefined),
      importLibraryQueries,
      // The step after the library import; stopping here keeps the rest of the import out of the test.
      extractImportDataFromAppParams: jest.fn(() => {
        throw STOP;
      }),
    });
    return { svc, importLibraryQueries };
  };
  const params = {
    appV2: { name: 'App', schemaDetails: { multiPages: true }, libraryQueries: [{ id: 'lq-1' }] },
  };

  it('imports library queries from a file', async () => {
    const { svc, importLibraryQueries } = importer();
    await expect(svc.import(user, params, 'App', {}, false)).rejects.toBe(STOP);
    expect(importLibraryQueries).toHaveBeenCalledTimes(1);
  });

  it('ignores library queries in a git pull', async () => {
    const { svc, importLibraryQueries } = importer();
    await expect(svc.import(user, params, 'App', {}, true)).rejects.toBe(STOP);
    expect(importLibraryQueries).not.toHaveBeenCalled();
  });
});
