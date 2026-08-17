/*
 * A workflows-kind query stores its target in data_queries.options. Most rows hold camelCase
 * keys, but legacy rows (the historical run-persist casing bug) and some imported / git-synced
 * apps hold them snake_cased -- see
 * frontend/src/AppBuilder/_stores/utils/appDataCaseConversion.ts:98-110.
 *
 * The frontend heals those on read but never writes back, so the stored form stays snake
 * indefinitely. Read through this helper; always write camelCase.
 */
export interface WorkflowQueryRefs {
  workflowId?: string;
  workflowName?: string;
  workflowVersionId?: string;
  workflowVersionName?: string;
}

export function readWorkflowQueryRefs(options: Record<string, any>): WorkflowQueryRefs {
  const o = options ?? {};
  return {
    workflowId: o.workflowId ?? o.workflow_id,
    workflowName: o.workflowName ?? o.workflow_name,
    workflowVersionId: o.workflowVersionId ?? o.workflow_version_id,
    workflowVersionName: o.workflowVersionName ?? o.workflow_version_name,
  };
}
