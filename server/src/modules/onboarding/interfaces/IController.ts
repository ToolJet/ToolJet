import { Response } from 'express';
import { UserEntity } from '@modules/app/decorators/user.decorator';
import { ActivateAccountWithTokenDto } from '../dto/activate-account-with-token.dto';
import { AppSignupDto } from '@modules/auth/dto';
import { CreateAdminDto, OnboardUserDto } from '../dto/user.dto';
import { CreateAiUserDto, OnboardingCompletedDto } from '../dto';
import { AcceptInviteDto } from '../dto/accept-organization-invite.dto';
import { SSOType } from '@entities/sso_config.entity';

export interface IOnboardingController {
  activateAccountWithToken(activateAccountDto: ActivateAccountWithTokenDto, response: Response): Promise<any>;

  setupSuperAdmin(userCreateDto: CreateAdminDto, response: Response): Promise<any>;

  signup(appSignupDto: AppSignupDto): Promise<any>;

  acceptInvite(user: UserEntity, acceptInviteDto: AcceptInviteDto, response: Response): Promise<any>;

  resendInvite(body: AppSignupDto): Promise<any>;

  verifyInviteToken(token: string, organizationToken: string): Promise<any>;

  setupAccountFromToken(onboardUserDto: OnboardUserDto, response: Response): Promise<any>;

  requestTrial(user: UserEntity): Promise<any>;

  trialDeclined(user: UserEntity): Promise<any>;

  activateTrial(): Promise<any>;

  getInviteeDetails(token: string): Promise<any>;

  verifyOrganizationToken(token: string): Promise<any>;

  getSignupOnboardingDetails(user: UserEntity): Promise<any>;

  finishOnboarding(user: UserEntity, body: OnboardingCompletedDto): Promise<any>;
}

export interface IAiOnboardingController {
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
  setAiCookie(response: Response, body: Record<string, any>): Promise<any>;

  /**
   * Deletes AI-related cookies from response
   * @param response - Express response object
   * @param cookies - Current cookies to clear
   * @returns Promise with cookie clearing result
   */
  deleteAiCookies(response: Response, cookies: Record<string, any>): Promise<any>;
}
