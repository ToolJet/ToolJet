import { Response } from 'express';
import { User } from '@entities/user.entity';
import { AppAuthenticationDto } from '../dto';

export interface IAuthService {
  login(response: Response, appAuthDto: AppAuthenticationDto, organizationId?: string, user?: User): Promise<any>;
  authorizeOrganization(user: User): Promise<any>;
  switchOrganization(response: Response, organizationId: string, user: User): Promise<any>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(token: string, password: string): Promise<void>;
}
