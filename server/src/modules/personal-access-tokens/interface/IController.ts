import { Response } from 'express';

export interface IPersonalAccessTokensController {
  create(user: any, body: { name: string; expiresAt: string }): Promise<any>;
  list(user: any, userPermissions: any): Promise<any>;
  delete(user: any, id: string, userPermissions: any): Promise<void>;
  validate(user: any): Promise<{ email: string; organizationId: string }>;
  createSession(request: any, response: Response): Promise<any>;
}
