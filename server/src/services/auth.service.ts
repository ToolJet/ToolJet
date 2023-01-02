import {
  BadRequestException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
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
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, EntityManager, Repository } from 'typeorm';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { CreateAdminDto, CreateUserDto } from '@dto/user.dto';
import { AcceptInviteDto } from '@dto/accept-organization-invite.dto';
import { dbTransactionWrap } from 'src/helpers/utils.helper';
import {
  getUserErrorMessages,
  getUserStatusAndSource,
  isPasswordMandatory,
  USER_STATUS,
  lifecycleEvents,
  SOURCE,
  URL_SSO_SOURCE,
  WORKSPACE_USER_STATUS,
} from 'src/helpers/user_lifecycle';
const bcrypt = require('bcrypt');
const uuid = require('uuid');

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(OrganizationUser)
    private organizationUsersRepository: Repository<OrganizationUser>,
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

  private async validateUser(email: string, password: string, organizationId?: string): Promise<User> {
    const user = await this.usersService.findByEmail(email, organizationId, WORKSPACE_USER_STATUS.ACTIVE);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== USER_STATUS.ACTIVE) {
      throw new UnauthorizedException(getUserErrorMessages(user.status));
    }

    const passwordRetryConfig = this.configService.get<string>('PASSWORD_RETRY_LIMIT');

    const passwordRetryAllowed = passwordRetryConfig ? parseInt(passwordRetryConfig) : 5;

    if (
      this.configService.get<string>('DISABLE_PASSWORD_RETRY_LIMIT') !== 'true' &&
      user.passwordRetryCount >= passwordRetryAllowed
    ) {
      throw new UnauthorizedException(
        'Maximum password retry limit reached, please reset your password using forgot password option'
      );
    }
    if (!(await bcrypt.compare(password, user.password))) {
      await this.usersService.updateUser(user.id, { passwordRetryCount: user.passwordRetryCount + 1 });
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(email: string, password: string, organizationId?: string) {
    let organization: Organization;

    const user = await this.validateUser(email, password, organizationId);

    return await dbTransactionWrap(async (manager: EntityManager) => {
      if (!organizationId) {
        // Global login
        // Determine the organization to be loaded
        if (this.configService.get<string>('DISABLE_MULTI_WORKSPACE') === 'true') {
          // Single organization
          if (user?.organizationUsers?.[0].status !== WORKSPACE_USER_STATUS.ACTIVE) {
            throw new UnauthorizedException('Your account is not active');
          }
          organization = await this.organizationsService.getSingleOrganization();
          if (!organization?.ssoConfigs?.find((oc) => oc.sso == 'form' && oc.enabled)) {
            throw new UnauthorizedException();
          }
        } else {
          // Multi organization
          const organizationList: Organization[] = await this.organizationsService.findOrganizationWithLoginSupport(
            user,
            'form'
          );

          const defaultOrgDetails: Organization = organizationList?.find((og) => og.id === user.defaultOrganizationId);
          if (defaultOrgDetails) {
            // default organization form login enabled
            organization = defaultOrgDetails;
          } else if (organizationList?.length > 0) {
            // default organization form login not enabled, picking first one from form enabled list
            organization = organizationList[0];
          } else {
            // no form login enabled organization available for user - creating new one
            organization = await this.organizationsService.create('Untitled workspace', user, manager);
          }
        }
        user.organizationId = organization.id;
      } else {
        // organization specific login
        // No need to validate user status, validateUser() already covers it
        user.organizationId = organizationId;

        organization = await this.organizationsService.get(user.organizationId);
        const formConfigs: SSOConfigs = organization?.ssoConfigs?.find((sso) => sso.sso === 'form');

        if (!formConfigs?.enabled) {
          // no configurations in organization side or Form login disabled for the organization
          throw new UnauthorizedException('Password login is disabled for the organization');
        }
      }

      await this.usersService.updateUser(
        user.id,
        {
          ...(user.defaultOrganizationId !== user.organizationId && { defaultOrganizationId: organization.id }),
          passwordRetryCount: 0,
        },
        manager
      );

      return await this.generateLoginResultPayload(user, organization, false, true, manager);
    });
  }

  async switchOrganization(newOrganizationId: string, user: User, isNewOrganization?: boolean) {
    if (!(isNewOrganization || user.isPasswordLogin || user.isSSOLogin)) {
      throw new UnauthorizedException();
    }
    if (this.configService.get<string>('DISABLE_MULTI_WORKSPACE') === 'true') {
      throw new UnauthorizedException();
    }
    const newUser = await this.usersService.findByEmail(user.email, newOrganizationId, WORKSPACE_USER_STATUS.ACTIVE);

    if (!newUser) {
      throw new UnauthorizedException('Invalid credentials');
    }
    newUser.organizationId = newOrganizationId;

    const organization: Organization = await this.organizationsService.get(newUser.organizationId);

    const formConfigs: SSOConfigs = organization?.ssoConfigs?.find((sso) => sso.sso === 'form');

    if ((user.isPasswordLogin && !formConfigs?.enabled) || (user.isSSOLogin && !organization.inheritSSO)) {
      // no configurations in organization side or Form login disabled for the organization
      throw new UnauthorizedException('Please log in to continue');
    }

    return await dbTransactionWrap(async (manager: EntityManager) => {
      // Updating default organization Id
      await this.usersService.updateUser(newUser.id, { defaultOrganizationId: newUser.organizationId }, manager);

      return await this.generateLoginResultPayload(user, organization, user.isSSOLogin, user.isPasswordLogin, manager);
    });
  }

  async resendEmail(email: string) {
    if (!email) {
      throw new BadRequestException();
    }
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser?.organizationUsers?.some((ou) => ou.status === WORKSPACE_USER_STATUS.ACTIVE)) {
      throw new NotAcceptableException('Email already exists');
    }

    if (existingUser?.invitationToken) {
      await this.emailService.sendWelcomeEmail(
        existingUser.email,
        existingUser.firstName,
        existingUser.invitationToken
      );
      return;
    }
  }

  async signup(email: string, name: string, password: string) {
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser?.organizationUsers?.some((ou) => ou.status === WORKSPACE_USER_STATUS.ACTIVE)) {
      throw new NotAcceptableException('Email already exists');
    }

    if (existingUser?.invitationToken) {
      await this.emailService.sendWelcomeEmail(
        existingUser.email,
        existingUser.firstName,
        existingUser.invitationToken
      );
      throw new NotAcceptableException(
        'The user is already registered. Please check your inbox for the activation link'
      );
    }

    let organization: Organization;
    // Check if the configs allows user signups
    if (this.configService.get<string>('DISABLE_MULTI_WORKSPACE') === 'true') {
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

    const names = { firstName: '', lastName: '' };
    if (name) {
      const [firstName, ...rest] = name.split(' ');
      names['firstName'] = firstName;
      if (rest.length != 0) {
        const lastName = rest.join(' ');
        names['lastName'] = lastName;
      }
    }

    await dbTransactionWrap(async (manager: EntityManager) => {
      // Create default organization
      organization = await this.organizationsService.create('Untitled workspace', null, manager);
      const user = await this.usersService.create(
        {
          email,
          password,
          ...(names.firstName && { firstName: names.firstName }),
          ...(names.lastName && { lastName: names.lastName }),
          ...getUserStatusAndSource(lifecycleEvents.USER_SIGN_UP),
        },
        organization.id,
        ['all_users', 'admin'],
        existingUser,
        true,
        null,
        manager
      );
      await this.organizationUsersService.create(user, organization, true, manager);
      await this.emailService.sendWelcomeEmail(user.email, user.firstName, user.invitationToken);
    });
    return {};
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('Email address not found');
    }
    const forgotPasswordToken = uuid.v4();
    await this.usersService.updateUser(user.id, { forgotPasswordToken });
    await this.emailService.sendPasswordResetEmail(email, forgotPasswordToken);
  }

  async resetPassword(token: string, password: string) {
    const user = await this.usersService.findByPasswordResetToken(token);
    if (!user) {
      throw new NotFoundException('Invalid URL');
    } else {
      await this.usersService.updateUser(user.id, {
        password,
        forgotPasswordToken: null,
        passwordRetryCount: 0,
      });
    }
  }

  private splitName(name: string): { firstName: string; lastName: string } {
    const nameObj = { firstName: '', lastName: '' };
    if (name) {
      const [firstName, ...rest] = name.split(' ');
      nameObj.firstName = firstName;
      if (rest.length != 0) {
        nameObj.lastName = rest.join(' ');
      }
    }
    return nameObj;
  }

  async setupAdmin(userCreateDto: CreateAdminDto): Promise<any> {
    const { companyName, companySize, name, role, workspace, password, email } = userCreateDto;

    const nameObj = this.splitName(name);

    return await dbTransactionWrap(async (manager: EntityManager) => {
      // Create first organization
      const organization = await this.organizationsService.create(workspace || 'Untitled workspace', null, manager);
      const user = await this.usersService.create(
        {
          email,
          password,
          ...(nameObj.firstName && { firstName: nameObj.firstName }),
          ...(nameObj.lastName && { lastName: nameObj.lastName }),
          ...getUserStatusAndSource(lifecycleEvents.USER_ADMIN_SETUP),
          companyName,
          companySize,
          role,
        },
        organization.id,
        ['all_users', 'admin'],
        null,
        false,
        null,
        manager
      );
      await this.organizationUsersService.create(user, organization, false, manager);
      return this.generateLoginResultPayload(user, organization, false, true, manager);
    });
  }

  async setupAccountFromInvitationToken(userCreateDto: CreateUserDto) {
    const { companyName, companySize, token, role, organizationToken, password, source } = userCreateDto;

    if (!token) {
      throw new BadRequestException('Invalid token');
    }

    return await dbTransactionWrap(async (manager: EntityManager) => {
      const user: User = await manager.findOne(User, { where: { invitationToken: token } });
      let organizationUser: OrganizationUser;
      let isSSOVerify: boolean;

      if (organizationToken) {
        organizationUser = await manager.findOne(OrganizationUser, {
          where: { invitationToken: organizationToken },
          relations: ['user'],
        });
      }
      if (user?.organizationUsers) {
        if (isPasswordMandatory(user.source) && !password) {
          throw new BadRequestException('Please enter password');
        }
        // Getting default workspace
        const defaultOrganizationUser: OrganizationUser = user.organizationUsers.find(
          (ou) => ou.organizationId === user.defaultOrganizationId
        );

        if (!defaultOrganizationUser) {
          throw new BadRequestException('Invalid invitation link');
        }

        isSSOVerify = source === URL_SSO_SOURCE && (user.source === SOURCE.GOOGLE || user.source === SOURCE.GIT);

        const lifecycleParams = getUserStatusAndSource(
          isSSOVerify ? lifecycleEvents.USER_SSO_ACTIVATE : lifecycleEvents.USER_REDEEM,
          organizationUser ? SOURCE.INVITE : SOURCE.SIGNUP
        );

        await this.usersService.updateUser(
          user.id,
          {
            ...(role ? { role } : {}),
            companySize,
            companyName,
            invitationToken: null,
            ...(isPasswordMandatory(user.source) ? { password } : {}),
            ...lifecycleParams,
            updatedAt: new Date(),
          },
          manager
        );

        // Activate default workspace
        await this.organizationUsersService.activateOrganization(defaultOrganizationUser, manager);

        if (companyName) {
          await manager.update(Organization, user.defaultOrganizationId, {
            name: companyName,
          });
        }
      } else {
        throw new BadRequestException('Invalid invitation link');
      }

      if (this.configService.get<string>('DISABLE_MULTI_WORKSPACE') !== 'true' && organizationUser) {
        // Activate invited workspace
        await this.organizationUsersService.activateOrganization(organizationUser, manager);

        // Setting this workspace as default one to load it
        await this.usersService.updateUser(
          organizationUser.user.id,
          { defaultOrganizationId: organizationUser.organizationId },
          manager
        );
      }

      const organization = await manager.findOne(Organization, {
        where: {
          id: organizationUser?.organizationId || user.defaultOrganizationId,
        },
      });

      const isInstanceSSOLogin = !organizationUser && isSSOVerify;

      return this.generateLoginResultPayload(user, organization, isInstanceSSOLogin, !isSSOVerify, manager);
    });
  }

  async acceptOrganizationInvite(acceptInviteDto: AcceptInviteDto) {
    const { password, token } = acceptInviteDto;
    const isSingleWorkspace = this.configService.get<string>('DISABLE_MULTI_WORKSPACE') === 'true';

    return await dbTransactionWrap(async (manager: EntityManager) => {
      const organizationUser = await manager.findOne(OrganizationUser, {
        where: { invitationToken: token },
        relations: ['user', 'organization'],
      });

      if (!organizationUser?.user) {
        throw new BadRequestException('Invalid invitation link');
      }
      const user: User = organizationUser.user;

      if (!isSingleWorkspace && user.invitationToken) {
        // User sign up link send - not activated account
        this.emailService
          .sendWelcomeEmail(
            user.email,
            `${user.firstName} ${user.lastName}`,
            user.invitationToken,
            `${organizationUser.invitationToken}?oid=${organizationUser.organizationId}`
          )
          .catch((err) => console.error('Error while sending welcome mail', err));
        throw new UnauthorizedException(
          'Please setup your account using account setup link shared via email before accepting the invite'
        );
      }

      if (isSingleWorkspace) {
        if (user.invitationToken && !password) {
          // user in invited state, password mandatory
          throw new BadRequestException('Please enter password');
        }
        // set new password
        await this.usersService.updateUser(
          user.id,
          {
            ...(password ? { password } : {}),
            invitationToken: null,
            passwordRetryCount: 0,
            ...getUserStatusAndSource(lifecycleEvents.USER_REDEEM),
          },
          manager
        );
      } else {
        await this.usersService.updateUser(
          user.id,
          { defaultOrganizationId: organizationUser.organizationId },
          manager
        );
      }
      await this.organizationUsersService.activateOrganization(organizationUser, manager);

      if (isSingleWorkspace) {
        // Sign in
        return {
          user: await this.generateLoginResultPayload(user, organizationUser.organization, false, true, manager),
        };
      }
      return;
    });
  }

  async verifyInviteToken(token: string, organizationToken?: string) {
    const user: User = await this.usersRepository.findOne({ where: { invitationToken: token } });
    let organizationUser: OrganizationUser;

    if (organizationToken) {
      organizationUser = await this.organizationUsersRepository.findOne({
        where: { invitationToken: organizationToken },
        relations: ['user'],
      });

      if (!user && organizationUser) {
        return {
          redirect_url: `${this.configService.get<string>(
            'TOOLJET_HOST'
          )}/organization-invitations/${organizationToken}`,
        };
      } else if (user && !organizationUser) {
        return {
          redirect_url: `${this.configService.get<string>('TOOLJET_HOST')}/invitations/${token}`,
        };
      }
    }

    if (!user) {
      throw new BadRequestException('Invalid token');
    }

    if (user.status === USER_STATUS.ARCHIVED) {
      throw new BadRequestException(getUserErrorMessages(user.status));
    }

    await this.usersService.updateUser(user.id, getUserStatusAndSource(lifecycleEvents.USER_VERIFY, user.source));

    return {
      email: user.email,
      name: `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`,
      onboarding_details: {
        password: isPasswordMandatory(user.source), // Should accept password if user is setting up first time
        questions:
          (this.configService.get<string>('ENABLE_ONBOARDING_QUESTIONS_FOR_ALL_SIGN_UPS') === 'true' &&
            !organizationUser) || // Should ask onboarding questions if first user of the instance. If ENABLE_ONBOARDING_QUESTIONS_FOR_ALL_SIGN_UPS=true, then will ask questions to all signup users
          (await this.usersRepository.count({ where: { status: USER_STATUS.ACTIVE } })) === 0,
      },
    };
  }

  async verifyOrganizationToken(token: string) {
    const isSingleWorkspace = this.configService.get<string>('DISABLE_MULTI_WORKSPACE') === 'true';
    const organizationUser: OrganizationUser = await this.organizationUsersRepository.findOne({
      where: { invitationToken: token },
      relations: ['user'],
    });

    const user: User = organizationUser?.user;
    if (!user) {
      throw new BadRequestException('Invalid token');
    }
    if (user.status === USER_STATUS.ARCHIVED || (!isSingleWorkspace && user.status !== USER_STATUS.ACTIVE)) {
      throw new BadRequestException(getUserErrorMessages(user.status));
    }

    if (isSingleWorkspace) {
      await this.usersService.updateUser(user.id, getUserStatusAndSource(lifecycleEvents.USER_VERIFY));
    }

    return {
      email: user.email,
      name: `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`,
      onboarding_details: {
        password: isSingleWorkspace && user.invitationToken, // Should accept password for Single workspace if initial setup
      },
    };
  }

  async generateLoginResultPayload(
    user: User,
    organization: DeepPartial<Organization>,
    isInstanceSSO: boolean,
    isPasswordLogin: boolean,
    manager?: EntityManager
  ): Promise<any> {
    const JWTPayload: JWTPayload = {
      username: user.id,
      sub: user.email,
      organizationId: organization.id,
      isSSOLogin: isInstanceSSO,
      isPasswordLogin,
    };
    user.organizationId = organization.id;

    return decamelizeKeys({
      id: user.id,
      authToken: this.jwtService.sign(JWTPayload),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      organizationId: organization.id,
      organization: organization.name,
      admin: await this.usersService.hasGroup(user, 'admin', null, manager),
      groupPermissions: await this.usersService.groupPermissions(user, manager),
      appGroupPermissions: await this.usersService.appGroupPermissions(user, null, manager),
    });
  }
}

interface JWTPayload {
  username: string;
  sub: string;
  organizationId: string;
  isSSOLogin: boolean;
  isPasswordLogin: boolean;
}
