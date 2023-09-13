import { LICENSE_LIMIT } from 'src/helpers/license.helper';
import { Terms } from '../types';

export const BASIC_PLAN_TERMS: Partial<Terms> = {
  apps: LICENSE_LIMIT.UNLIMITED,
  workspaces: LICENSE_LIMIT.UNLIMITED,
  users: {
    total: LICENSE_LIMIT.UNLIMITED,
    editor: LICENSE_LIMIT.UNLIMITED,
    viewer: LICENSE_LIMIT.UNLIMITED,
    superadmin: 1,
  },
  database: {
    table: 5,
  },
  features: {
    auditLogs: false,
    oidc: false,
    customStyling: false,
    ldap: false,
    multiEnvironment: false,
    multiPlayerEdit: false,
  },
  domains: [],
};

export const BASIC_PLAN_SETTINGS = {
  ALLOW_PERSONAL_WORKSPACE: 'true',
  ENABLE_MULTIPLAYER_EDITING: 'false',
};
