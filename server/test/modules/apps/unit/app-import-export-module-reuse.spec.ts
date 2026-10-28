import { AppImportExportService } from 'src/modules/apps/services/app-import-export.service';
import { APP_TYPES } from 'src/modules/apps/constants';
import { App } from 'src/entities/app.entity';

// Unit-level: exercises only mapModulesForAppImport's existing-module lookup.
// The App query builder emulates the DB: it honours an `app.type` filter if one is applied,
// so a same-named front-end app is returned only when the lookup forgets to filter by type.
// `import` is stubbed so the create-new branch is observable.

const user: any = { organizationId: 'org-1' };

const importedModule = {
  appV2: { id: 'imp-app', co_relation_id: 'imp-corel', name: 'Orders', type: APP_TYPES.MODULE, appVersions: [] },
};

function build(workspaceApps: { id: string; co_relation_id: string; name: string; type: APP_TYPES }[]) {
  const appQb: any = { typeFilter: undefined };
  appQb.where = jest.fn().mockReturnValue(appQb);
  appQb.andWhere = jest.fn((clause: any, params: any) => {
    if (clause === 'app.type = :appType') appQb.typeFilter = params.appType;
    return appQb;
  });
  appQb.distinct = jest.fn().mockReturnValue(appQb);
  appQb.getMany = jest.fn(async () =>
    workspaceApps.filter((a) => a.name === 'Orders' && (!appQb.typeFilter || a.type === appQb.typeFilter))
  );

  const versionQb: any = {};
  versionQb.select = jest.fn().mockReturnValue(versionQb);
  versionQb.where = jest.fn((_clause: string, { appIds }: any) => {
    versionQb.appIds = appIds;
    return versionQb;
  });
  versionQb.andWhere = jest.fn().mockReturnValue(versionQb);
  versionQb.getRawMany = jest.fn(async () =>
    workspaceApps.filter((a) => versionQb.appIds.includes(a.id)).map((a) => ({ app_id: a.id, app_name: a.name }))
  );

  const manager: any = {
    createQueryBuilder: jest.fn((entity: any) => (entity === App ? appQb : versionQb)),
    find: jest.fn().mockResolvedValue([]),
  };

  const service: any = Object.create(AppImportExportService.prototype);
  service.gitSyncConfigsUtilService = { getDetails: jest.fn().mockResolvedValue({ options: {} }) };
  service.abilityService = { resourceActionsPermission: jest.fn().mockResolvedValue({ isAdmin: true }) };
  service.import = jest.fn().mockResolvedValue({
    newApp: { id: 'new-app', co_relation_id: 'new-corel' },
    resourceMapping: { appVersionMapping: {} },
  });
  return { service, manager };
}

const run = (service: any, manager: any) =>
  service.mapModulesForAppImport(
    manager,
    { type: APP_TYPES.FRONT_END, modules: [importedModule] },
    user,
    {},
    false,
    '3.0.0'
  );

describe('AppImportExportService.mapModulesForAppImport — existing-module lookup', () => {
  it('does not reuse a same-named front-end app; imports the module fresh', async () => {
    const { service, manager } = build([
      { id: 'fe-app', co_relation_id: 'fe-corel', name: 'Orders', type: APP_TYPES.FRONT_END },
    ]);

    const mappings = await run(service, manager);

    expect(service.import).toHaveBeenCalledTimes(1);
    expect(mappings.moduleApps).toEqual({ 'imp-corel': 'new-corel', 'imp-app': 'new-corel' });
  });

  it('reuses the same-named module when a front-end app also has that name', async () => {
    const { service, manager } = build([
      { id: 'fe-app', co_relation_id: 'fe-corel', name: 'Orders', type: APP_TYPES.FRONT_END },
      { id: 'mod-app', co_relation_id: 'mod-corel', name: 'Orders', type: APP_TYPES.MODULE },
    ]);

    const mappings = await run(service, manager);

    expect(service.import).not.toHaveBeenCalled();
    expect(mappings.moduleApps).toEqual({ 'imp-corel': 'mod-corel', 'imp-app': 'mod-corel' });
  });
});
