export const WORKFLOW_TABS = { LIST: 'list', APPROVALS: 'approvals', EXECUTIONS: 'executions' } as const;
export type TWorkflowTab = (typeof WORKFLOW_TABS)[keyof typeof WORKFLOW_TABS];

const TAB_PATH_SUFFIX: Record<TWorkflowTab, string> = {
  list: '',
  approvals: '/approvals',
  executions: '/executions',
};

// The workflows dashboard tab comes from the URL, so links like the approval email open the right tab.
export function getWorkflowTab(pathname: string): TWorkflowTab {
  if (/\/workflows\/approvals\/?$/.test(pathname)) return WORKFLOW_TABS.APPROVALS;
  if (/\/workflows\/executions\/?$/.test(pathname)) return WORKFLOW_TABS.EXECUTIONS;
  return WORKFLOW_TABS.LIST;
}

// Appended to the workflows route, e.g. `/approvals`.
export function getWorkflowTabPathSuffix(tab: TWorkflowTab): string {
  return TAB_PATH_SUFFIX[tab] ?? '';
}
