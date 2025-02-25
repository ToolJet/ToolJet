import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { User } from '../../entities/user.entity';
import { Organization } from 'src/entities/organization.entity';
import { ConfigService } from '@nestjs/config';
import { EntityManager } from 'typeorm';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { CreateAdminDto, OnboardUserDto, TrialUserDto } from '@modules/onboarding/dto/user.dto';
import { AcceptInviteDto } from '@modules/onboarding/dto/accept-organization-invite.dto';
import {
  getUserErrorMessages,
  getUserStatusAndSource,
  isPasswordMandatory,
  USER_STATUS,
  lifecycleEvents,
  SOURCE,
  URL_SSO_SOURCE,
  WORKSPACE_USER_STATUS,
  WORKSPACE_USER_SOURCE,
} from '@modules/users/constants/lifecycle';
import {
  generateInviteURL,
  generateNextNameAndSlug,
  generateOrgInviteURL,
  isValidDomain,
  generateWorkspaceSlug,
} from 'src/helpers/utils.helper';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { Response } from 'express';
import { LicenseCountsService } from '@modules/licensing/services/count.service';
import { uuid4 } from '@sentry/utils';
import { USER_ROLE } from '@modules/group-permissions/constants';
import { ActivateAccountWithTokenDto } from '@modules/onboarding/dto/activate-account-with-token.dto';
import { AppSignupDto } from '@modules/auth/dto';
import { SIGNUP_ERRORS } from 'src/helpers/errors.constants';
const uuid = require('uuid');
import { INSTANCE_SYSTEM_SETTINGS, INSTANCE_USER_SETTINGS } from '@modules/instance-settings/constants';
import { ResendInviteDto } from '@modules/onboarding/dto/resend-invite.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrganizationRepository } from '@modules/organizations/repository';
import { EMAIL_EVENTS } from '@modules/email/constants';
import { OnboardingCompletedDto } from '@modules/onboarding/dto';
import { UserRepository } from '../users/repository';
import { OnboardingUtilService } from './util.service';
import { SessionUtilService } from '../session/util.service';
import { OrganizationUsersUtilService } from '../organization-users/util.service';
import { OrganizationUsersRepository } from '../organization-users/repository';
import { LicenseUserService } from '../licensing/services/user.service';
import { InstanceSettingsUtilService } from '@modules/instance-settings/util.service';
import { MetadataUtilService } from '@modules/meta/util.service';
import { OnboardingStatus } from './constants';
import { LicenseUtilService } from '@modules/licensing/util.service';
import { IOnboardingService } from './interfaces/IService';
import { SetupOrganizationsUtilService } from '@modules/setup-organization/util.service';
@Injectable()
export class OnboardingService implements IOnboardingService {
  constructor(
    protected readonly userRepository: UserRepository,
    protected readonly onboardingUtilService: OnboardingUtilService,
    protected readonly sessionUtilService: SessionUtilService,
    protected readonly organizationUsersRepository: OrganizationUsersRepository,
    protected readonly organizationRepository: OrganizationRepository,
    protected readonly configService: ConfigService,
    protected readonly licenseUtilService: LicenseUtilService,
    protected readonly licenseCountsService: LicenseCountsService,
    protected readonly eventEmitter: EventEmitter2,
    protected readonly organizationUsersUtilService: OrganizationUsersUtilService,
    protected readonly licenseUserService: LicenseUserService,
    protected readonly instanceSettingsUtilService: InstanceSettingsUtilService,
    protected readonly metadataUtilService: MetadataUtilService,
    protected readonly setupOrganizationsUtilService: SetupOrganizationsUtilService
  ) {}

