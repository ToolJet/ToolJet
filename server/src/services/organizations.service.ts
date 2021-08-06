import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrganizationUser } from '../entities/organization_user.entity';
import { Repository } from 'typeorm';
import { Organization } from 'src/entities/organization.entity';

@Injectable()
export class OrganizationsService {

  constructor(
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    @InjectRepository(OrganizationUser)
    private organizationUsersRepository: Repository<OrganizationUser>,
  ) { }

  async create(name: string): Promise<Organization> {
    return this.organizationsRepository.save(this.organizationsRepository.create({
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }

  async fetchUsers(user: any): Promise<OrganizationUser[]> {

    const organizationUsers = await this.organizationUsersRepository.find({
      where: { organizationId: user.organizationId },
      relations: ['user']
    });

    // serialize 
    const serializedUsers = []
    for(const orgUser of organizationUsers) {
      serializedUsers.push({
        email: orgUser.user.email,
        firstName: orgUser.user.firstName,
        lastName: orgUser.user.lastName,
        name: `${orgUser.user.firstName} ${orgUser.user.lastName}`,
        id: orgUser.id,
        role: orgUser.role,
        status: orgUser.status,
        invitationToken: orgUser.user.invitationToken
      });
    }

    return serializedUsers;
  }
}
