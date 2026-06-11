import { User } from '@entities/user.entity';
import { OrganizationCreateDto } from '@modules/organizations/dto';
import { Response } from 'express';

export interface ISetupOrganizationsController {
  create(user: User, organizationCreateDto: OrganizationCreateDto, response: Response): Promise<any>;
}
