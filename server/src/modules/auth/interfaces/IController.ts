import { Response } from 'express';
import { User } from '@entities/user.entity';
import { AppAuthenticationDto, AppForgotPasswordDto, AppPasswordResetDto, CreateAiUserDto } from '../dto';
import { SSOType } from '@entities/sso_config.entity';

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

export interface IWebsiteAuthController {
  /**
   * Handles user onboarding process
   * @param onboardingData - The user data for onboarding
   * @param response - Express response object
   * @returns Promise with onboarding result
   */
  onboard(onboardingData: CreateAiUserDto, response: Response): Promise<any>;

  /**
   * Handles common sign-in process for SSO providers
   * @param ssoType - The SSO type (Google or Git)
   * @param body - Request body data
   * @param user - Authenticated user object
   * @param response - Express response object
   * @returns Promise with sign-in result
   */
  commonSignIn(ssoType: SSOType.GOOGLE | SSOType.GIT, body: any, user: any, response: Response): Promise<any>;

  /**
   * Sets AI-related cookies in response (Safari browser support)
   * @param response - Express response object
   * @param body - Cookie data to set
   * @returns Promise with cookie setting result
   */
  setAiCookie(response: Response, body: Record<string, any>): any;

  /**
   * Deletes AI-related cookies from response
   * @param response - Express response object
   * @param cookies - Current cookies to clear
   * @returns Promise with cookie clearing result
   */
  deleteAiCookies(response: Response, cookies: Record<string, any>): any;
}
