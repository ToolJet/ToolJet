import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { Organization } from 'src/entities/organization.entity';
import { UsersService } from 'src/services/users.service';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { BadRequestException } from '@nestjs/common';
import { EmailService } from './email.service';
import { AuditLoggerService } from './audit_logger.service';
import { ActionTypes, ResourceTypes } from 'src/entities/audit_log.entity';

@Injectable()
export class OrganizationUsersService {
  constructor(
    @InjectRepository(OrganizationUser)
    private organizationUsersRepository: Repository<OrganizationUser>,
    private usersService: UsersService,
    private emailService: EmailService,
    private auditLoggerService: AuditLoggerService
  ) {}

  async findOne(id: string): Promise<OrganizationUser> {
    return await this.organizationUsersRepository.findOne({ id: id });
  }

  async inviteNewUser(request): Promise<OrganizationUser> {
    const currentUser: User = request.user;
    const params: any = request.body;

    const userParams = <User>{
      firstName: params['first_name'],
      lastName: params['last_name'],
      email: params['email'],
    };

    const existingUser = await this.usersService.findByEmail(userParams.email);
    if (existingUser) {
      throw new BadRequestException('User with such email already exists.');
    }
    const user = await this.usersService.create(userParams, currentUser.organization, ['all_users']);
    const organizationUser = await this.create(user, currentUser.organization);

    await this.emailService.sendOrganizationUserWelcomeEmail(
      user.email,
      user.firstName,
      currentUser.firstName,
      user.invitationToken
    );

    await this.auditLoggerService.perform({
      request,
      userId: currentUser.id,
      organizationId: user.organizationId,
      resourceId: user.id,
      resourceName: user.email,
      resourceType: ResourceTypes.USER,
      actionType: ActionTypes.USER_INVITE,
    });

    return organizationUser;
  }

  async create(user: User, organization: Organization): Promise<OrganizationUser> {
    return await this.organizationUsersRepository.save(
      this.organizationUsersRepository.create({
        user,
        organization,
        role: 'all_users',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );
  }

  async changeRole(user: User, id: string, role: string) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const organizationUser = await this.organizationUsersRepository.findOne(id);
    if (organizationUser.role == 'admin') {
      const lastActiveAdmin = await this.lastActiveAdmin(organizationUser.organizationId);

      if (lastActiveAdmin) {
        throw new BadRequestException('Atleast one active admin is required.');
      }
    }
    return await this.organizationUsersRepository.update(id, { role });
  }

  async archive(id: string) {
    const organizationUser = await this.organizationUsersRepository.findOne(id);

    if (organizationUser.role === 'admin') {
      const lastActiveAdmin = await this.lastActiveAdmin(organizationUser.organizationId);

      if (lastActiveAdmin) {
        throw new BadRequestException('You cannot archive this user as there are no other active admin users.');
      }
    }

    await this.organizationUsersRepository.update(id, { status: 'archived' });
    return true;
  }

  async activate(user: OrganizationUser) {
    await this.organizationUsersRepository.update(user.id, {
      status: 'active',
    });
  }

  async lastActiveAdmin(organizationId: string): Promise<boolean> {
    const adminsCount = await this.activeAdminCount(organizationId);

    return adminsCount <= 1;
  }

  async activeAdminCount(organizationId: string) {
    return await this.organizationUsersRepository.count({
      where: {
        organizationId: organizationId,
        role: 'admin',
        status: 'active',
      },
    });
  }
}