  async signup(appSignUpDto: AppSignupDto) {
    const { name, email, password, organizationId, redirectTo } = appSignUpDto;

    return dbTransactionWrap(async (manager: EntityManager) => {
      // Check if the configs allows user signups
      if (this.configService.get<string>('DISABLE_SIGNUPS') === 'true') {
        throw new NotAcceptableException();
      }

      const existingUser = await this.userRepository.findByEmail(email);
      let signingUpOrganization: Organization;

      if (organizationId) {
        signingUpOrganization = await this.organizationRepository.get(organizationId);
        if (!signingUpOrganization) {
          throw new NotFoundException('Could not found organization details. Please verify the orgnization id');
        }
        /* Check if the workspace allows user signup or not */
        const { enableSignUp, domain } = signingUpOrganization;
        if (!enableSignUp) {
          throw new ForbiddenException('Workspace signup has been disabled. Please contact the workspace admin.');
        }
        if (!isValidDomain(email, domain)) {
          throw new ForbiddenException('You cannot sign up using the email address - Domain verification failed.');
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
      const { firstName, lastName } = names;
      const userParams = { email, password, firstName, lastName };

      if (existingUser) {
        // Handling instance and workspace level signup for existing user
        return await this.onboardingUtilService.whatIfTheSignUpIsAtTheWorkspaceLevel(
          existingUser,
          signingUpOrganization,
          userParams,
          redirectTo,
          manager
        );
      } else {
        return await this.onboardingUtilService.createUserOrPersonalWorkspace(
          userParams,
          existingUser,
          signingUpOrganization,
          redirectTo,
          manager
        );
      }
    });
  }

  async setupAdmin(response: Response, userCreateDto: CreateAdminDto): Promise<any> {
    const { companyName, companySize, name, role, workspace, password, email, phoneNumber, requestedTrial } =
      userCreateDto;

    const nameObj = this.onboardingUtilService.splitName(name);

    const result = await dbTransactionWrap(async (manager: EntityManager) => {
      // Create first organization
      const organization = await this.organizationRepository.createOne(
        workspace || 'My workspace',
        'my-workspace',
        manager
      );

      const user = await this.onboardingUtilService.createUserWithRole(
        {
          email,
          password,
          ...(nameObj.firstName && { firstName: nameObj.firstName }),
          ...(nameObj.lastName && { lastName: nameObj.lastName }),
          ...getUserStatusAndSource(lifecycleEvents.USER_ADMIN_SETUP),
          companyName,
          companySize,
          role,
          phoneNumber,
        },
        organization.id,
        USER_ROLE.ADMIN,
        manager
      );

      await this.organizationUsersRepository.createOne(user, organization, false, manager);
      if (requestedTrial) await this.onboardingUtilService.activateTrialForUser(new TrialUserDto(userCreateDto));
      await this.instanceSettingsUtilService.updateSystemParams({
        [INSTANCE_SYSTEM_SETTINGS.ENABLE_WORKSPACE_LOGIN_CONFIGURATION]: false,
        [INSTANCE_SYSTEM_SETTINGS.ENABLE_SIGNUP]: false,
      });
      await this.instanceSettingsUtilService.updateUserParams({
        settings: [
          {
            key: INSTANCE_USER_SETTINGS.ALLOW_PERSONAL_WORKSPACE,
            value: false,
          },
        ],
      });
      return this.sessionUtilService.generateLoginResultPayload(
        response,
        user,
        organization,
        false,
        true,
        null,
        manager
      );
    });

    // await this.metadataService.finishOnboarding(new TelemetryDataDto(userCreateDto));
    return result;
  }

  async setupAccountFromInvitationToken(response: Response, userCreateDto: OnboardUserDto) {
    const {
      companyName,
      buildPurpose,
      token,
      organizationToken,
      password: userPassword,
      source,
      workspaceName,
    } = userCreateDto;
    let password = userPassword;

    if (!token) {
      throw new BadRequestException('Invalid token');
    }

    return await dbTransactionWrap(async (manager: EntityManager) => {
      const user: User | undefined = await manager.findOne(User, { where: { invitationToken: token } });
      let organizationUser: OrganizationUser;
      let isSSOVerify: boolean;

      const allowPersonalWorkspace =
        (await this.userRepository.count()) === 0 ||
        (await this.instanceSettingsUtilService.getSettings(INSTANCE_USER_SETTINGS.ALLOW_PERSONAL_WORKSPACE)) ===
          'true';

      if (!(allowPersonalWorkspace || organizationToken)) {
        throw new BadRequestException('Invalid invitation link');
      }
      if (organizationToken) {
        organizationUser = await manager.findOne(OrganizationUser, {
          where: { invitationToken: organizationToken },
          relations: ['user'],
        });
      }

      if (!password && source === URL_SSO_SOURCE) {
        /* For SSO we don't need password. let us set uuid as a password. */
        password = uuid4();
      }

      if (user?.organizationUsers) {
        if (!password && source === 'sso') {
          /* For SSO we don't need password. let us set uuid as a password. */
          password = uuid.v4();
        }

        if (isPasswordMandatory(user.source) && !password) {
          throw new BadRequestException('Please enter password');
        }

        if (allowPersonalWorkspace) {
          // Getting default workspace
          const defaultOrganizationUser: OrganizationUser = user.organizationUsers.find(
            (ou) => ou.organizationId === user.defaultOrganizationId
          );

          if (!defaultOrganizationUser) {
            throw new BadRequestException('Invalid invitation link');
          }

          // Activate default workspace
          await this.organizationUsersUtilService.activateOrganization(defaultOrganizationUser, manager);

          if (workspaceName) {
            const { slug } = generateNextNameAndSlug('My workspace');
            await this.organizationRepository.updateOne(
              defaultOrganizationUser.organizationId,
              {
                name: workspaceName,
                slug: slug,
              },
              manager
            );
          }
        }

        isSSOVerify =
          source === URL_SSO_SOURCE &&
          (user.source === SOURCE.GOOGLE ||
            user.source === SOURCE.GIT ||
            user.source === SOURCE.OPENID ||
            user.source === SOURCE.SAML ||
            user.source === SOURCE.LDAP);

        const lifecycleParams = getUserStatusAndSource(
          isSSOVerify ? lifecycleEvents.USER_SSO_ACTIVATE : lifecycleEvents.USER_REDEEM,
          organizationUser ? SOURCE.INVITE : SOURCE.SIGNUP
        );

        const onboardingDetails = {
          companyName,
          buildPurpose,
        };
        const onboardingStatus =
          onboardingDetails.companyName && onboardingDetails.buildPurpose
            ? OnboardingStatus.ACCOUNT_CREATED
            : OnboardingStatus.NOT_STARTED;

        await this.userRepository.updateOne(
          user.id,
          {
            companyName,
            onboardingStatus,
            invitationToken: null,
            ...(isPasswordMandatory(user.source) ? { password } : {}),
            ...lifecycleParams,
            updatedAt: new Date(),
          },
          manager
        );
        await this.onboardingUtilService.updateOnboardingDetails(user.id, onboardingDetails, manager);
      } else {
        throw new BadRequestException('Invalid invitation link');
      }

      if (organizationUser) {
        // Activate invited workspace
        await this.organizationUsersUtilService.activateOrganization(organizationUser, manager);

        // Setting this workspace as default one to load it
        await this.userRepository.updateOne(
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

      // this.eventEmitter.emit(
      //   'auditLogEntry',
      //   {
      //     userId: user.id,
      //     organizationId: organization?.id,
      //     resourceId: user.id,
      //     resourceName: user.email,
      //     resourceType: ResourceTypes.USER,
      //     actionType: ActionTypes.USER_INVITE_REDEEM,
      //   },
      //   manager
      // );

      await this.licenseUserService.validateUser(manager);
      return this.sessionUtilService.generateLoginResultPayload(
        response,
        user,
        organization,
        isInstanceSSOLogin,
        !isSSOVerify
      );
    });
  }

  async acceptOrganizationInvite(response: Response, loggedInUser: User, acceptInviteDto: AcceptInviteDto) {
    const { token } = acceptInviteDto;

    return await dbTransactionWrap(async (manager: EntityManager) => {
      const organizationUser: OrganizationUser = await manager.findOne(OrganizationUser, {
        where: { invitationToken: token },
        relations: ['user', 'organization'],
      });

      if (!organizationUser?.user) {
        throw new BadRequestException('Invalid invitation link');
      }
      const user: User = organizationUser.user;

      if (user.invitationToken) {
        // User sign up link send - not activated account
        this.eventEmitter.emit('emailEvent', {
          type: EMAIL_EVENTS.SEND_WELCOME_EMAIL,
          payload: {
            to: user.email,
            name: `${user.firstName} ${user.lastName}` || '',
            invitationtoken: user.invitationToken,
            organizationInvitationToken: `${organizationUser.invitationToken}`,
            organizationId: organizationUser?.organizationId,
          },
        });
        throw new UnauthorizedException(
          'Please setup your account using account setup link shared via email before accepting the invite'
        );
      }
      await this.userRepository.updateOne(user.id, { defaultOrganizationId: organizationUser.organizationId }, manager);
      const organization = await this.organizationRepository.get(organizationUser.organizationId);
      const activeWorkspacesCount = await this.organizationUsersRepository.getActiveWorkspacesCount(user.id);
      await this.organizationUsersUtilService.activateOrganization(organizationUser, manager);
      const personalWorkspacesCount = await this.organizationUsersUtilService.personalWorkspaceCount(user.id);
      if (personalWorkspacesCount === 1 && activeWorkspacesCount === 0) {
        /* User already signed up thorugh instance signup page. but now needs to signup through workspace signup page */
        /* Activate the personal workspace */
        const organizationUser = await manager.findOne(OrganizationUser, {
          where: { organizationId: user.defaultOrganizationId },
          relations: ['user', 'organization'],
        });
        await this.organizationUsersUtilService.activateOrganization(organizationUser, manager);
      }
      const isWorkspaceSignup = organizationUser.source === WORKSPACE_USER_SOURCE.SIGNUP;
      await this.licenseUserService.validateUser(manager);
      return this.sessionUtilService.generateLoginResultPayload(
        response,
        user,
        organization,
        false,
        isWorkspaceSignup,
        loggedInUser,
        manager
      );
    });
  }

  async verifyInviteToken(token: string, organizationToken?: string) {
    const user: User = await this.userRepository.findOne({ where: { invitationToken: token } });
    let organizationUser: OrganizationUser;

    if (organizationToken) {
      organizationUser = await this.organizationUsersRepository.findOne({
        where: { invitationToken: organizationToken },
        relations: ['user'],
      });

      if (!user && organizationUser) {
        return {
          redirect_url: generateOrgInviteURL(organizationToken, organizationUser.organizationId),
        };
      } else if (user && !organizationUser) {
        return {
          redirect_url: generateInviteURL(token),
        };
      }
    }

    if (!user) {
      throw new BadRequestException('Invalid token');
    }

    if (user.status === USER_STATUS.ARCHIVED) {
      throw new BadRequestException(getUserErrorMessages(user.status));
    }

    await this.userRepository.updateOne(user.id, getUserStatusAndSource(lifecycleEvents.USER_VERIFY, user.source));

    return {
      email: user.email,
      name: `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`,
      onboarding_details: {
        status: user.onboardingStatus,
        password: isPasswordMandatory(user.source), // Should accept password if user is setting up first time
        questions:
          (this.configService.get<string>('ENABLE_ONBOARDING_QUESTIONS_FOR_ALL_SIGN_UPS') === 'true' &&
            !organizationUser) || // Should ask onboarding questions if first user of the instance. If ENABLE_ONBOARDING_QUESTIONS_FOR_ALL_SIGN_UPS=true, then will ask questions to all signup users
          (await this.userRepository.count({ where: { status: USER_STATUS.ACTIVE } })) === 0,
      },
    };
  }

  async activateAccountWithToken(activateAccountWithToken: ActivateAccountWithTokenDto, response: Response) {
    const { email, password, organizationToken } = activateAccountWithToken;
    const signupUser = await this.userRepository.findByEmail(email);
    const invitedUser = await this.organizationUsersUtilService.findByWorkspaceInviteToken(organizationToken);

    /* Server level check for this API */
    if (!signupUser || invitedUser.email.toLowerCase() !== signupUser.email.toLowerCase()) {
      const { type, message, inputError } = SIGNUP_ERRORS.INCORRECT_INVITED_EMAIL;
      const errorResponse = {
        message: {
          message,
          type,
          inputError,
        },
      };
      throw new NotAcceptableException(errorResponse);
    }

    if (signupUser?.organizationUsers?.some((ou) => ou.status === WORKSPACE_USER_STATUS.ACTIVE)) {
      throw new NotAcceptableException('Email already exists');
    }

    const lifecycleParams = getUserStatusAndSource(lifecycleEvents.USER_REDEEM, SOURCE.INVITE);

    return await dbTransactionWrap(async (manager: EntityManager) => {
      // Activate default workspace if user has one
      const defaultOrganizationUser: OrganizationUser = signupUser.organizationUsers.find(
        (ou) => ou.organizationId === signupUser.defaultOrganizationId
      );
      let defaultOrganization: Organization;
      /* CASE: if the user somehow get the invitation from workspace via super-admin */
      if (defaultOrganizationUser && invitedUser.source !== SOURCE.SIGNUP) {
        await this.organizationUsersUtilService.activateOrganization(defaultOrganizationUser, manager);
        defaultOrganization = await this.organizationRepository.fetchOrganization(
          defaultOrganizationUser.organizationId
        );
      }

      await this.userRepository.updateOne(
        signupUser.id,
        {
          password,
          invitationToken: null,
          ...(password ? { password } : {}),
          ...lifecycleParams,
          updatedAt: new Date(),
        },
        manager
      );

      /* 
          Generate org invite and send back to the client. Let him join to the workspace
          CASE: user redirected to signup to activate his account with password. 
          Till now user doesn't have an organization.
        */
      await this.licenseUserService.validateUser(manager);
      return this.onboardingUtilService.processOrganizationSignup(
        response,
        signupUser,
        { invitationToken: organizationToken, organizationId: invitedUser['invitedOrganizationId'] },
        manager,
        defaultOrganization
      );
    });
  }

  async getInviteeDetails(token: string) {
    const organizationUser: OrganizationUser = await this.organizationUsersRepository.findOneOrFail({
      where: { invitationToken: token },
      select: ['id', 'user'],
      relations: ['user'],
    });
    return { email: organizationUser.user.email };
  }

  async verifyOrganizationToken(token: string) {
    const organizationUser: OrganizationUser = await this.organizationUsersRepository.findOne({
      where: { invitationToken: token },
      relations: ['user'],
    });

    const user: User = organizationUser?.user;
    if (!user) {
      throw new BadRequestException('Invalid token');
    }
    if (user.status !== USER_STATUS.ACTIVE) {
      throw new BadRequestException(getUserErrorMessages(user.status));
    }

    // this.eventEmitter.emit('auditLogEntry', {
    //   userId: user.id,
    //   organizationId: organizationUser.organizationId,
    //   resourceId: user.id,
    //   resourceName: user.email,
    //   resourceType: ResourceTypes.USER,
    //   actionType: ActionTypes.USER_INVITE_REDEEM,
    // });

    return {
      email: user.email,
      name: `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`,
      onboarding_details: {
        password: false, // Should not accept password for organization token
      },
    };
  }

  async resendEmail(body: ResendInviteDto) {
    const { email, organizationId, redirectTo } = body;
    if (!email) {
      throw new BadRequestException();
    }
    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser?.status === USER_STATUS.ARCHIVED) {
      throw new NotAcceptableException('User has been archived, please contact the administrator');
    }

    if (!organizationId && existingUser?.organizationUsers?.some((ou) => ou.status === WORKSPACE_USER_STATUS.ACTIVE)) {
      throw new NotAcceptableException('Email already exists');
    }

    let organizationUser: OrganizationUser;
    if (organizationId) {
      /* Workspace signup invitation email */
      organizationUser = existingUser.organizationUsers.find(
        (organizationUser) => organizationUser.organizationId === organizationId
      );
      if (organizationUser.status === WORKSPACE_USER_STATUS.ACTIVE) {
        throw new NotAcceptableException('User already exists in the workspace.');
      }
      if (organizationUser.status === WORKSPACE_USER_STATUS.ARCHIVED) {
        throw new NotAcceptableException('User has been archived, please contact the administrator');
      }
    }

    if (organizationUser) {
      const invitedOrganization = await this.organizationRepository.findOne({
        where: { id: organizationUser.organizationId },
        select: ['name', 'id'],
      });
      if (existingUser.invitationToken) {
        /* Not activated. */
        this.eventEmitter.emit('emailEvent', {
          type: EMAIL_EVENTS.SEND_WELCOME_EMAIL,
          payload: {
            to: existingUser.email,
            name: existingUser.firstName,
            invitationtoken: existingUser.invitationToken,
            organizationInvitationToken: organizationUser.invitationToken,
            organizationId: organizationUser.organizationId,
            organizationName: invitedOrganization.name,
            sender: null,
            redirectTo: redirectTo,
          },
        });
        return;
      } else {
        /* Already activated */
        this.eventEmitter.emit('emailEvent', {
          type: EMAIL_EVENTS.SEND_ORGANIZATION_USER_WELCOME_EMAIL,
          payload: {
            to: existingUser.email,
            name: existingUser.firstName,
            sender: null,
            invitationtoken: organizationUser.invitationToken,
            organizationName: invitedOrganization.name,
            organizationId: organizationUser.organizationId,
            redirectTo: redirectTo,
          },
        });
        return;
      }
    }

    if (existingUser?.invitationToken) {
      this.eventEmitter.emit('emailEvent', {
        type: EMAIL_EVENTS.SEND_WELCOME_EMAIL,
        payload: {
          to: existingUser.email,
          name: existingUser.firstName,
          invitationtoken: existingUser.invitationToken,
        },
      });
      return;
    }
  }

  async getSuperAdminOnboardingDetails(user: User) {
    return await this.onboardingUtilService.getCommonOnboardingDetails(user);
  }

  async getSignupUserOnboardingDetails(user: User) {
    return {
      ...(await this.onboardingUtilService.getCommonOnboardingDetails(user)),
      userId: user.id,
      resumeOnboardingSession: ![OnboardingStatus.NOT_STARTED, OnboardingStatus.ONBOARDING_COMPLETED].includes(
        user.onboardingStatus as OnboardingStatus
      ),
    };
  }

  async finishOnboarding(user: User, body: OnboardingCompletedDto) {
    await this.onboardingUtilService.updateOnboardingStatus(user.id, OnboardingStatus.ONBOARDING_COMPLETED);
    await this.metadataUtilService.finishOnboarding({
      name: user.firstName,
      email: user.email,
      companyName: user.companyName,
      region: body.region,
    });
  }
  async checkWorkspaceNameUniqueness(name: string) {
    if (!name) {
      throw new NotAcceptableException('Request should contain workspace name');
    }
    const result = await this.organizationRepository.findOne({
      where: {
        ...(name && { name }),
      },
    });
    if (result) throw new ConflictException('Workspace name must be unique');
    return;
  }

  async setupFirstUser(response: Response, userCreateDto: CreateAdminDto): Promise<any> {
    const { name, workspaceName, password, email } = userCreateDto;

    const result = await dbTransactionWrap(async (manager: EntityManager) => {
      // Create first organization
      const workspaceSlug = generateWorkspaceSlug(workspaceName || 'My workspace');
      const organization = await this.setupOrganizationsUtilService.create(
        workspaceName || 'My workspace',
        workspaceSlug,
        null,
        manager
      );

      const nameObj = this.onboardingUtilService.splitName(name);
      const user = await this.onboardingUtilService.createUserWithRole(
        {
          email,
          password,
          ...(nameObj.firstName && { firstName: nameObj.firstName }),
          ...(nameObj.lastName && { lastName: nameObj.lastName }),
          ...getUserStatusAndSource(lifecycleEvents.USER_ADMIN_SETUP),
        },
        organization.id,
        USER_ROLE.ADMIN,
        manager
      );

      await this.organizationUsersRepository.createOne(user, organization, false, manager);
      return this.sessionUtilService.generateLoginResultPayload(
        response,
        user,
        organization,
        false,
        true,
        null,
        manager
      );
    });

    await this.metadataUtilService.finishOnboarding({ name, email, companyName: workspaceName, region: '' });
    return result;
  }
}
