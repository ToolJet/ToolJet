import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { getManager, Repository } from 'typeorm';
import { Organization } from 'src/entities/organization.entity';
import { UsersService } from 'src/services/users.service';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { BadRequestException } from '@nestjs/common';
import { EmailService } from './email.service';
const uuid = require('uuid');

@Injectable()
export class OrganizationUsersService {
  constructor(
    @InjectRepository(OrganizationUser)
    private organizationUsersRepository: Repository<OrganizationUser>,
    private usersService: UsersService,
    private emailService: EmailService
  ) {}

  async findOne(id: string): Promise<OrganizationUser> {
    return await this.organizationUsersRepository.findOne({ id: id });
  }

  async inviteNewUser(currentUser: User, params: any): Promise<OrganizationUser> {
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

  async unarchive(user: User, id: string) {
    const organizationUser = await this.organizationUsersRepository.findOne(id);
    if (organizationUser.status !== 'archived') return false;

    await getManager().transaction(async (manager) => {
      await manager.update(OrganizationUser, organizationUser.id, {
        status: 'invited',
      });
      await manager.update(User, organizationUser.userId, { invitationToken: uuid.v4(), password: uuid.v4() });
    });

    const updatedUser = await this.usersService.findOne(organizationUser.userId);

    await this.emailService.sendOrganizationUserWelcomeEmail(
      updatedUser.email,
      updatedUser.firstName,
      user.firstName,
      updatedUser.invitationToken
    );

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
