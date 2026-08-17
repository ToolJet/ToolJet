export interface IPersonalAccessTokensController {
  create(user: any, body: { name: string; organizationId: string; expiresAt: string }): Promise<any>;
  list(user: any): Promise<any>;
  delete(user: any, id: string): Promise<void>;
}
