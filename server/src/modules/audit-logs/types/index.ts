export interface AuditLogsQuery {
  resources: string;
  actions: string;
  timeFrom: string;
  timeTo: string;
  users: string;
  apps: string;
  page: string;
  perPage: string;
}
