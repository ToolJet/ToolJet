import { Response } from 'express';
import { User } from '@entities/user.entity';
import { AppAuthenticationDto, CreateAiUserDto } from '../dto';
import { EntityManager } from 'typeorm';
import { SSOType } from '@entities/sso_config.entity';

export interface IAuthService {
  login(response: Response, appAuthDto: AppAuthenticationDto, organizationId?: string, user?: User): Promise<any>;
  authorizeOrganization(user: User): Promise<any>;
  switchOrganization(response: Response, organizationId: string, user: User): Promise<any>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(token: string, password: string): Promise<void>;
}

export interface IWebsiteAuthService {
  /**
   * Handles the complete onboarding process for new users
   * @param userParams - User data for onboarding
   * @param existingUser - Optional existing user object
   * @param response - Express response object for setting cookies
   * @param ssoType - Optional SSO type for social login
   * @param manager - Optional database transaction manager
   * @returns Promise with login result payload
   */
  handleOnboarding(
    userParams: CreateAiUserDto,
    existingUser?: User,
    response?: Response,
    ssoType?: SSOType.GOOGLE | SSOType.GIT,
    manager?: EntityManager
  ): Promise<any>;

  /**
   * Sets AI-related session cookies in response
   * @param response - Express response object
   * @param keyValues - Cookie key-value pairs to set
   * @returns Promise with success message
   */
  setSessionAICookies(response: Response, keyValues: Record<string, any>): { message: string };

  /**
   * Clears AI-related session cookies from response
   * @param response - Express response object
   * @param cookies - Current cookies to clear
   * @returns Promise with success message
   */
  clearSessionAICookies(response: Response, cookies: Record<string, any>): { message: string };
}
