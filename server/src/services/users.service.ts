import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
var uuid = require('uuid');

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
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

}
