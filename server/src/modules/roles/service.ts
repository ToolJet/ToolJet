import { Injectable } from '@nestjs/common';
import { EditUserRoleDto } from './dto';
import { RolesUtilService } from './util.service';
import { RolesRepository } from './repository';
import { IRolesService } from './interfaces/IService';
import { EntityManager } from 'typeorm';
import { dbTransactionWrap } from '@helpers/database.helper';
import { LicenseUserService } from '@modules/licensing/services/user.service';

@Injectable()
export class RolesService implements IRolesService {
  constructor(
    protected rolesUtilService: RolesUtilService,
    protected roleRepository: RolesRepository,
    protected licenseUserService: LicenseUserService
  ) {}

  async updateUserRole(organizationId: string, editRoleDto: EditUserRoleDto) {
    await dbTransactionWrap(async (manager: EntityManager) => {
      await this.rolesUtilService.editDefaultGroupUserRole(organizationId, editRoleDto, manager);

      await this.licenseUserService.validateUser(manager);
    });
  }
}
