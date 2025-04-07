import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@entities/user.entity';
import { UserRepository } from '@modules/users/repository';
import { OrganizationUser } from '../../entities/organization_user.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TrialUserDto } from '@modules/onboarding/dto/user.dto';
import { LicenseCountsService } from '../licensing/services/count.service';
import { LICENSE_TRIAL_API } from '../licensing/constants';
import got from 'got/dist/source';
import { HttpException } from '@nestjs/common';
import { fullName, generateNextNameAndSlug, generateOrgInviteURL } from 'src/helpers/utils.helper';
import { NotAcceptableException } from '@nestjs/common';
import { Organization } from '../../entities/organization.entity';
import { EntityManager } from 'typeorm';
import {
  getUserStatusAndSource,
  lifecycleEvents,
  SOURCE,
  WORKSPACE_USER_STATUS,
  WORKSPACE_USER_SOURCE,
} from '@modules/users/constants/lifecycle';
import { INSTANCE_USER_SETTINGS } from '../instance-settings/constants';
import { OrganizationUsersUtilService } from '../organization-users/util.service';
import { OrganizationRepository } from '@modules/organizations/repository';
import { USER_ROLE } from '@modules/group-permissions/constants';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { SessionUtilService } from '../session/util.service';
import { Response } from 'express';
import { RolesUtilService } from '@modules/roles/util.service';
import { MetadataUtilService } from '@modules/meta/util.service';
import { LicenseUserService } from '@modules/licensing/services/user.service';
import { EMAIL_EVENTS } from '@modules/email/constants';
import { InstanceSettingsUtilService } from '@modules/instance-settings/util.service';
import { OrganizationUsersRepository } from '@modules/organization-users/repository';
import { USER_TYPE } from '@modules/users/constants/lifecycle';
import { LicenseUtilService } from '@modules/licensing/util.service';
import { OnboardingDetails } from '@entities/onboarding_details.entity';
import { UserOnboardingDetails } from './types';
import { OnboardingStatus } from './constants';
import { IOnboardingUtilService } from './interfaces/IUtilService';
import { SetupOrganizationsUtilService } from '@modules/setup-organization/util.service';
const uuid = require('uuid');

@Injectable()
export class OnboardingUtilService implements IOnboardingUtilService {
  constructor(
    protected readonly userRepository: UserRepository,
    protected readonly licenseUserService: LicenseUserService,
    protected readonly licenseUtilService: LicenseUtilService,
    protected readonly configService: ConfigService,
    protected readonly rolesUtilService: RolesUtilService,
    protected readonly eventEmitter: EventEmitter2,
    protected readonly licenseCountsService: LicenseCountsService,
    protected readonly organizationUsersUtilService: OrganizationUsersUtilService,
    protected readonly organizationRepository: OrganizationRepository,
    protected readonly sessionUtilService: SessionUtilService,
    protected readonly metaDataUtilService: MetadataUtilService,
    protected readonly instanceSettingsUtilService: InstanceSettingsUtilService,
    protected readonly organizationUserRepository: OrganizationUsersRepository,
    protected readonly setupOrganizationsUtilService: SetupOrganizationsUtilService
  ) {}

  async activateTrialForUser(userCreateDto: TrialUserDto) {
    const { companyName, companySize, name, role, email, phoneNumber } = userCreateDto;
    /* generate trial license if needed */
    const hostname = this.configService.get<string>('TOOLJET_HOST');
    const subpath = this.configService.get<string>('SUB_PATH');

    const metadata = await this.metaDataUtilService.getMetaData();
    const { id: customerId } = metadata;
    const otherData = { companySize, role, phoneNumber };

    await dbTransactionWrap(async (manager: EntityManager) => {
      const { editor, viewer } = await this.licenseCountsService.fetchTotalViewerEditorCount(manager);

      const body = {
        hostname,
        subpath,
        customerId,
        email,
        companyName,
        version: '3',
        user: {
          editor,
          viewer,
        },
        ...this.splitName(name),
        otherData,
      };

      try {
        const licenseResponse = await got(LICENSE_TRIAL_API, {
          method: 'POST',
          json: body,
        });
        const { license_key } = JSON.parse(licenseResponse.body);
        await this.licenseUtilService.updateLicense({ key: license_key });
      } catch (error) {
        const response = JSON.parse(error?.response?.body || '{}');
        throw new HttpException(response?.message || 'Trial could not be activated. Please try again!', 500);
      }
    });
  }

