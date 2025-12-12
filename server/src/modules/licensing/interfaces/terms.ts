import { LICENSE_TYPE } from '../constants';

export interface Terms {
  expiry: string; // YYYY-MM-DD
  apps?: number | string;
  workspaces?: number | string;
  workspaceId?: string;
  users?: {
    total?: number | string;
    editor?: number | string;
    viewer?: number | string;
    superadmin?: number | string;
  };
  database?: {
    table?: number | string;
  };
  domains?: Array<{ hostname?: string; subpath?: string }>;
  features?: {
    oidc?: boolean;
    auditLogs?: boolean;
    ldap?: boolean;
    saml?: boolean;
    customStyling?: boolean;
    whiteLabelling?: boolean;
    multiEnvironment?: boolean;
    multiPlayerEdit?: boolean;
    gitSync?: boolean;
    comments?: boolean;
    customThemes?: boolean;
    serverSideGlobalResolve?: boolean;
    ai?: boolean;
    externalApi?: boolean;
    appWhiteLabelling?: boolean;
    scim?: boolean;
  };
  type?: LICENSE_TYPE;
  plan?: {
    name?: string;
    isFlexible: boolean;
  };
  auditLogs?: {
    maximumDays?: number | string;
  };
  app?: {
    pages: {
      enabled: boolean;
      features: {
        appHeaderAndLogo: boolean;
        addNavGroup: boolean;
      };
    };
    permissions: {
      component: boolean;
      query: boolean;
      pages: boolean;
    };
  };
  modules?: {
    enabled: boolean;
  };
  permissions?: {
    customGroups: boolean;
  };
  meta?: {
    customerName?: string;
    generatedFrom?: 'API';
    customerId?: string;
    createdBy?: string;
  };
  workflows?: {
    enabled?: boolean;
    execution_timeout?: number;
    workspace?: {
      total?: number | string;
      daily_executions?: number | string;
      monthly_executions?: number | string;
    };
    instance?: {
      total?: number | string;
      daily_executions?: number | string;
      monthly_executions?: number | string;
    };
  };
  ai?: {
    apiKey?: string;
  };
}
