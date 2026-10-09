import { resolveAllWorkflowRefsForVersion } from '@modules/versions/workflow-ref.util';

describe('resolveAllWorkflowRefsForVersion', () => {
  const organizationId = 'org-1';
  const parentVersionId = 'version-1';

  const makeManager = (dataQueryRows: any[], appRows: any[]) => {
    const query = jest
      .fn()
      .mockImplementationOnce(async () => dataQueryRows)
      .mockImplementationOnce(async () => appRows);
    return { query } as any;
  };

  it('returns [] when the version has no workflow-kind data queries', async () => {
    const manager = makeManager([], []);
    const refs = await resolveAllWorkflowRefsForVersion(manager, parentVersionId, organizationId, null);
    expect(refs).toEqual([]);
    expect(manager.query).toHaveBeenCalledTimes(1);
  });

  it('resolves a workflowId that is currently the target App PK (pre-B9) to its co_relation_id', async () => {
    const manager = makeManager(
      [{ dataQueryId: 'dq-1', options: { workflowId: 'app-pk-1' } }],
      [{ id: 'app-pk-1', coRel: 'co-rel-1' }]
    );
    const refs = await resolveAllWorkflowRefsForVersion(manager, parentVersionId, organizationId, null);
    expect(refs).toEqual([{ dataQueryId: 'dq-1', workflowCoRel: 'co-rel-1' }]);
  });

  it('resolves a workflowId that is already a co_relation_id (post-B9) unchanged', async () => {
    const manager = makeManager(
      [{ dataQueryId: 'dq-1', options: { workflowId: 'co-rel-1' } }],
      [{ id: 'app-pk-1', coRel: 'co-rel-1' }]
    );
    const refs = await resolveAllWorkflowRefsForVersion(manager, parentVersionId, organizationId, null);
    expect(refs).toEqual([{ dataQueryId: 'dq-1', workflowCoRel: 'co-rel-1' }]);
  });

  it('reads legacy snake_case workflow_id via readWorkflowQueryRefs', async () => {
    const manager = makeManager(
      [{ dataQueryId: 'dq-1', options: { workflow_id: 'app-pk-1' } }],
      [{ id: 'app-pk-1', coRel: 'co-rel-1' }]
    );
    const refs = await resolveAllWorkflowRefsForVersion(manager, parentVersionId, organizationId, null);
    expect(refs).toEqual([{ dataQueryId: 'dq-1', workflowCoRel: 'co-rel-1' }]);
  });

  it('drops a reference whose target workflow does not exist in this workspace', async () => {
    const manager = makeManager([{ dataQueryId: 'dq-1', options: { workflowId: 'nonexistent' } }], []);
    const refs = await resolveAllWorkflowRefsForVersion(manager, parentVersionId, organizationId, null);
    expect(refs).toEqual([]);
  });

  it('dedupes multiple data queries pointing at the same workflow', async () => {
    const manager = makeManager(
      [
        { dataQueryId: 'dq-1', options: { workflowId: 'app-pk-1' } },
        { dataQueryId: 'dq-2', options: { workflowId: 'app-pk-1' } },
      ],
      [{ id: 'app-pk-1', coRel: 'co-rel-1' }]
    );
    const refs = await resolveAllWorkflowRefsForVersion(manager, parentVersionId, organizationId, null);
    expect(refs).toEqual([
      { dataQueryId: 'dq-1', workflowCoRel: 'co-rel-1' },
      { dataQueryId: 'dq-2', workflowCoRel: 'co-rel-1' },
    ]);
  });
});
