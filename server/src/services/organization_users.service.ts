import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { Organization } from 'src/entities/organization.entity';
import { UsersService } from 'src/services/users.service';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class OrganizationUsersService {

  constructor(
    @InjectRepository(OrganizationUser)
    private organizationUsersRepository: Repository<OrganizationUser>,
    private usersService: UsersService,
  ) { }

  async inviteNewUser(currentUser: User, params: any): Promise<OrganizationUser> {

    const userParams = <User> { 
      firstName: params['first_name'],
      lastName: params['last_name'],
      email: params['email']
    }

    const user = await this.usersService.create(userParams, currentUser.organization);
    const organizationUser = await this.create(user, currentUser.organization, params.role);
    return organizationUser;
  }

  async create(user: User, organization: Organization, role: string): Promise<OrganizationUser> {
    return await this.organizationUsersRepository.save(this.organizationUsersRepository.create({
      user,
      organization,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
  }));
  }

  async changeRole(user: User, id: string, role: string) {
    const organizationUser = await this.organizationUsersRepository.findOne(id);
    return await this.organizationUsersRepository.update(id, { role });
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

    await this.organizationUsersRepository.update(id, { status: 'archived' });
    return true;
  }
}
