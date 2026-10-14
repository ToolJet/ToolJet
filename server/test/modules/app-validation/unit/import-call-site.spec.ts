import { AppImportExportService } from '@modules/apps/services/app-import-export.service';
import { AppValidationService } from '@modules/app-validation/service';

// checkImportedAppData is the import funnel's glue: it wraps the raw app params for the
// export reader, validates each app version against the real rules, and skips nested
// modules (they import through their own import() call, or are not written at all).
describe('AppImportExportService.checkImportedAppData', () => {
  const logger = { warn: jest.fn(), error: jest.fn() } as any;
  // Only the validation service matters here; the other constructor slots are unused by
  // checkImportedAppData. Keep the count in sync with the AppImportExportService constructor.
  const service = new AppImportExportService(
    null as any,
    null as any,
    null as any,
    null as any,
    null as any,
    null as any,
    null as any,
    null as any,
    null as any,
    null as any,
    new AppValidationService(logger)
  );
  const check = (appParams: any) => (service as any).checkImportedAppData(appParams, 'front-end', 'import');

  const appParams = {
    id: 'a1',
    name: 'Orders',
    type: 'front-end',
    appVersions: [{ id: 'v1', name: 'v1', homePageId: 'p1' }],
    pages: [{ id: 'p1', name: 'Home', handle: 'home', appVersionId: 'v1' }],
    components: [
      { id: 'c1', name: 'button 1', type: 'Button', pageId: 'p1' },
      { id: 'c2', name: 'button2', type: 'Button', pageId: 'p1' },
    ],
    events: [],
    dataQueries: [],
    modules: [
      {
        appV2: {
          id: 'm1',
          name: 'Header module',
          type: 'module',
          appVersions: [{ id: 'mv1', name: 'v1', homePageId: 'mp1' }],
          pages: [{ id: 'mp1', name: 'Module', handle: 'module', appVersionId: 'mv1' }],
          components: [{ id: 'mc1', name: 'also bad name', type: 'ModuleContainer', pageId: 'mp1' }],
        },
      },
    ],
  };

  beforeEach(() => jest.clearAllMocks());

  it('reports a spaced component name from the import data, without touching the database', async () => {
    const result = await check(appParams);
    // Report mode records instead of throwing, but the problem still comes back as blocking-grade.
    expect(result.errors).toEqual([expect.objectContaining({ code: 'COMPONENT_NAME_INVALID', path: 'button 1.name' })]);
    expect(logger.warn).toHaveBeenCalled();
  });

  it('skips nested modules: each one is validated by its own import() call', async () => {
    const result = await check(appParams);
    const paths = [...result.errors, ...result.warnings].map((issue) => issue.path);
    expect(paths).not.toContain('also bad name.name');
  });

  it('accepts a clean export silently', async () => {
    const result = await check({
      ...appParams,
      components: [{ id: 'c2', name: 'button2', type: 'Button', pageId: 'p1' }],
      modules: [],
    });
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(logger.warn).not.toHaveBeenCalled();
  });
});
