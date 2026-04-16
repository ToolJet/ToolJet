// Each entry is a () => import() thunk so webpack splits each EE module into its
// own async chunk, loaded only when the component that needs it first renders.
// Previously `import * as eeModules from '@ee/modules'` forced the entire EE tree
// into one synchronous chunk (~38 MiB source map, breaks CF Pages 25 MiB limit).
// TODO: CE modules (@/modules) are not yet lazy-loaded — the CE fallback path in
// withEditionSpecificComponent renders BaseComponent directly, so this is low priority.
export const EE_MODULE_LOADERS = {
  Appbuilder: () => import('@ee/modules/Appbuilder'),
  WorkspaceSettings: () => import('@ee/modules/WorkspaceSettings'),
  Dashboard: () => import('@ee/modules/Dashboard'),
  AiBuilder: () => import('@ee/modules/AiBuilder'),
  AppHistory: () => import('@ee/modules/AppHistory'),
  AuditLogs: () => import('@ee/modules/AuditLogs'),
  DataSources: () => import('@ee/modules/DataSources'),
  auth: () => import('@ee/modules/auth'),
  common: () => import('@ee/modules/common'),
  Modules: () => import('@ee/modules/Modules'),
  RenderWorkflow: () => import('@ee/modules/RenderWorkflow'),
  onboarding: () => import('@ee/modules/onboarding'),
};
