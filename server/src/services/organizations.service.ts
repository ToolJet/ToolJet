import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { Organization } from 'src/entities/organization.entity';

@Injectable()
export class OrganizationsService {

  constructor(
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
  ) { }

  async create(name: string): Promise<Organization> {
    return this.organizationsRepository.save(this.organizationsRepository.create({
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
  }));
  }
}
