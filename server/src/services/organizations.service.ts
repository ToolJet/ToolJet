import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrganizationUser } from '../entities/organization_user.entity';
import { Repository } from 'typeorm';
import { Organization } from 'src/entities/organization.entity';
import { UsersService } from './users.service';
import { GroupPermission } from 'src/entities/group_permission.entity';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    @InjectRepository(OrganizationUser)
    private organizationUsersRepository: Repository<OrganizationUser>,
    @InjectRepository(GroupPermission)
    private groupPermissionsRepository: Repository<GroupPermission>,
    private usersService: UsersService
  ) {}

  async create(name: string): Promise<Organization> {
    const organization = await this.organizationsRepository.save(
      this.organizationsRepository.create({
        name,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );

    await this.createDefaultGroupPermissionsForOrganization(organization);

    return organization;
  }

  async createDefaultGroupPermissionsForOrganization(organization: Organization) {
    const defaultGroups = ['all_users', 'admin'];
    const createdGroupPermissions = [];

    for (const group of defaultGroups) {
      const groupPermission = this.groupPermissionsRepository.create({
        organizationId: organization.id,
        group: group,
      });
      await this.groupPermissionsRepository.save(groupPermission);
      createdGroupPermissions.push(groupPermission);
    }

    return createdGroupPermissions;
  }

  async fetchUsers(user: any): Promise<OrganizationUser[]> {
    const organizationUsers = await this.organizationUsersRepository.find({
      where: { organizationId: user.organizationId },
      relations: ['user'],
    });

    // serialize
    const serializedUsers = [];
    for (const orgUser of organizationUsers) {
      const serializedUser = {
        email: orgUser.user.email,
        firstName: orgUser.user.firstName,
        lastName: orgUser.user.lastName,
        name: `${orgUser.user.firstName} ${orgUser.user.lastName}`,
        id: orgUser.id,
        role: orgUser.role,
        status: orgUser.status,
      };

      if (await this.usersService.hasGroup(user, 'admin') && orgUser.user.invitationToken)
        serializedUser['invitationToken'] = orgUser.user.invitationToken;

      serializedUsers.push(serializedUser);
    }

    return serializedUsers;
  }
}
