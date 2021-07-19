import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { Organization } from 'src/entities/organization.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';

@Injectable()
export class OrganizationUsersService {

  constructor(
    @InjectRepository(OrganizationUser)
    private organizationUsersRepository: Repository<OrganizationUser>,
  ) { }

  async create(user: User, organization: Organization, role: string): Promise<OrganizationUser> {
    return this.organizationUsersRepository.save(this.organizationUsersRepository.create({
      user,
      organization,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
  }));
  }
}
