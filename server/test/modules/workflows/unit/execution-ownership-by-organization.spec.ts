/** @group workflows */
import { WorkflowExecutionsService } from '@ee/workflows/services/workflow-executions.service';

// validateExecutionsOwnedByOrganization is the authorization boundary behind the workspace
// executions dashboard's bulk state endpoint (workspace/states): it mixes workflows from many
// app versions, so the older validateExecutionsOwnedByAppVersion check cannot scope it. Getting
// this wrong leaks execution state across workspaces, so it is tested in isolation here rather
// than only indirectly through the controller.
describe('WorkflowExecutionsService.validateExecutionsOwnedByOrganization', () => {
  const organizationId = 'org-a';

  const makeService = (executions: Array<{ id: string; organizationId: string }>) => {
    const workflowExecutionRepository = {
      find: jest.fn().mockResolvedValue(executions),
    };

    const service = Object.create(WorkflowExecutionsService.prototype) as WorkflowExecutionsService;
    (
      service as unknown as { workflowExecutionRepository: typeof workflowExecutionRepository }
    ).workflowExecutionRepository = workflowExecutionRepository;

    return { service, workflowExecutionRepository };
  };

  it('resolves without error when every execution id belongs to the caller organization', async () => {
    const { service, workflowExecutionRepository } = makeService([
      { id: 'exec-1', organizationId },
      { id: 'exec-2', organizationId },
    ]);

    await expect(
      service.validateExecutionsOwnedByOrganization(['exec-1', 'exec-2'], organizationId)
    ).resolves.toBeUndefined();

    expect(workflowExecutionRepository.find).toHaveBeenCalledWith({
      where: { id: expect.anything() },
      select: ['id', 'organizationId'],
    });
  });

  it('throws when any requested id belongs to a different organization', async () => {
    const { service } = makeService([
      { id: 'exec-1', organizationId },
      { id: 'exec-2', organizationId: 'org-b' },
    ]);

    await expect(service.validateExecutionsOwnedByOrganization(['exec-1', 'exec-2'], organizationId)).rejects.toThrow(
      /exec-2/
    );
  });

  it('throws when a requested id does not exist at all (missing from the repository result)', async () => {
    const { service } = makeService([{ id: 'exec-1', organizationId }]);

    await expect(
      service.validateExecutionsOwnedByOrganization(['exec-1', 'exec-missing'], organizationId)
    ).rejects.toThrow(/exec-missing/);
  });

  it('returns early without querying the repository for an empty id list', async () => {
    const { service, workflowExecutionRepository } = makeService([]);

    await expect(service.validateExecutionsOwnedByOrganization([], organizationId)).resolves.toBeUndefined();

    expect(workflowExecutionRepository.find).not.toHaveBeenCalled();
  });
});
