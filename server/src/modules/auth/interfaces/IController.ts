import { Response } from 'express';
import { User } from '@entities/user.entity';
import { AppAuthenticationDto, AppForgotPasswordDto, AppPasswordResetDto } from '../dto';

export interface IAuthController {
  login(appAuthDto: AppAuthenticationDto, response: Response): Promise<any>;
  superAdminLogin(appAuthDto: AppAuthenticationDto, response: Response): Promise<any>;
  organizationLogin(
    user: User,
    appAuthDto: AppAuthenticationDto,
    organizationId: string,
    response: Response
  ): Promise<any>;
  authorize(user: User): Promise<any>;
  switchWorkspace(organizationId: string, user: User, response: Response): Promise<any>;
  forgotPassword(appAuthDto: AppForgotPasswordDto): Promise<Record<string, never>>;
  resetPassword(appAuthDto: AppPasswordResetDto): Promise<Record<string, never>>;
}
