/**
 * Export resources — workspace scoping
 *
 * Regression for the cross-workspace ToolJet-DB export IDOR: the /export endpoint trusted
 * `organization_id` from the request body, so a member of one workspace could export another
 * workspace's TJDB table schema. The controller now resolves the export workspace from the
 * authenticated session, overriding whatever the body carries.
 *
 * @group platform
 */
import { ImportExportResourcesController } from 'src/modules/import-export-resources/controller';

describe('ImportExportResourcesController.export — workspace scoping', () => {
  function setup() {
    const service = { export: jest.fn().mockResolvedValue({ tooljet_database: [] }) };
    const controller = new ImportExportResourcesController(service as any);
    return { controller, service };
  }

  it('overrides a foreign body organization_id with the session workspace', async () => {
    const { controller, service } = setup();
    const user = { id: 'u1', organizationId: 'org-mine', branchId: 'branch-1' } as any;

    await controller.export(user, {
      organization_id: 'org-victim',
      tooljet_database: [{ table_id: 'victim-table' }],
    } as any);

    expect(service.export).toHaveBeenCalledTimes(1);
    const [, passedDto, passedBranchId] = service.export.mock.calls[0];
    expect(passedDto.organization_id).toBe('org-mine');
    expect(passedBranchId).toBe('branch-1');
  });

  it('is a no-op when the body already names the session workspace', async () => {
    const { controller, service } = setup();
    const user = { id: 'u1', organizationId: 'org-mine', branchId: undefined } as any;

    await controller.export(user, { organization_id: 'org-mine', app: [{ id: 'app-1' }] } as any);

    expect(service.export.mock.calls[0][1].organization_id).toBe('org-mine');
  });
});
