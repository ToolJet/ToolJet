import { AppImportExportService } from 'src/modules/apps/services/app-import-export.service';
import { APP_TYPES } from 'src/modules/apps/constants';

// Unit-level: exercises only mapModulesForAppImport's reuse decision.
// entityManager is stubbed so no DB; `import` is spied so the create-new branch is observable.

const user: any = { organizationId: 'org-1' };

function moduleEntry(overrides: Record<string, any> = {}) {
  return {
    appV2: {
      id: 'imp-app',
      name: 'shared-module',
      type: APP_TYPES.MODULE,
      editingVersion: { id: 'imp-ver', currentEnvironmentId: 'imp-env' },
      ...overrides,
    },
  };
}

function existingModule(overrides: Record<string, any> = {}) {
  return {
    id: 'db-app',
    name: 'shared-module',
    type: APP_TYPES.MODULE,
    editingVersion: { id: 'db-ver', currentEnvironmentId: 'db-env' },
    ...overrides,
  };
}

function build(existing: any[]) {
  const andWhere = jest.fn().mockReturnThis();
  const qb = {
    where: jest.fn().mockReturnThis(),
    andWhere,
    distinct: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(existing),
  };
  const service: any = Object.create(AppImportExportService.prototype);
  service.entityManager = { createQueryBuilder: jest.fn().mockReturnValue(qb) };
  service.abilityService = { resourceActionsPermission: jest.fn().mockResolvedValue({ isAdmin: true }) };
  service.import = jest.fn().mockResolvedValue({
    newApp: { id: 'new-app' },
    resourceMapping: {
      appVersionMapping: { 'imp-ver': 'new-ver' },
      appEnvironmentMapping: { 'imp-env': 'new-env' },
    },
  });
  return { service, andWhere };
}

const run = (service: any, modules: any[]) =>
  service.mapModulesForAppImport({ type: APP_TYPES.FRONT_END, modules }, user, {}, false, '3.0.0');

describe('AppImportExportService.mapModulesForAppImport — module reuse guard', () => {
  it('reuses an existing module when both sides are usable modules', async () => {
    const { service } = build([existingModule()]);
    const m = await run(service, [moduleEntry()]);
    expect(service.import).not.toHaveBeenCalled();
    expect(m.moduleApps).toEqual({ 'imp-app': 'db-app' });
    expect(m.moduleVersions).toEqual({ 'imp-ver': 'db-ver' });
    expect(m.moduleEnvironments).toEqual({ 'imp-env': 'db-env' });
  });

  it('only looks up apps of type module (a same-named front-end app must not match)', async () => {
    const { service, andWhere } = build([]);
    await run(service, [moduleEntry()]);
    expect(andWhere).toHaveBeenCalledWith('app.type = :appType', { appType: APP_TYPES.MODULE });
  });

  it.each([
    ['imported entry is not a module', [existingModule()], [moduleEntry({ type: APP_TYPES.FRONT_END })]],
    ['existing module has no editing version', [existingModule({ editingVersion: null })], [moduleEntry()]],
    [
      'existing module version has no environment',
      [existingModule({ editingVersion: { id: 'db-ver', currentEnvironmentId: null } })],
      [moduleEntry()],
    ],
    [
      'imported module version has no environment',
      [existingModule()],
      [moduleEntry({ editingVersion: { id: 'imp-ver', currentEnvironmentId: null } })],
    ],
    ['no existing module with that name', [], [moduleEntry()]],
  ])('imports a fresh module when %s', async (_label, existing, modules) => {
    const { service } = build(existing);
    const m = await run(service, modules);
    expect(service.import).toHaveBeenCalledTimes(1);
    expect(m.moduleApps).toEqual({ 'imp-app': 'new-app' });
  });
});
