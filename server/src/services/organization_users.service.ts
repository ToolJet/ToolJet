import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { Organization } from 'src/entities/organization.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { BadRequestException } from '@nestjs/common';

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

  async archive(id: string) { 

    const organizationUser = await this.organizationUsersRepository.findOne(id);

    if(organizationUser.role === 'admin') {
      // Check if this is the last admin of the org 
      const adminsCount = await this.organizationUsersRepository.count({
        where: {
          organizationId: organizationUser.organizationId,
          role: 'admin',
          status: 'active'
        }
      });

      if(adminsCount === 1) {
        throw new BadRequestException('You cannot archive this user as there are no other active admin users.');
      }
    }

    await this.organizationUsersRepository.update(id, { status: 'archive' });
    return true;
  }
}
