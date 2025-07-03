import { Response } from 'express';
import { AppSignupDto } from '@modules/auth/dto';
import { OnboardingStatus } from '../constants';
import { User } from '@entities/user.entity';
import { OnboardUserDto } from '../dto/user.dto';
import { AcceptInviteDto } from '../dto/accept-organization-invite.dto';
import { ActivateAccountWithTokenDto } from '../dto/activate-account-with-token.dto';
import { ResendInviteDto } from '@modules/onboarding/dto/resend-invite.dto';
import { EntityManager } from 'typeorm';
import { SSOType } from '@entities/sso_config.entity';
import { CreateAiUserDto } from '../dto';

export interface IOnboardingService {
  signup(appSignUpDto: AppSignupDto): Promise<any>;

  setupAccountFromInvitationToken(response: Response, userCreateDto: OnboardUserDto): Promise<any>;

  acceptOrganizationInvite(response: Response, loggedInUser: User, acceptInviteDto: AcceptInviteDto): Promise<any>;

  verifyInviteToken(
    token: string,
    organizationToken?: string
  ): Promise<{
    redirect_url?: string;
    email?: string;
    name?: string;
    onboarding_details?: {
      status?: OnboardingStatus;
      password?: boolean;
      questions?: boolean;
    };
  }>;

  activateAccountWithToken(activateAccountWithToken: ActivateAccountWithTokenDto, response: Response): Promise<any>;

  getInviteeDetails(token: string): Promise<{
    email: string;
  }>;

  verifyOrganizationToken(token: string): Promise<{
    email: string;
    name: string;
    onboarding_details: {
      password: boolean;
    };
  }>;

  resendEmail(body: ResendInviteDto): Promise<any>;
}

export interface IAiOnboardingService {
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
   * Sets AI-related cookies in response (non-session cookies)
   * @param response - Express response object
   * @param keyValues - Cookie key-value pairs to set
   * @returns Promise with success message
   */
  setAiCookies(response: Response, keyValues: Record<string, any>): Promise<{ message: string }>;

  /**
   * Sets AI-related session cookies in response
   * @param response - Express response object
   * @param keyValues - Cookie key-value pairs to set
   * @returns Promise with success message
   */
  setSessionAICookies(response: Response, keyValues: Record<string, any>): Promise<{ message: string }>;

  /**
   * Clears AI-related session cookies from response
   * @param response - Express response object
   * @param cookies - Current cookies to clear
   * @returns Promise with success message
   */
  clearSessionAICookies(response: Response, cookies: Record<string, any>): Promise<{ message: string }>;
}
