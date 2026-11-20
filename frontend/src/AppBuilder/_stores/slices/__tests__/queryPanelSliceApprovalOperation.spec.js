import { workflowApprovalsService } from '@/_services/workflow_approvals.service';
import { createQueryPanelSlice } from '../queryPanelSlice';

const exposedValuesByModule = {
  canvas: { components: { table1: { selectedRow: { id: 'canvas-request' } } } },
  module1: { components: { table1: { selectedRow: { id: 'module-request' } } } },
};

// Stub store: resolves `{{components.table1.selectedRow.id}}` against the state it is handed.
const buildSlice = () => {
  const get = () => ({
    getAllExposedValues: (moduleId = 'canvas') => exposedValuesByModule[moduleId],
    resolveReferences: (_moduleId, options, state) => ({
      ...options,
      requestId: state.components.table1.selectedRow.id,
    }),
  });
  return createQueryPanelSlice(() => {}, get).queryPanel;
};

describe('runWorkflowApprovalOperation', () => {
  afterEach(() => jest.restoreAllMocks());

  it("resolves the query's fields against its own module, not the canvas", async () => {
    const resolveById = jest.spyOn(workflowApprovalsService, 'resolveById').mockResolvedValue({ status: 'resolved' });
    const query = {
      options: {
        operation: 'resolveRequest',
        requestId: '{{components.table1.selectedRow.id}}',
        outcome: 'approved',
      },
    };

    await buildSlice().runWorkflowApprovalOperation('module1', query, undefined);

    expect(resolveById).toHaveBeenCalledWith('module-request', 'approved', {});
  });
});
