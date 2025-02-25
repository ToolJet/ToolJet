import { User } from '@entities/user.entity';
import { EntityManager, DeepPartial } from 'typeorm';
import { SSOType, SSOConfigs } from '@entities/sso_config.entity';
import UserResponse from '../oauth/models/user_response';

export interface IAuthUtilService {
  validateLoginUser(email: string, password: string, organizationId?: string): Promise<User>;
  getSignupUserOnboardingDetails(user: User): Promise<{
    userId: string;
    resumeOnboardingSession: boolean;
    [key: string]: any;
  }>;
  verifyToken(token: string): any;
  getSSOConfigs(ssoType: SSOType.GOOGLE | SSOType.GIT | SSOType.OPENID): Promise<Partial<SSOConfigs>>;
  getInstanceSSOConfigsOfType(ssoType: SSOType.GOOGLE | SSOType.GIT | SSOType.OPENID): Promise<DeepPartial<SSOConfigs>>;
  syncUserAndGroups(
    userResponse: UserResponse,
    userId: string,
    organizationId: string,
    manager: EntityManager
  ): Promise<void>;
}
