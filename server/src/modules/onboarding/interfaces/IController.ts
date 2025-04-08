import { Response } from 'express';
import { UserEntity } from '@modules/app/decorators/user.decorator';
import { ActivateAccountWithTokenDto } from '../dto/activate-account-with-token.dto';
import { AppSignupDto } from '@modules/auth/dto';
import { CreateAdminDto, OnboardUserDto } from '../dto/user.dto';
import { OnboardingCompletedDto } from '../dto';
import { AcceptInviteDto } from '../dto/accept-organization-invite.dto';

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
