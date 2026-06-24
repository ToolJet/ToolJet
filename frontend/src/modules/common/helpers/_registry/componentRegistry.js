import * as eeWorkflows from '@ee/modules/Workflows';
import * as eeWorkspaceSettings from '@ee/modules/WorkspaceSettings';

export const componentRegistry = {
  ee: {
    Workflows: eeWorkflows,
    WorkspaceSettings: eeWorkspaceSettings,
  },
  cloud: {
    WorkspaceSettings: eeWorkspaceSettings,
  },
};
