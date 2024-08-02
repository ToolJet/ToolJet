import { JWTPayload } from '@module/jwt/types';
import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { Organization } from 'src/entities/organization.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { User } from 'src/entities/user.entity';
import { USER_STATUS, WORKSPACE_STATUS, WORKSPACE_USER_STATUS } from 'src/helpers/user_lifecycle';
import { dbTransactionWrap, isSuperAdmin } from 'src/helpers/utils.helper';
import { EntityManager, In } from 'typeorm';
import { SessionService } from './session.service';
import { Request } from 'express';
const uuid = require('uuid');

@Injectable()
export class JwtService {
  constructor(private jwtService: NestJwtService, private sessionService: SessionService) {}

  generateToken(payload: any): string {
    return this.jwtService.sign(payload);
  }

  verifyToken(token: string): Promise<any> {
    return this.jwtService.verify(token);
  }

  async validate(req: Request, payload: JWTPayload) {
    const isUserMandatory = !req['isUserNotMandatory'];
    const isGetUserSession = !!req['isGetUserSession'];
    const bypassOrganizationValidation = !req['isFetchingOrganization'] && !req['isSwitchingOrganization'];
    /* User is going through invite flow */
    const isInviteSession = !!req['isInviteSession'];

    if (isUserMandatory || isGetUserSession || isInviteSession) {
      await this.sessionService.validateUserSession(payload.username, payload.sessionId);
    }

    if (isGetUserSession) {
      const user: User = await this.findByEmail(payload.sub);
      user.organizationIds = payload.organizationIds;
      return user;
    }

    const organizationId =
      typeof req.headers['tj-workspace-id'] === 'object'
        ? req.headers['tj-workspace-id'][0]
        : req.headers['tj-workspace-id'];

    if (isUserMandatory) {
      // header deos not exist
      if (!organizationId) return false;

      // No authenticated workspaces
      if (!payload.organizationIds?.length) {
        return false;
      }
      // requested workspace not authenticated
      if (!payload.organizationIds.some((oid) => oid === organizationId)) {
        return false;
      }
    }

    let user: User;
    if (payload?.sub && organizationId && !isInviteSession) {
      user = await this.findByEmail(payload.sub, organizationId, WORKSPACE_USER_STATUS.ACTIVE);
      if (bypassOrganizationValidation) await this.fetchOrganization(organizationId);
      user.organizationId = organizationId;
    } else if (payload?.sub && isInviteSession) {
      /* Fetch user details for organization-invite and accept-invite route */
      user = await this.findByEmail(payload?.sub, null, USER_STATUS.ACTIVE);
      user.organizationId = user.defaultOrganizationId;
    }

    if (user) {
      user.organizationIds = payload.organizationIds;
      user.isPasswordLogin = payload.isPasswordLogin;
      user.isSSOLogin = payload.isSSOLogin;
      user.sessionId = payload.sessionId;
      if (isInviteSession) user.invitedOrganizationId = payload.invitedOrganizationId;
    }

    return user ?? {};
  }

  async findByEmail(
    email: string,
    organizationId?: string,
    status?: string | Array<string>,
    manager?: EntityManager
  ): Promise<User> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      let user: User;
      const statusList = status
        ? typeof status === 'object'
          ? status
          : [status]
        : [USER_STATUS.ACTIVE, USER_STATUS.INVITED, USER_STATUS.ARCHIVED];
      if (!organizationId) {
        user = await manager.findOne(User, {
          where: { email, status: In(statusList) },
          relations: ['organization'],
        });
      } else {
        const statusList = status
          ? typeof status === 'object'
            ? status
            : [status]
          : [WORKSPACE_USER_STATUS.ACTIVE, WORKSPACE_USER_STATUS.INVITED, WORKSPACE_USER_STATUS.ARCHIVED];
        user = await manager
          .createQueryBuilder(User, 'users')
          .innerJoinAndSelect(
            'users.organizationUsers',
            'organization_users',
            'organization_users.organizationId = :organizationId',
            { organizationId }
          )
          .leftJoinAndSelect('users.userDetails', 'user_details')
          .where('organization_users.status IN(:...statusList)', {
            statusList,
          })
          .andWhere('users.email = :email', { email })
          .getOne();

        if (!user) {
          user = await manager.findOne(User, {
            where: { email },
          });

          if (isSuperAdmin(user)) {
            await this.setupSuperAdmin(user, organizationId);
          } else {
            return;
          }
        }
      }
      return user;
    }, manager);
  }

  async setupSuperAdmin(user: User, organizationId?: string): Promise<void> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const organizations: Organization[] = await manager.find(
        Organization,
        organizationId ? { where: { id: organizationId } } : {}
      );
      user.organizationUsers = organizations?.map((organization): OrganizationUser => {
        return {
          id: uuid.v4(),
          userId: user.id,
          organizationId: organization.id,
          organization: organization,
          status: 'active',
          source: 'invite',
          role: null,
          invitationToken: null,
          createdAt: null,
          updatedAt: null,
          user,
          hasId: null,
          save: null,
          remove: null,
          softRemove: null,
          recover: null,
          reload: null,
        };
      });
    });
  }

  async fetchOrganization(id?: string, slug?: string, manager?: EntityManager): Promise<Organization> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      let organization: Organization;
      if (id) {
        organization = await manager.findOneOrFail(Organization, {
          where: { id },
          select: ['id', 'slug', 'name', 'status'],
        });
      } else {
        try {
          organization = await manager.findOneOrFail(Organization, {
            where: { slug },
            select: ['id', 'slug', 'name', 'status'],
          });
        } catch (error) {
          organization = await manager.findOneOrFail(Organization, {
            where: { id: slug },
            select: ['id', 'slug', 'name', 'status'],
          });
        }
      }
      if (organization && organization.status !== WORKSPACE_STATUS.ACTIVE)
        throw new BadRequestException('Organization is Archived');
      return organization;
    }, manager);
  }
}
