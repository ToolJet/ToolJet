import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/entities/user.entity';
import { OrganizationsService } from '@services/organizations.service';
import { OrganizationUsersService } from '@services/organization_users.service';
import { UsersService } from '@services/users.service';
import { GoogleOAuthService } from './google_oauth.service';

@Injectable()
export class OauthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly organizationService: OrganizationsService,
    private readonly jwtService: JwtService,
    private readonly organizationUsersService: OrganizationUsersService,
    private readonly googleOAuthService: GoogleOAuthService
  ) {}

  async #findOrCreateUser({ userSSOId, firstName, lastName, email }): Promise<User> {
    const organization = await this.organizationService.findFirst();
    const [user, newUserCreated] = await this.usersService.findOrCreateBySSOIdOrEmail(
      userSSOId,
      { firstName, lastName, email },
      organization
    );

    if (newUserCreated) {
      const organizationUser = await this.organizationUsersService.create(user, organization);
      this.organizationUsersService.activate(organizationUser);
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
    return {
      auth_token: this.jwtService.sign(JWTPayload),
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      admin: await this.usersService.hasGroup(user, 'admin'),
    };
  }

  async signIn(token: string): Promise<any> {
    const { userSSOId, firstName, lastName, email, domain } = await this.googleOAuthService.signIn(token);

    if ([undefined, '', null].includes(userSSOId)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if ('RESTRICTED_DOMAIN' in process.env && process.env.RESTRICTED_DOMAIN != domain)
      throw new UnauthorizedException(`You cannot sign in using a ${domain} id`);

    let user: User;
    if (process.env.SSO_DISABLE_SIGNUP === 'true') user = await this.#findAndActivateUser(email);
    else user = await this.#findOrCreateUser({ userSSOId, firstName, lastName, email });

    return await this.#generateLoginResultPayload(user);
  }
}
