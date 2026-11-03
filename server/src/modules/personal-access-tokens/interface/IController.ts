import { Response } from 'express';
import { UserPermissions } from '@modules/ability/types';

export interface IPersonalAccessTokensController {
  create(user: any, body: { name: string; expiresAt: string }): Promise<any>;
  list(user: any, userPermissions: UserPermissions): Promise<any>;
  delete(user: any, id: string, userPermissions: UserPermissions): Promise<void>;
  validate(user: any): Promise<{ email: string; organizationId: string }>;
  createSession(request: any, response: Response): Promise<any>;
}
