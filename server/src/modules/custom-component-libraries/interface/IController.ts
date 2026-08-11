export interface ICustomComponentLibrariesController {
  create(user: any, body: { name: string }): Promise<{ id: string; name: string }>;
  get(user: any, id: string): Promise<any>;
  list(user: any): Promise<any>;
  validateToken(user: any): Promise<{ email: string }>;
  createToken(user: any, body: { name: string; organizationId?: string; expiresInDays?: number | null }): Promise<any>;
  listTokens(user: any): Promise<any>;
  deleteToken(user: any, id: string): Promise<void>;
}
