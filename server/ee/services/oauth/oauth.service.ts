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
  ) {
    this.ssoSignUpDisabled =
      this.configService.get<string>('SSO_DISABLE_SIGNUPS') &&
      this.configService.get<string>('SSO_DISABLE_SIGNUPS') === 'true';
    this.restrictedDomain = this.configService.get<string>('RESTRICTED_DOMAIN');
  }

  private readonly ssoSignUpDisabled: boolean;
  private readonly restrictedDomain: string;

  #isValidDoamin(domain: string): boolean {
    if (!domain) {
      return false;
    }
    if (this.restrictedDomain && this.restrictedDomain.split(',').includes(domain)) {
      return false;
    }
    return true;
  }

  async #findOrCreateUser({ userSSOId, firstName, lastName, email }): Promise<User> {
    const organization = await this.organizationService.findFirst();
    const [user, newUserCreated] = await this.usersService.findOrCreateBySSOIdOrEmail(
      userSSOId,
      { firstName, lastName, email },
      organization
    );

    if (newUserCreated) {
      const organizationUser = await this.organizationUsersService.create(user, organization);
      await this.organizationUsersService.activate(organizationUser);
    }
    return user;
  }

  async #findAndActivateUser(email): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const organizationUser = user.organizationUsers[0];
    if (organizationUser.status != 'active') await this.organizationUsersService.activate(organizationUser);
    return user;
  }

  async #generateLoginResultPayload(user: User): Promise<any> {
    const JWTPayload = { username: user.id, sub: user.email, ssoId: user.ssoId };
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

  async signIn({ origin, ...ssoResponse }): Promise<any> {
    let userSSOId: string, firstName: string, lastName: string, email: string, domain: string;
    switch (origin) {
      case 'google':
        ({ userSSOId, firstName, lastName, email, domain } = await this.googleOAuthService.signIn(ssoResponse?.token));
        if (!this.#isValidDoamin(domain)) throw new UnauthorizedException(`You cannot sign in using a ${domain} id`);
        break;

      case 'git':
        ({ userSSOId, firstName, lastName, email, domain } = await this.gitOAuthService.signIn(ssoResponse?.token));
        if (!this.#isValidDoamin(domain)) throw new UnauthorizedException(`You cannot sign in using a ${domain} id`);
        break;

      default:
        break;
    }

    if (!userSSOId) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const user: User = await (this.ssoSignUpDisabled
      ? this.#findAndActivateUser(email)
      : this.#findOrCreateUser({ userSSOId, firstName, lastName, email }));

    return await this.#generateLoginResultPayload(user);
  }
}
