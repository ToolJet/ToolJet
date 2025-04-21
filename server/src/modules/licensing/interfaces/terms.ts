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
    ai?: boolean;
    externalApi?: boolean;
  };
  type?: LICENSE_TYPE;
  plan?: {
    isFlexible: boolean;
  };
  auditLogs?: {
    maximumDays?: number | string;
  };
  meta?: {
    customerName?: string;
    generatedFrom?: 'API';
    customerId?: string;
    createdBy?: string;
  };
  workflows?: {
    execution_timeout?: number;
    workspace: {
      total?: number;
      daily_executions?: number;
      monthly_executions?: number;
    };
    instance: {
      total?: number;
      daily_executions?: number;
      monthly_executions?: number;
    };
  };
  ai?: {
    apiKey?: string;
  };
}
