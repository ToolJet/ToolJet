export const WORKFLOW_TABS = { LIST: 'list', APPROVALS: 'approvals', EXECUTIONS: 'executions' } as const;
export type TWorkflowTab = (typeof WORKFLOW_TABS)[keyof typeof WORKFLOW_TABS];

const TAB_PATH_SUFFIX: Record<TWorkflowTab, string> = {
  list: '',
  approvals: '/approvals',
  executions: '/executions',
};

// The tab comes from the URL, so the approval email opens Approvals.
export function getWorkflowTab(pathname: string): TWorkflowTab {
  if (/\/workflows\/approvals\/?$/.test(pathname)) return WORKFLOW_TABS.APPROVALS;
  if (/\/workflows\/executions\/?$/.test(pathname)) return WORKFLOW_TABS.EXECUTIONS;
  return WORKFLOW_TABS.LIST;
}

export function getWorkflowTabPathSuffix(tab: TWorkflowTab): string {
  return TAB_PATH_SUFFIX[tab] ?? '';
}
