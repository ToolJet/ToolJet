import { WORKFLOW_TRIGGER_TYPE, WorkflowTriggerType } from '../types';

// Editor runs pin a version with no saved query (manual); a saved query means an app called it.
export const triggerRouteType = ({
  executeUsing,
  hasSavedQuery,
}: {
  executeUsing?: string;
  hasSavedQuery: boolean;
}): WorkflowTriggerType =>
  executeUsing === 'version' && !hasSavedQuery ? WORKFLOW_TRIGGER_TYPE.MANUAL : WORKFLOW_TRIGGER_TYPE.APP;
