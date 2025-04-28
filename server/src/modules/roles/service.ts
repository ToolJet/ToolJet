import { Injectable } from '@nestjs/common';
import { EditUserRoleDto } from './dto';
import { RolesUtilService } from './util.service';
import { RolesRepository } from './repository';
import { IRolesService } from './interfaces/IService';

@Injectable()
export class RolesService implements IRolesService {
  constructor(protected rolesUtilService: RolesUtilService, protected roleRepository: RolesRepository) {}

  async updateUserRole(organizationId: string, editRoleDto: EditUserRoleDto) {
    await this.rolesUtilService.updateUserRole(organizationId, editRoleDto);
  }
}