  async getCommonOnboardingDetails(user: User) {
    const name = fullName(user.firstName, user.lastName);
    const { companyName, buildPurpose } = await this.getOnboardingDetails();
    const adminDetails = {
      name,
      email: user.email,
    };
    const companyInfo = {
      companyName,
      buildPurpose,
    };
    const workspaceName = user.organization?.name;
    return {
      adminDetails,
      companyInfo,
      workspaceName,
      currentOrganizationId: user.organization.id,
      currentOrganizationSlug: user.organization?.slug,
      onboardingStatus: user.onboardingStatus,
    };
  }

  private async getOnboardingDetails() {
    const metadata = await this.metaDataUtilService.getMetaData();
    const { companyName, buildPurpose } = metadata.data['onboardingDetails'] || {};
    return {
      companyName,
      buildPurpose,
    };
  }

  splitName(name: string): { firstName: string; lastName: string } {
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

  whatIfTheSignUpIsAtTheWorkspaceLevel = async (
    existingUser: User,
    signingUpOrganization: Organization,
    userParams: { firstName: string; lastName: string; password: string },
    redirectTo?: string,
    manager?: EntityManager
  ) => {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const { firstName, lastName, password } = userParams;
      const organizationId: string = signingUpOrganization?.id;
      const organizationUsers = existingUser.organizationUsers;
      const alreadyInvitedUserByAdmin = organizationUsers.find(
        (organizationUser: OrganizationUser) =>
          organizationUser.organizationId === organizationId &&
          organizationUser.status === WORKSPACE_USER_STATUS.INVITED
      );
      const hasActiveWorkspaces = organizationUsers.some(
        (organizationUser: OrganizationUser) => organizationUser.status === WORKSPACE_USER_STATUS.ACTIVE
      );
      const hasSomeWorkspaceInvites = organizationUsers.some(
        (organizationUser: OrganizationUser) => organizationUser.status === WORKSPACE_USER_STATUS.INVITED
      );
      const isAlreadyActiveInWorkspace = organizationUsers.find(
        (organizationUser: OrganizationUser) =>
          organizationUser.organizationId === organizationId && organizationUser.status === WORKSPACE_USER_STATUS.ACTIVE
      );

      /*
    NOTE: Active user and account is different
    active account -> user.status == active && invitation_token is null
    active user -> has active account + active workspace (workspace status is active and invitation token is null)
    */

      /* User who missed the organization invite flow / user already got invite from the admin and want's to use workspace signup instead  */
      const activeAccountButnotActiveInWorkspace = !!alreadyInvitedUserByAdmin && !existingUser.invitationToken;
      const invitedButNotActivated = !!alreadyInvitedUserByAdmin && !!existingUser.invitationToken;
      const activeUserWantsToSignUpToWorkspace = hasActiveWorkspaces && !!organizationId && !isAlreadyActiveInWorkspace;
      const hasWorkspaceInviteButUserWantsInstanceSignup =
        !!existingUser?.invitationToken && hasSomeWorkspaceInvites && !organizationId;
      const isUserAlreadyExisted =
        !!isAlreadyActiveInWorkspace || hasActiveWorkspaces || !existingUser?.invitationToken;
      const workspaceSignupForInstanceSignedUpUserButNotActive =
        !!organizationId && !!existingUser?.invitationToken && !alreadyInvitedUserByAdmin;

      switch (true) {
        case workspaceSignupForInstanceSignedUpUserButNotActive:
        case invitedButNotActivated: {
          let organizationUser: OrganizationUser;
          if (alreadyInvitedUserByAdmin) {
            /*
            CASE: User is new and already got an invite from admin. But he choose to signup from workspace signup page
            Response: Send the org invite again and thorw an error
          */
            organizationUser = alreadyInvitedUserByAdmin;
          } else {
            /* 
            CASE: User signed up throug the instance page, but don't want to continue the invite floe. So decided to go with workspace signup 
            Response: Add the user to the workspace and send the organization and account invite again (eg: /invitations/<>/workspaces/<>).
          */
            organizationUser = await this.addUserToTheWorkspace(existingUser, signingUpOrganization, manager);
            await this.licenseUserService.validateUser(manager);
          }
          this.eventEmitter.emit('emailEvent', {
            type: EMAIL_EVENTS.SEND_WELCOME_EMAIL,
            payload: {
              to: existingUser.email,
              name: existingUser.firstName,
              invitationtoken: existingUser.invitationToken,
              organizationInvitationToken: organizationUser.invitationToken,
              organizationId: organizationUser.organizationId,
              organizationName: signingUpOrganization.name,
              sender: null,
              redirectTo: redirectTo,
            },
          });
          if (alreadyInvitedUserByAdmin) {
            throw new NotAcceptableException(
              'The user is already registered. Please check your inbox for the activation link'
            );
          }
          return {};
        }
        case activeAccountButnotActiveInWorkspace:
        case activeUserWantsToSignUpToWorkspace: {
          /* User is already active in some workspace but not in this workspace */
          let organizationUser: OrganizationUser;
          if (alreadyInvitedUserByAdmin) {
            organizationUser = alreadyInvitedUserByAdmin;
          } else {
            /* Create new organizations_user entry and send an invite */
            organizationUser = await this.addUserToTheWorkspace(existingUser, signingUpOrganization, manager);
            await this.licenseUserService.validateUser(manager);
          }
          return this.sendOrgInvite(
            { email: existingUser.email, firstName: existingUser.firstName },
            signingUpOrganization.name,
            signingUpOrganization.id,
            organizationUser.invitationToken,
            redirectTo,
            !!alreadyInvitedUserByAdmin
          );
        }
        case hasWorkspaceInviteButUserWantsInstanceSignup: {
          const firstTimeSignup = ![SOURCE.SIGNUP, SOURCE.WORKSPACE_SIGNUP].includes(existingUser.source as SOURCE);
          if (firstTimeSignup) {
            /* Invite user doing instance signup. So reset name fields and set password */
            let defaultOrganizationId = existingUser.defaultOrganizationId;
            const isPersonalWorkspaceAllowed =
              (await this.instanceSettingsUtilService.getSettings(INSTANCE_USER_SETTINGS.ALLOW_PERSONAL_WORKSPACE)) ===
              'true';
            if (!existingUser.defaultOrganizationId && isPersonalWorkspaceAllowed) {
              const personalWorkspaces = await this.organizationUsersUtilService.personalWorkspaces(existingUser.id);
              if (personalWorkspaces.length) {
                defaultOrganizationId = personalWorkspaces[0].organizationId;
              } else {
                /* Create a personal workspace for the user */
                const { name, slug } = generateNextNameAndSlug('My workspace');
                const defaultOrganization = await this.organizationRepository.createOne({ name, slug }, manager);
                defaultOrganizationId = defaultOrganization.id;
                await this.organizationUserRepository.createOne(existingUser, defaultOrganization, true, manager);
              }
              await this.rolesUtilService.addUserRole(defaultOrganizationId, {
                role: USER_ROLE.ADMIN,
                userId: existingUser.id,
              });
            }

            await this.userRepository.updateOne(
              existingUser.id,
              {
                ...(firstName && { firstName }),
                ...(lastName && { lastName }),
                password,
                source: SOURCE.SIGNUP,
                defaultOrganizationId,
              },
              manager
            );
          }
          await this.licenseUserService.validateUser(manager);
          this.eventEmitter.emit('emailEvent', {
            type: EMAIL_EVENTS.SEND_WELCOME_EMAIL,
            payload: {
              to: existingUser.email,
              name: existingUser.firstName,
              invitationtoken: existingUser.invitationToken,
            },
          });
          const errorMessage = 'The user is already registered. Please check your inbox for the activation link';
          if (!firstTimeSignup) throw new NotAcceptableException(errorMessage);
          return {};
        }
        case isUserAlreadyExisted: {
          const errorMessage = organizationId ? 'User already exists in the workspace.' : 'Email already exists.';
          throw new NotAcceptableException(errorMessage);
        }
        default:
          break;
      }
    }, manager);
  };

  private async addUserToTheWorkspace(existingUser: User, signingUpOrganization: Organization, manager: EntityManager) {
    await this.rolesUtilService.addUserRole(
      signingUpOrganization.id,
      { userId: existingUser.id, role: USER_ROLE.END_USER },
      manager
    );
    return this.organizationUserRepository.createOne(
      existingUser,
      signingUpOrganization,
      true,
      manager,
      WORKSPACE_USER_SOURCE.SIGNUP
    );
  }

  async processOrganizationSignup(
    response: Response,
    user: User,
    organizationParams: Partial<OrganizationUser>,
    manager?: EntityManager,
    defaultOrganization = null,
    source = 'signup'
  ) {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const { invitationToken, organizationId } = organizationParams;
      /* Active user want to signup to the organization case */
      const passwordLogin = source === 'signup';
      const session = defaultOrganization
        ? await this.sessionUtilService.generateLoginResultPayload(
            response,
            user,
            defaultOrganization,
            !passwordLogin,
            passwordLogin,
            null,
            manager,
            organizationId
          )
        : await this.sessionUtilService.generateInviteSignupPayload(response, user, source, manager);
      const organizationInviteUrl = generateOrgInviteURL(invitationToken, organizationId, false);
      return { ...session, organizationInviteUrl };
    }, manager);
  }

  private sendOrgInvite = (
    userParams: { email: string; firstName: string },
    signingUpOrganizationName: string,
    organizationId: string,
    invitationToken: string,
    redirectTo?: string,
    throwError = true
  ) => {
    this.eventEmitter.emit('emailEvent', {
      type: 'sendOrganizationUserWelcomeEmail',
      payload: {
        to: userParams.email,
        name: userParams.firstName,
        sender: null,
        invitationtoken: invitationToken,
        organizationName: signingUpOrganizationName,
        organizationId: organizationId,
        redirectTo: redirectTo,
      },
    });
    if (throwError) {
      throw new NotAcceptableException(
        'The user is already registered. Please check your inbox for the activation link'
      );
    } else {
      return {};
    }
  };

  createUserOrPersonalWorkspace = async (
    userParams: { email: string; password: string; firstName: string; lastName: string },
    existingUser: User,
    signingUpOrganization: Organization,
    redirectTo?: string,
    manager?: EntityManager
  ) => {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const { email, password, firstName, lastName } = userParams;
      /* Create personal workspace */
      const isPersonalWorkspaceEnabled =
        (await this.instanceSettingsUtilService.getSettings(INSTANCE_USER_SETTINGS.ALLOW_PERSONAL_WORKSPACE)) ===
        'true';

      let personalWorkspace: Organization;
      if (isPersonalWorkspaceEnabled) {
        const { name, slug } = generateNextNameAndSlug('My workspace');
        personalWorkspace = await this.setupOrganizationsUtilService.create({ name, slug }, null, manager);
      }
      const organizationRole = personalWorkspace ? USER_ROLE.ADMIN : USER_ROLE.END_USER;

      const organizationId = personalWorkspace ? personalWorkspace.id : signingUpOrganization.id;
      /* Create the user or attach user groups to the user */
      const lifeCycleParms = signingUpOrganization
        ? getUserStatusAndSource(lifecycleEvents.USER_WORKSPACE_SIGN_UP)
        : getUserStatusAndSource(lifecycleEvents.USER_SIGN_UP);
      const user = await this.create(
        {
          email,
          password,
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...lifeCycleParms,
        },
        organizationId,
        organizationRole,
        existingUser,
        true,
        null,
        manager,
        !isPersonalWorkspaceEnabled
      );

      if (personalWorkspace) {
        await this.organizationUserRepository.createOne(user, personalWorkspace, true, manager);
      }

      if (signingUpOrganization) {
        /* Attach the user and user groups to the organization */
        const organizationUser = await this.organizationUserRepository.createOne(
          user,
          signingUpOrganization,
          true,
          manager,
          WORKSPACE_USER_SOURCE.SIGNUP
        );

        if (personalWorkspace) {
          /* if the personal workspace is enabled for newly created users -> 
          attach a role in the signing up workspace 
          *This part will only run for user who is new to the instance and workspace at the same time
          */
          await this.rolesUtilService.addUserRole(
            signingUpOrganization.id,
            { role: USER_ROLE.END_USER, userId: user.id },
            manager
          );
        }

        await this.licenseUserService.validateUser(manager);
        this.eventEmitter.emit('emailEvent', {
          type: EMAIL_EVENTS.SEND_WELCOME_EMAIL,
          payload: {
            to: user.email,
            name: user.firstName,
            invitationtoken: user.invitationToken,
            organizationInvitationToken: organizationUser.invitationToken,
            organizationId: signingUpOrganization.id,
            organizationName: signingUpOrganization.name,
            sender: null,
            redirectTo: redirectTo,
          },
        });
        // this.eventEmitter.emit(
        //   'auditLogEntry',
        //   {
        //     userId: user.id,
        //     organizationId: signingUpOrganization.id,
        //     resourceId: user.id,
        //     resourceType: ResourceTypes.USER,
        //     resourceName: user.email,
        //     actionType: ActionTypes.USER_SIGNUP,
        //   },
        //   manager
        // );
        return {};
      } else {
        await this.licenseUserService.validateUser(manager);
        this.eventEmitter.emit('emailEvent', {
          type: EMAIL_EVENTS.SEND_WELCOME_EMAIL,
          payload: {
            to: user.email,
            name: user.firstName,
            invitationtoken: user.invitationToken,
          },
        });

        // this.eventEmitter.emit(
        //   'auditLogEntry',
        //   {
        //     userId: user.id,
        //     organizationId: personalWorkspace?.id,
        //     resourceId: user.id,
        //     resourceType: ResourceTypes.USER,
        //     resourceName: user.email,
        //     actionType: ActionTypes.USER_SIGNUP,
        //   },
        //   manager
        // );
        return {};
      }
    }, manager);
  };

  async create(
    userParams: Partial<User>,
    organizationId: string,
    role: USER_ROLE,
    existingUser?: User,
    isInvite?: boolean,
    defaultOrganizationId?: string,
    manager?: EntityManager,
    shouldNotAttachWorkspace = false
  ): Promise<User> {
    const { email, firstName, lastName, password, source, status, onboardingStatus } = userParams;
    let user: User;

    await dbTransactionWrap(async (manager: EntityManager) => {
      const userType = (await manager.count(User)) === 0 ? USER_TYPE.INSTANCE : USER_TYPE.WORKSPACE;

      if (!existingUser) {
        user = manager.create(User, {
          email,
          firstName,
          lastName,
          password,
          onboardingStatus,
          source,
          status,
          userType,
          invitationToken: isInvite ? uuid.v4() : null,
          defaultOrganizationId: !shouldNotAttachWorkspace ? defaultOrganizationId || organizationId : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await manager.save(user);
      } else {
        user = existingUser;
      }
      if (defaultOrganizationId) {
        await this.rolesUtilService.addUserRole(
          defaultOrganizationId,
          { role: USER_ROLE.ADMIN, userId: user.id },
          manager
        );
      }
      await this.rolesUtilService.addUserRole(organizationId, { role, userId: user.id }, manager);
    }, manager);

    return user;
  }

  async updateOnboardingDetails(userId: string, details: UserOnboardingDetails, manager?: EntityManager) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.upsert(
        OnboardingDetails,
        {
          userId,
          details,
          updatedAt: new Date(),
        },
        ['userId']
      );
    }, manager);
  }

  async createUserWithRole(
    userParams: Partial<User>,
    organizationId: string,
    role: USER_ROLE,
    manager?: EntityManager
  ): Promise<User> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      // Create the user
      const user = await this.userRepository.createOrUpdate(userParams, manager);

      // Add the role for the user in the specified organization
      await this.rolesUtilService.addUserRole(organizationId, { role, userId: user.id }, manager);

      return user;
    }, manager);
  }

  findSelfHostOnboardingDetails(): Promise<User> {
    return this.userRepository.getUser({ userType: USER_TYPE.INSTANCE }, { createdAt: 'ASC' });
  }

  async checkIfUserIsFirstSuperAdmin(userId: string) {
    const firstUserSignedUp = await this.findSelfHostOnboardingDetails();
    if (firstUserSignedUp.id !== userId) {
      throw new ForbiddenException('User is not the first super admin');
    }
  }

  async updateOnboardingStatus(userId: string, onboardingStatus: OnboardingStatus, manager?: EntityManager) {
    await this.userRepository.updateOne(
      userId,
      {
        onboardingStatus,
      },
      manager
    );
  }

  createUserInDefaultWorkspace = async (
    userParams: { email: string; password: string; firstName: string; lastName: string },
    defaultWorkspace: Organization,
    redirectTo?: string,
    manager?: EntityManager
  ) => {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const { email, password, firstName, lastName } = userParams;

      if (!defaultWorkspace) {
        throw new Error('No default workspace found in the instance');
      }

      // Create user with end-user role in default workspace
      const lifeCycleParms = getUserStatusAndSource(lifecycleEvents.USER_SIGN_UP);
      
      const user = await this.create(
        {
          email,
          password,
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...lifeCycleParms,
        },
        defaultWorkspace.id,
        USER_ROLE.END_USER,
        null,
        true,
        null,
        manager,
        false
      );

      // Create organization user entry
      const organizationUser = await this.organizationUserRepository.createOne(
        user,
        defaultWorkspace,
        true,
        manager,
        WORKSPACE_USER_SOURCE.SIGNUP
      );

      // Validate license
      await this.licenseUserService.validateUser(manager);

      // Send welcome email
      this.eventEmitter.emit('emailEvent', {
        type: EMAIL_EVENTS.SEND_WELCOME_EMAIL,
        payload: {
          to: user.email,
          name: user.firstName,
          invitationtoken: user.invitationToken,
          organizationInvitationToken: organizationUser.invitationToken,
          organizationId: defaultWorkspace.id,
          organizationName: defaultWorkspace.name,
          sender: null,
          redirectTo: redirectTo,
        },
      });

      return {};
    }, manager);
  };
}
