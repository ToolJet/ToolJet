export const workspaceSettingsLinks = [
  { id: 'users', name: 'Users', route: 'users', conditions: ['admin'] },
  { id: 'groups', name: 'Groups', route: 'groups', conditions: ['admin'] },
  { id: 'workspacelogin', name: 'Workspace login', route: 'workspace-login', conditions: ['admin', 'wsLoginEnabled'] },
  { id: 'workspace-variables', name: 'Workspace variables', route: 'workspace-variables', conditions: ['admin'] },
  { id: 'copilot', name: 'Copilot', route: 'copilot', conditions: ['admin'] },
  { id: 'custom-styles', name: 'Custom styles', route: 'custom-styles', conditions: ['admin'] },
  { id: 'configure-git', name: 'Configure Git', route: 'configure-git', conditions: ['admin'] },
];
