// DEPRECATED: This file used static imports causing all EE modules to be bundled.
//
// If you need to load edition-specific components, use:
// - withEditionSpecificComponent() for React components
// - getEditionSpecificSlice() for store slices
// - getEditionSpecificHelper() for helper modules
//
// These use dynamic imports and load only what's needed.
//
// This file is kept temporarily for reference and will be removed
// after confirming no legacy code depends on it.

/*
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
*/

export const componentRegistry = {
  ee: {},
  cloud: {},
};
