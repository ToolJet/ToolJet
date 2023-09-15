import { LICENSE_LIMIT, LICENSE_FIELD } from 'src/helpers/license.helper';
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
    whiteLabelling: false,
    multiEnvironment: false,
    multiPlayerEdit: false,
  },
  domains: [],
};

export const BASIC_PLAN_SETTINGS = {
  ALLOW_PERSONAL_WORKSPACE: {
    value: 'true',
  },
  WHITE_LABEL_LOGO: {
    value: '',
    feature: LICENSE_FIELD.WHITE_LABEL,
  },
  WHITE_LABEL_TEXT: {
    value: '',
    feature: LICENSE_FIELD.WHITE_LABEL,
  },
  WHITE_LABEL_FAVICON: {
    value: '',
    feature: LICENSE_FIELD.WHITE_LABEL,
  },
  ENABLE_MULTIPLAYER_EDITING: {
    value: 'false',
  },
};
