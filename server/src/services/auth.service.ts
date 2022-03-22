import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { OrganizationsService } from './organizations.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../entities/user.entity';
import { OrganizationUsersService } from './organization_users.service';
import { EmailService } from './email.service';
import { decamelizeKeys } from 'humps';
import { Organization } from 'src/entities/organization.entity';
import { ConfigService } from '@nestjs/config';
import { SSOConfigs } from 'src/entities/sso_config.entity';
const bcrypt = require('bcrypt');
const uuid = require('uuid');

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private organizationsService: OrganizationsService,
    private organizationUsersService: OrganizationUsersService,
    private emailService: EmailService,
    private configService: ConfigService
  ) {
    this.passwordLoginDisabled = this.configService.get<string>('DISABLE_PASSWORD_LOGIN');
  }

  private readonly passwordLoginDisabled: string;

  verifyToken(token: string) {
    try {
      const signedJwt = this.jwtService.verify(token);
      return signedJwt;
    } catch (err) {
      return null;
    }
  }

  private async validateUser(email: string, password: string, organisationId?: string): Promise<User> {
    const user = await this.usersService.findByEmail(email, organisationId);

    if (!user) return null;

    const isVerified = await bcrypt.compare(password, user.password);

    return isVerified ? user : null;
  }

  async login(params: any) {
    const { email, password, organizationId } = params;
    let organization: Organization;

    if (!organizationId && this.passwordLoginDisabled === 'true') {
      // Global login - checking instance configs
      throw new UnauthorizedException('Invalid credentials');
    }
    const user = await this.validateUser(email, password, organizationId);

    if (user && (await this.usersService.status(user)) !== 'archived') {
      if (!organizationId) {
        // Global login
        const organizationList: Organization[] = await this.organizationsService.findOrganizationSupportsFormLogin(
          user
        );

        const defaultOrgDetails: Organization = organizationList?.find((og) => og.id === user.defaultOrganizationId);

        // Determine the organization to be loaded
        if (defaultOrgDetails) {
          // default organization form login enabled
          organization = defaultOrgDetails;
        } else if (organizationList?.length > 0) {
          // default organization form login not enabled, picking first one from form enabled list
          organization = organizationList[0];
        } else {
          // no form login enabled organization available for user - creating new one
          organization = await this.organizationsService.create('Untitled organization', user);
        }
        user.organizationId = organization.id;

        if (defaultOrgDetails?.id !== user.organizationId) {
          // Updating default organization Id
          await this.usersService.updateDefaultOrganization(user, organization.id);
        }
      } else {
        user.organizationId = organizationId;

        const organization: Organization = await this.organizationsService.get(user.organizationId);

        const formConfigs: SSOConfigs = organization?.ssoConfigs?.find((sso) => sso.sso === 'form');

        if (!formConfigs?.enabled) {
          // no configurations in organization side or Form login disabled for the organization
          throw new UnauthorizedException('Invalid credentials');
        }
      }

      const payload = { username: user.id, sub: user.email, organizationId: user.organizationId };

      return decamelizeKeys({
        id: user.id,
        auth_token: this.jwtService.sign(payload),
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        organizationId: user.organizationId,
        organization: organization.name,
        admin: await this.usersService.hasGroup(user, 'admin'),
        group_permissions: await this.usersService.groupPermissions(user),
        app_group_permissions: await this.usersService.appGroupPermissions(user),
      });
    } else {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async switchOrganization(newOrganizationId: string, user: User) {
    const newUser = await this.usersService.findByEmail(user.email, newOrganizationId);

    console.log('--->>>>111', newUser);

    if (newUser && (await this.usersService.status(newUser)) !== 'archived') {
      newUser.organizationId = newOrganizationId;

      const organization: Organization = await this.organizationsService.get(newUser.organizationId);

      const formConfigs: SSOConfigs = organization?.ssoConfigs?.find((sso) => sso.sso === 'form');

      console.log('--->>>>111222', formConfigs);

      if (!formConfigs?.enabled) {
        // no configurations in organization side or Form login disabled for the organization
        throw new UnauthorizedException('Invalid credentials');
      }

      const payload = { username: user.id, sub: user.email, organizationId: newUser.organizationId };

      return decamelizeKeys({
        id: newUser.id,
        auth_token: this.jwtService.sign(payload),
        email: newUser.email,
        first_name: newUser.firstName,
        last_name: newUser.lastName,
        organizationId: newUser.organizationId,
        organization: organization.name,
        admin: await this.usersService.hasGroup(newUser, 'admin'),
        group_permissions: await this.usersService.groupPermissions(newUser),
        app_group_permissions: await this.usersService.appGroupPermissions(newUser),
      });
    } else {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async signup(params: any) {
    // Check if the installation allows user signups
    if (this.configService.get<string>('DISABLE_SIGNUPS') === 'true') {
      return {};
    }

    const { email } = params;
    const organization = await this.organizationsService.create('Untitled organization');
    const user = await this.usersService.create({ email }, organization.id, ['all_users', 'admin']);
    await this.organizationUsersService.create(user, organization, true);

    await this.emailService.sendWelcomeEmail(user.email, user.firstName, user.invitationToken);

    return {};
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    const forgotPasswordToken = uuid.v4();
    await this.usersService.update(user.id, { forgotPasswordToken });
    await this.emailService.sendPasswordResetEmail(email, forgotPasswordToken);
  }

  async resetPassword(token: string, password: string) {
    const user = await this.usersService.findByPasswordResetToken(token);
    if (!user) {
      throw new NotFoundException('Invalid token');
    } else {
      await this.usersService.update(user.id, {
        password,
        forgotPasswordToken: null,
      });
    }
  }
}
