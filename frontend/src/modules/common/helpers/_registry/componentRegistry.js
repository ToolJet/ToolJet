import * as eeWorkflows from '@ee/modules/Workflows';
import * as eeInstanceSettings from '@ee/modules/InstanceSettings';
import * as eeWorkspaceSettings from '@ee/modules/WorkspaceSettings';

export const componentRegistry = {
  ee: {
    InstanceSettings: eeInstanceSettings,
    Workflows: eeWorkflows,
    WorkspaceSettings: eeWorkspaceSettings,
  },
  cloud: {
    WorkspaceSettings: eeWorkspaceSettings,
  },
};
