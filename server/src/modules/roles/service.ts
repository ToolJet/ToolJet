import { BadRequestException, Injectable } from '@nestjs/common';
import { EditUserRoleDto } from './dto';
import { RolesUtilService } from './util.service';
import { ERROR_HANDLER } from '../group-permissions/constants/error';
import { _ } from 'lodash';
import { LicenseUserService } from '@modules/licensing/services/user.service';
import { dbTransactionWrap } from '@helpers/database.helper';
import { EntityManager } from 'typeorm';
import { RolesRepository } from './repository';
import { IRolesService } from './interfaces/IService';

@Injectable()
export class RolesService implements IRolesService {
  constructor(
    protected rolesUtilService: RolesUtilService,
    protected roleRepository: RolesRepository,
    protected licenseUserService: LicenseUserService
  ) {}

  async updateUserRole(organizationId: string, editRoleDto: EditUserRoleDto) {
    const { userId, newRole } = editRoleDto;
    await dbTransactionWrap(async (manager: EntityManager) => {
      const userRole = await this.roleRepository.getUserRole(userId, organizationId, manager);
      if (_.isEmpty(userRole)) {
        throw new BadRequestException(ERROR_HANDLER.ADD_GROUP_USER_NON_EXISTING_USER);
      }

      if (userRole.name == newRole) {
        throw new BadRequestException(ERROR_HANDLER.DEFAULT_GROUP_ADD_USER_ROLE_EXIST(newRole));
      }
      editRoleDto.currentRole = userRole;
      await this.rolesUtilService.editDefaultGroupUserRole(organizationId, editRoleDto, manager);

      await this.licenseUserService.validateUser(manager);
    });
  }
}
