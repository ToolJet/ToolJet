import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Organization } from 'src/entities/organization.entity';
import { Repository } from 'typeorm';
import { OrganizationUser } from '../entities/organization_user.entity';
var uuid = require('uuid');

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(OrganizationUser)
    private organizationUsersRepository: Repository<OrganizationUser>,
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
  ) { }

  async findOne(id: string): Promise<User> {
    return this.usersRepository.findOne(id);
  }

  async findByEmail(email: string): Promise<User> {
    return this.usersRepository.findOne({ 
      where: { email }
    });
  }

  async create(email: string, organization): Promise<User> {
    const password = uuid.v4();
    const invitationToken = uuid.v4();

    return this.usersRepository.save(this.usersRepository.create({
      email,
      password,
      invitationToken,
      organizationId: organization.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }

  async setupAccountFromInvitationToken(params: any) {
    const { organization, password, token } = params; // TODO: organization is the name of the organization, this should be changed
    const firstName = params['first_name'];
    const lastName = params['last_name'];
    const newSignup = params['new_signup'];

    let user = await this.usersRepository.findOne({ invitationToken: token });

    if(user) {
      // beforeUpdate hook will not trigger if using update method of repository
      await this.usersRepository.save(Object.assign(user, { firstName, lastName, password, invitationToken: null } ));

      const organizationUser = user.organizationUsers[0];
      this.organizationUsersRepository.update(organizationUser.id, { status: 'active' });

      if(newSignup) { 
        this.organizationsRepository.update(user.organizationId, { name: organization });
      }
    }

  }

}
