import { CreateOrganizationConstantDto, UpdateOrganizationConstantDto } from '@modules/organization-constants/dto';
import { OrganizationConstantType } from '../constants';

export interface IOrganizationConstantController {
  get(user: any, type?: OrganizationConstantType): Promise<object>;
  getConstantsFromApp(app: any, user: any): Promise<object>;
  getConstantsFromEnvironment(user: any, environmentId: string, type?: OrganizationConstantType): Promise<object>;
  create(user: any, createOrganizationConstantDto: CreateOrganizationConstantDto): Promise<object>;
  update(body: UpdateOrganizationConstantDto, user: any, constantId: string): Promise<object>;
  delete(user: any, constantId: string, environmentId?: string): Promise<object>;
}
