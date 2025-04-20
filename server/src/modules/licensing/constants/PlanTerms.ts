import { LICENSE_LIMIT, LICENSE_FIELD } from '@modules/licensing/constants';
import { Terms } from '@modules/licensing/interfaces/terms';

export const BASIC_PLAN_TERMS: Partial<Terms> = {
  apps: 2,
  workspaces: 1,
  users: {
    total: 52,
    editor: 2,
    viewer: 50,
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
  },
  domains: [],
  workflows: {
    execution_timeout: 60,
    workspace: {
      total: 2,
      daily_executions: 500,
      monthly_executions: 10000,
    },
    instance: {
      total: 2,
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

export const WORKFLOW_TEAM_PLAN_TERMS: Partial<Terms> = {
  workflows: {
    execution_timeout: 60,
    instance: {
      total: LICENSE_LIMIT.UNLIMITED,
      daily_executions: LICENSE_LIMIT.UNLIMITED,
      monthly_executions: LICENSE_LIMIT.UNLIMITED,
    },
    //Only sending instance not workspace
  },
};
