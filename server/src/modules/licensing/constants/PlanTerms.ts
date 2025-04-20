import { LICENSE_LIMIT, LICENSE_FIELD } from '@modules/licensing/constants';
import { Terms } from '@modules/licensing/interfaces/terms';

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
    table: LICENSE_LIMIT.UNLIMITED,
  },
  features: {
    auditLogs: false,
    oidc: false,
    saml: false,
    customStyling: false,
    ldap: false,
    whiteLabelling: false,
    multiEnvironment: false,
    multiPlayerEdit: false,
    gitSync: false,
    comments: false,
    customThemes: false,
    ai: true,
    externalApi: false,
  },
  domains: [],
  workflows: {
    execution_timeout: 60,
    workspace: {
      total: 200,
      daily_executions: 500,
      monthly_executions: 10000,
    },
    instance: {
      total: 1000,
      daily_executions: 25000,
      monthly_executions: 50000,
    },
  },
  auditLogs: {
    maximumDays: 0,
  },
};

export const BASIC_PLAN_SETTINGS = {
  ALLOW_PERSONAL_WORKSPACE: {
    value: 'false',
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
  ENABLE_COMMENTS: {
    value: 'false',
  },
};

export const BUSINESS_PLAN_TERMS = {
  auditLogs: {
    maximumDays: 14,
  },
};

export const ENTERPRISE_PLAN_TERMS = {
  auditLogs: {
    maximumDays: 30,
  },
};
