import { FEATURE_KEY } from '.';
import { MODULES } from '@modules/app/constants/modules';
import { FeaturesConfig } from '../types';
import { LICENSE_FIELD } from '@modules/licensing/constants';

export const FEATURES: FeaturesConfig = {
  [MODULES.ORGANIZATIONS]: {
    [FEATURE_KEY.CHECK_UNIQUE]: {},
    [FEATURE_KEY.GET]: {
      isPublic: true,
    },
    [FEATURE_KEY.WORKSPACE_ARCHIVE]: {
      auditLogsKey: 'WORKSPACE_ARCHIVE',
    },
    [FEATURE_KEY.WORKSPACE_UNARCHIVE]: {
      auditLogsKey: 'WORKSPACE_UNARCHIVE',
    },
    [FEATURE_KEY.UPDATE]: {
      auditLogsKey: 'WORKSPACE_UPDATE',
    },
    [FEATURE_KEY.CREATE]: {
      auditLogsKey: 'WORKSPACE_CREATE',
    },
    [FEATURE_KEY.CHECK_UNIQUE_ONBOARDING]: {
      isPublic: true,
    },
    [FEATURE_KEY.SET_DEFAULT]: {},
    [FEATURE_KEY.CREATE_WORKSPACE_V2]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      skipAuditLogs: true,
      audit: { action: 'workspace.created', target: { type: 'workspace', id: 'response.id' } },
    },
    [FEATURE_KEY.LIST_WORKSPACES_V2]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      skipAuditLogs: true,
      audit: { skip: 'read' },
    },
    [FEATURE_KEY.GET_WORKSPACE_V2]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      skipAuditLogs: true,
      audit: { skip: 'read' },
    },
    [FEATURE_KEY.UPDATE_WORKSPACE_V2]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      skipAuditLogs: true,
      audit: { action: 'workspace.updated', target: { type: 'workspace', id: 'params.workspaceIdentifier' } },
    },
    [FEATURE_KEY.ARCHIVE_WORKSPACE_V2]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      skipAuditLogs: true,
      audit: {
        action: 'workspace.archived',
        target: { type: 'workspace', id: 'params.workspaceIdentifier' },
        after: 'reload',
      },
    },
    [FEATURE_KEY.UNARCHIVE_WORKSPACE_V2]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      skipAuditLogs: true,
      audit: {
        action: 'workspace.unarchived',
        target: { type: 'workspace', id: 'params.workspaceIdentifier' },
        after: 'reload',
      },
    },
    [FEATURE_KEY.SET_DEFAULT_WORKSPACE_V2]: {
      license: LICENSE_FIELD.EXTERNAL_API,
      skipAuditLogs: true,
      audit: {
        action: 'workspace.default_set',
        target: { type: 'workspace', id: 'params.workspaceIdentifier' },
        after: 'reload',
      },
    },
  },
};
