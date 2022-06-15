import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/entities/user.entity';
import { OrganizationsService } from '@services/organizations.service';
import { OrganizationUsersService } from '@services/organization_users.service';
import { UsersService } from '@services/users.service';
import { GoogleOAuthService } from './google_oauth.service';
import { decamelizeKeys } from 'humps';
import { GitOAuthService } from './git_oauth.service';
import UserResponse from './models/user_response';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { Organization } from 'src/entities/organization.entity';
import { SSOConfigs } from 'src/entities/sso_config.entity';

@Injectable()
export class OauthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly organizationService: OrganizationsService,
    private readonly jwtService: JwtService,
    private readonly organizationUsersService: OrganizationUsersService,
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly gitOAuthService: GitOAuthService
  ) {}

  #isValidDomain(email: string, restrictedDomain: string): boolean {
    if (!email) {
      return false;
    }
    const domain = email.substring(email.lastIndexOf('@') + 1);

    if (!restrictedDomain) {
      return true;
    }
    if (!domain) {
      return false;
    }
    if (
      !restrictedDomain
        .split(',')
        .map((e) => e && e.trim())
        .filter((e) => !!e)
        .includes(domain)
    ) {
      return false;
    }
    return true;
  }

  async #findOrCreateUser({ firstName, lastName, email }: UserResponse, organization: Organization): Promise<User> {
    const existingUser = await this.usersService.findByEmail(email, organization.id, ['active', 'invited']);
    const organizationUser = existingUser?.organizationUsers?.[0];

    if (!organizationUser) {
      // User not exist in the workspace
      const { user, newUserCreated } = await this.usersService.findOrCreateByEmail(
        { firstName, lastName, email },
        organization.id
      );

      if (newUserCreated) {
        const organizationUser = await this.organizationUsersService.create(user, organization);
        await this.organizationUsersService.activate(organizationUser);
      }
      return user;
    } else {
      if (organizationUser.status !== 'active') await this.organizationUsersService.activate(organizationUser);
      return existingUser;
    }
  }

  async #findAndActivateUser(email: string, organizationId: string): Promise<User> {
    const user = await this.usersService.findByEmail(email, organizationId, ['active', 'invited']);
    if (!user) {
      throw new UnauthorizedException('User does not exist in the workspace');
    }
    const organizationUser: OrganizationUser = user.organizationUsers?.[0];

    if (!organizationUser) {
      throw new UnauthorizedException('User does not exist in the workspace');
    }
    if (organizationUser.status !== 'active') await this.organizationUsersService.activate(organizationUser);
    return user;
  }

  async #generateLoginResultPayload(user: User, organization: Organization): Promise<any> {
    const JWTPayload: JWTPayload = { username: user.id, sub: user.email, organizationId: organization.id };
    user.organizationId = organization.id;

    return decamelizeKeys({
      id: user.id,
      auth_token: this.jwtService.sign(JWTPayload),
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      organizationId: organization.id,
      organization: organization.name,
      admin: await this.usersService.hasGroup(user, 'admin'),
      group_permissions: await this.usersService.groupPermissions(user),
      app_group_permissions: await this.usersService.appGroupPermissions(user),
    });
  }

  async signIn(ssoResponse: SSOResponse, configId: string): Promise<any> {
    const ssoConfigs: SSOConfigs = await this.organizationService.getConfigs(configId);

    if (!(ssoConfigs && ssoConfigs?.organization)) {
      throw new UnauthorizedException();
    }
    const organization = ssoConfigs.organization;

    const { enableSignUp, domain } = ssoConfigs.organization;
    const { sso, configs } = ssoConfigs;
    const { token } = ssoResponse;

    let userResponse: UserResponse;
    switch (sso) {
      case 'google':
        userResponse = await this.googleOAuthService.signIn(token, configs);
        break;

      case 'git':
        userResponse = await this.gitOAuthService.signIn(token, configs);
        break;

      default:
        break;
    }

    if (!(userResponse.userSSOId && userResponse.email)) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!this.#isValidDomain(userResponse.email, domain)) {
      throw new UnauthorizedException(`You cannot sign in using the mail id - Domain verification failed`);
    }

    // If firstName not found
    if (!userResponse.firstName) {
      userResponse.firstName = userResponse.email?.split('@')?.[0];
    }
    const user: User = await (!enableSignUp
      ? this.#findAndActivateUser(userResponse.email, organization.id)
      : this.#findOrCreateUser(userResponse, organization));

    if (!user) {
      throw new UnauthorizedException(`Email id ${userResponse.email} is not registered`);
    }

    return await this.#generateLoginResultPayload(user, organization);
  }
}

interface SSOResponse {
  token: string;
  state?: string;
}

interface JWTPayload {
  username: string;
  sub: string;
  organizationId: string;
}
