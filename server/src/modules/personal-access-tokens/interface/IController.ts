import { Response } from 'express';

export interface IPersonalAccessTokensController {
  create(user: any, body: { name: string; organizationId: string; expiresAt: string }): Promise<any>;
  list(user: any): Promise<any>;
  delete(user: any, id: string): Promise<void>;
  validate(user: any): Promise<{ email: string; organizationId: string }>;
  createSession(request: any, response: Response): Promise<any>;
}
