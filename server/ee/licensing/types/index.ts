import { LICENSE_TYPE } from 'src/helpers/license.helper';

export interface Terms {
  expiry: string; // YYYY-MM-DD
  apps?: number;
  workspaces?: number;
  users?: {
    total?: number;
    editor?: number;
    viewer?: number;
    superadmin: number;
  };
  domains?: Array<{ hostname?: string; subpath?: string }>;
  features?: {
    oidc?: boolean;
    auditLogs?: boolean;
  };
  type?: LICENSE_TYPE;
}
