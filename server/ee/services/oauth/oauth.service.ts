import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/entities/user.entity';
import { OrganizationsService } from '@services/organizations.service';
import { OrganizationUsersService } from '@services/organization_users.service';
import { UsersService } from '@services/users.service';
import { GoogleOAuthService } from './google_oauth.service';
import { decamelizeKeys } from 'humps';
import { GitOAuthService } from './git_oauth.service';
import UserResponse from './models/user_response';

@Injectable()
export class OauthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly organizationService: OrganizationsService,
    private readonly jwtService: JwtService,
    private readonly organizationUsersService: OrganizationUsersService,
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly gitOAuthService: GitOAuthService,
    private readonly configService: ConfigService
  ) {}

  #isValidDomain(domain: string): boolean {
    const restrictedDomain = this.configService.get<string>('SSO_RESTRICTED_DOMAIN');

    if (!domain) {
      return false;
    }
    if (
      restrictedDomain &&
      !restrictedDomain
        .split(',')
        .filter((e) => !!e)
        .includes(domain)
    ) {
      return false;
    }
    return true;
  }

  async #findOrCreateUser({ userSSOId, firstName, lastName, email, sso }: UserResponse): Promise<User> {
    const organization = await this.organizationService.findFirst();
    const { user, newUserCreated } = await this.usersService.findOrCreateByEmail(
      { firstName, lastName, email, ssoId: userSSOId, sso },
      organization
    );

    if (newUserCreated) {
      const organizationUser = await this.organizationUsersService.create(user, organization);
      await this.organizationUsersService.activate(organizationUser);
    } else if (userSSOId) {
      await this.usersService.updateSSODetails(user, { userSSOId, sso });
    }
    return user;
  }

  async #findAndActivateUser(email: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const organizationUser = user.organizationUsers[0];
    if (organizationUser.status != 'active') await this.organizationUsersService.activate(organizationUser);
    return user;
  }

  async #generateLoginResultPayload(user: User): Promise<any> {
    const JWTPayload: JWTPayload = { username: user.id, sub: user.email, ssoId: user.ssoId, sso: user.sso };
    return decamelizeKeys({
      id: user.id,
      auth_token: this.jwtService.sign(JWTPayload),
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      admin: await this.usersService.hasGroup(user, 'admin'),
      group_permissions: await this.usersService.groupPermissions(user),
      app_group_permissions: await this.usersService.appGroupPermissions(user),
    });
  }

  async signIn(ssoResponse: SSOResponse): Promise<any> {
    const ssoSignUpDisabled =
      this.configService.get<string>('SSO_DISABLE_SIGNUP') &&
      this.configService.get<string>('SSO_DISABLE_SIGNUP') === 'true';

    const { token, origin } = ssoResponse;

    let userResponse: UserResponse;
    switch (origin) {
      case 'google':
        userResponse = await this.googleOAuthService.signIn(token);
        if (!this.#isValidDomain(userResponse.domain))
          throw new UnauthorizedException(`You cannot sign in using a ${userResponse.domain} id`);
        break;

      case 'git':
        userResponse = await this.gitOAuthService.signIn(token);
        break;

      default:
        break;
    }

    if (!(userResponse.userSSOId && userResponse.email)) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const user: User = await (ssoSignUpDisabled
      ? this.#findAndActivateUser(userResponse.email)
      : this.#findOrCreateUser(userResponse));

    if (!user) {
      throw new UnauthorizedException(`Email id ${userResponse.email} is not registered`);
    }

    return await this.#generateLoginResultPayload(user);
  }
}

interface SSOResponse {
  token: string;
  origin: 'google' | 'git';
  state?: string;
  redirectUri?: string;
}

interface JWTPayload {
  username: string;
  sub: string;
  ssoId: string;
  sso: string;
}
