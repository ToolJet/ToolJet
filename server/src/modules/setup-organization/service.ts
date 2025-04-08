import { Injectable } from '@nestjs/common';
import { Organization } from 'src/entities/organization.entity';
import { User } from 'src/entities/user.entity';
import { EntityManager } from 'typeorm';
import { SetupOrganizationsUtilService } from './util.service';
import { ISetupOrganizationsService } from './interfaces/IService';

@Injectable()
export class SetupOrganizationsService implements ISetupOrganizationsService {
  constructor(protected readonly setupOrganizationsUtilService: SetupOrganizationsUtilService) {}

  async create(name: string, slug: string, user?: User, manager?: EntityManager): Promise<Organization> {
    return this.setupOrganizationsUtilService.create(name, slug, user, manager);
  }
}
