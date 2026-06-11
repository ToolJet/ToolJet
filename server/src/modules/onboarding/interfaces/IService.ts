import { Response } from 'express';
import { AppSignupDto } from '@modules/auth/dto';
import { OnboardingStatus } from '../constants';
import { User } from '@entities/user.entity';
import { OnboardUserDto } from '../dto/user.dto';
import { AcceptInviteDto } from '../dto/accept-organization-invite.dto';
import { ActivateAccountWithTokenDto } from '../dto/activate-account-with-token.dto';
import { ResendInviteDto } from '@modules/onboarding/dto/resend-invite.dto';

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
