// Each value is a () => import() thunk so webpack can split each EE module into
// its own async chunk instead of pulling all three into the main bundle.
export const componentRegistry = {
  ee: {
    InstanceSettings: () => import('@ee/modules/InstanceSettings'),
    Workflows: () => import('@ee/modules/Workflows'),
    WorkspaceSettings: () => import('@ee/modules/WorkspaceSettings'),
  },
  cloud: {
    WorkspaceSettings: () => import('@ee/modules/WorkspaceSettings'),
  },
};
