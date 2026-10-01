/** @group workflows */
import { WorkflowExecutionsService } from '@ee/workflows/services/workflow-executions.service';

describe('WorkflowExecutionsService | Response node logs', () => {
  it('records a node-level success log', async () => {
    const service = Object.create(WorkflowExecutionsService.prototype) as WorkflowExecutionsService;
    jest.spyOn(service, 'buildResponseNodeMetadata').mockResolvedValue({
      status: 'ok',
      request: {},
      response: { statusCode: 200 },
    });
    jest.spyOn(service, 'completeNodeExecution').mockResolvedValue(undefined);
    const addLog = jest.fn();

    await service.processResponseNode(
      {
        id: 'execution-node-1',
        definition: { nodeName: 'response1', code: 'return { ok: true };', statusCode: { value: '200' } },
      } as any,
      {},
      addLog
    );

    expect(addLog).toHaveBeenCalledWith('Execution succeeded', 'response1', 'success');
  });
});
