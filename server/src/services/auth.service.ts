import { Injectable, NotAcceptableException, NotFoundException, UnauthorizedException } from '@nestjs/common';
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
  ) {}

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

  async login(email: string, password: string, organizationId?: string) {
    let organization: Organization;

    const user = await this.validateUser(email, password, organizationId);

    if (user && (await this.usersService.status(user)) !== 'archived') {
      if (!organizationId) {
        // Global login
        // Determine the organization to be loaded
        if (this.configService.get<string>('MULTI_ORGANIZATION') !== 'true') {
          // Single organization
          organization = await this.organizationsService.getSingleOrganization();
          if (!organization?.ssoConfigs?.find((oc) => oc.sso == 'form' && oc.enabled)) {
            throw new UnauthorizedException();
          }
        } else {
          const organizationList: Organization[] = await this.organizationsService.findOrganizationSupportsFormLogin(
            user
          );

          const defaultOrgDetails: Organization = organizationList?.find((og) => og.id === user.defaultOrganizationId);
          // Multi organization
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
        }
        user.organizationId = organization.id;
      } else {
        // organization specific login
        user.organizationId = organizationId;

        organization = await this.organizationsService.get(user.organizationId);
        const formConfigs: SSOConfigs = organization?.ssoConfigs?.find((sso) => sso.sso === 'form');

        if (!formConfigs?.enabled) {
          // no configurations in organization side or Form login disabled for the organization
          throw new UnauthorizedException('Password login is disabled for the organization');
        }
      }

      if (user.defaultOrganizationId !== user.organizationId) {
        // Updating default organization Id
        await this.usersService.updateDefaultOrganization(user, organization.id);
      }

      const payload = {
        username: user.id,
        sub: user.email,
        organizationId: user.organizationId,
        isPasswordLogin: true,
      };

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

  async switchOrganization(newOrganizationId: string, user: User, isNewOrganization?: boolean) {
    if (!(isNewOrganization || user.isPasswordLogin)) {
      throw new UnauthorizedException();
    }
    if (this.configService.get<string>('MULTI_ORGANIZATION') !== 'true') {
      throw new UnauthorizedException();
    }
    const newUser = await this.usersService.findByEmail(user.email, newOrganizationId);

    if (newUser && (await this.usersService.status(newUser)) !== 'archived') {
      newUser.organizationId = newOrganizationId;

      const organization: Organization = await this.organizationsService.get(newUser.organizationId);

      const formConfigs: SSOConfigs = organization?.ssoConfigs?.find((sso) => sso.sso === 'form');

      if (!formConfigs?.enabled) {
        // no configurations in organization side or Form login disabled for the organization
        throw new UnauthorizedException('Password login disabled for the organization');
      }

      // Updating default organization Id
      await this.usersService.updateDefaultOrganization(newUser, newUser.organizationId);

      const payload = {
        username: user.id,
        sub: user.email,
        organizationId: newUser.organizationId,
        isPasswordLogin: true,
      };

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

  async signup(email: string) {
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser?.invitationToken || existingUser?.organizationUsers?.some((ou) => ou.status === 'active')) {
      throw new NotAcceptableException('Email already exists');
    }

    let organization: Organization;
    // Check if the configs allows user signups
    if (this.configService.get<string>('MULTI_ORGANIZATION') !== 'true') {
      // Single organization checking if organization exist
      organization = await this.organizationsService.getSingleOrganization();

      if (organization) {
        throw new NotAcceptableException('Multi organization not supported - organization exist');
      }
    } else {
      // Multi organization
      if (this.configService.get<string>('DISABLE_SIGNUPS') === 'true') {
        throw new NotAcceptableException();
      }
    }
    // Create default organization
    organization = await this.organizationsService.create('Untitled organization');
    const user = await this.usersService.create({ email }, organization.id, ['all_users', 'admin'], existingUser, true);
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
