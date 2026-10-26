/**
 * The component library (ToolJet UI 1.0, a pack or another library) is saved on every app at creation:
 * - a new app (blank, from a prompt, a module) gets Rocket 2.0 ('pack:shadcn'), pinned to the built-in pack when the
 *   server ships it;
 * - an imported, cloned or template app keeps its source's saved library, or the one its widgets imply;
 * - an import into an existing app (the AI flow) keeps that app's library.
 * Only apps from before the setting stay unsaved.
 */
jest.mock('../../../../src/helpers/database.helper', () => ({
  dbTransactionWrap: jest.fn().mockImplementation(async (cb: (manager: any) => Promise<any>, manager?: any) => cb(manager)),
  catchDbException: jest.fn().mockImplementation(async (cb: () => Promise<any>) => cb()),
}));

import { AppsUtilService } from '../../../../src/modules/apps/util.service';
import { AppImportExportService } from '../../../../src/modules/apps/services/app-import-export.service';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  componentLibraryFor,
  definitionComponentTypes,
  newAppLibrarySettings,
  versionComponentTypes,
} from '../../../../src/helpers/component_library.helper';

function makeManager(organization = { appEnvironments: [{ id: 'env-1', isDefault: true, priority: 1 }] }) {
  const saved: any[] = [];
  return {
    saved,
    create: jest.fn((_entity: unknown, data: any) => ({ id: `id-${saved.length + 1}`, ...data })),
    save: jest.fn(async (entity: any) => {
      saved.push(entity);
      return entity;
    }),
    findOne: jest.fn(async () => organization),
  };
}

describe('component library helper', () => {
  it('prefers the saved library, then Shad* widgets, then UI 1.0', () => {
    expect(componentLibraryFor({ componentLibrary: 'ui1' }, ['ShadButton'])).toBe('ui1');
    expect(componentLibraryFor({}, ['Text', 'ShadStat'])).toBe('ui2');
    expect(componentLibraryFor(null, ['Table', 'Shadow'])).toBe('ui1');
  });

  it('reads the component types of one version and of a legacy definition', () => {
    const pages = [
      { id: 'p1', appVersionId: 'v1' },
      { id: 'p2', appVersionId: 'v2' },
    ];
    const components = [
      { pageId: 'p1', type: 'Table' },
      { pageId: 'p2', type: 'ShadCard' },
    ];
    expect(versionComponentTypes('v1', pages, components)).toEqual(['Table']);
    expect(definitionComponentTypes({ pages: { p: { components: { c: { component: { component: 'ShadBadge' } } } } } })).toEqual([
      'ShadBadge',
    ]);
  });
});

describe('a new app', () => {
  it('is created on Rocket 2.0', async () => {
    const manager = makeManager();
    const service = new AppsUtilService(
      {} as any,
      { get: jest.fn(async () => ({ id: 'env-1' })) } as any,
      { createOne: jest.fn(async () => ({ id: 'version-1' })) } as any,
      {} as any,
      {} as any,
      {} as any
    );
    await service.create('Blank', { id: 'u1', organizationId: 'o1' } as any, 'front-end' as any, false, manager as any);
    const version = manager.saved.find((entity) => entity.globalSettings);
    expect(version.globalSettings).toMatchObject({ componentLibrary: 'pack:shadcn' });
  });

  it('pins the built-in shadcn pack the server ships', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'builtin-packs-'));
    fs.mkdirSync(path.join(dir, 'shadcn'));
    fs.writeFileSync(
      path.join(dir, 'shadcn', 'pack.json'),
      JSON.stringify({ pack: 'shadcn', correlationId: '30c2ae01-c2c0-4a96-bca0-4c9f1247c8f9', version: '2.1.29' })
    );
    const previous = process.env.BUILTIN_PACKS_PATH;
    process.env.BUILTIN_PACKS_PATH = dir;
    try {
      expect(newAppLibrarySettings()).toEqual({
        componentLibrary: 'pack:shadcn',
        customComponentLibraries: { '30c2ae01c2c04a96bca04c9f1247c8f9': '2.1.29' },
      });
      process.env.BUILTIN_PACKS_PATH = path.join(dir, 'missing');
      expect(newAppLibrarySettings()).toEqual({ componentLibrary: 'pack:shadcn' });
    } finally {
      if (previous === undefined) delete process.env.BUILTIN_PACKS_PATH;
      else process.env.BUILTIN_PACKS_PATH = previous;
    }
  });
});

describe('an imported, cloned or template app', () => {
  const service = Object.create(AppImportExportService.prototype) as AppImportExportService;
  const user = { organizationId: 'o1' } as any;
  const mappings = () => ({ appVersionMapping: {}, appDefaultEnvironmentMapping: {} }) as any;
  const savedLibrary = (manager: ReturnType<typeof makeManager>) =>
    manager.saved.find((entity) => entity.globalSettings)?.globalSettings?.componentLibrary;

  it('keeps the source app saved library', async () => {
    const manager = makeManager();
    const versions = [{ id: 'v1', name: 'v1', globalSettings: { appMode: 'light', componentLibrary: 'ui1' } }] as any;
    const pages = [{ id: 'p1', appVersionId: 'v1' }];
    const components = [{ pageId: 'p1', type: 'ShadButton' }];
    await service.createAppVersionsForImportedApp(manager as any, user, { id: 'a1' } as any, versions, mappings(), true, false, pages, components);
    expect(savedLibrary(manager)).toBe('ui1');
  });

  it('saves the library a source without the setting implies (a template or an old app)', async () => {
    for (const [type, expected] of [
      ['ShadKanban', 'ui2'],
      ['Table', 'ui1'],
    ]) {
      const manager = makeManager();
      const versions = [{ id: 'v1', name: 'v1', globalSettings: { appMode: 'light' } }] as any;
      await service.createAppVersionsForImportedApp(manager as any, user, { id: 'a1' } as any, versions, mappings(), true, false,
        [{ id: 'p1', appVersionId: 'v1' }], [{ pageId: 'p1', type }]);
      expect(savedLibrary(manager)).toBe(expected);
    }
  });

  it('reads a legacy definition when the export is not normalized', async () => {
    const manager = makeManager();
    const definition = { globalSettings: { appMode: 'light' }, pages: { p: { components: { c: { component: { component: 'ShadStat' } } } } } };
    await service.createAppVersionsForImportedApp(manager as any, user, { id: 'a1' } as any, [{ id: 'v1', name: 'v1', definition }] as any, mappings(), false, false);
    expect(savedLibrary(manager)).toBe('ui2');
  });

  it('keeps an existing app library when an import lands in it (the AI flow)', async () => {
    const manager = makeManager();
    const editingVersion = { id: 'existing', globalSettings: { componentLibrary: 'ui2', appMode: 'light' } };
    await service.createAppVersionsForImportedApp(manager as any, user, { id: 'a1', editingVersion } as any,
      [{ id: 'v1', name: 'v1', globalSettings: { appMode: 'dark' } }] as any, mappings(), true, false,
      [{ id: 'p1', appVersionId: 'v1' }], [{ pageId: 'p1', type: 'Table' }]);
    expect(savedLibrary(manager)).toBe('ui2');
  });
});
