export interface Terms {
  expiry: string; // YYYY-MM-DD
  apps?: number;
  users?: {
    total?: number;
    editor?: number;
    viewer?: number;
  };
  features?: {
    oidc?: boolean;
    auditLogs?: boolean;
  };
}
