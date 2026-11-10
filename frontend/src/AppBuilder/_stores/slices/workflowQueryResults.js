const waitingResult = ({ executionId, requestId }) => ({
  data: { executionStatus: 'waiting', executionId, requestId },
});

export const syncWorkflowOutcome = (payload) => {
  if (payload?.executionStatus === 'completed') {
    return { ok: true, result: { data: payload.data, metadata: payload.metadata } };
  }
  if (payload?.executionStatus === 'waiting') {
    return { ok: true, result: waitingResult(payload) };
  }
  return { ok: false };
};

export const classifyWorkflowEvent = (eventData) => {
  switch (eventData?.type) {
    case 'workflow_connection_close':
      return { status: 'CLOSE', data: eventData };
    case 'workflow_execution_completed':
    case 'workflow_execution_waiting':
      return { status: 'COMPLETE', result: eventData.result, data: eventData };
    case 'workflow_execution_error':
      return { status: 'ERROR', data: eventData };
    case 'workflow_execution_cancelled':
      return { status: 'CANCELLED', data: eventData };
    default:
      return { status: 'PROGRESS', data: eventData };
  }
};
