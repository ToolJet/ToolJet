import { Injectable } from '@nestjs/common';
import { GroupPermissionsUtilService } from '@modules/group-permissions/util.service';
@Injectable()
export class ScimGroupsService {
  constructor(protected groupPermissionsUtilService: GroupPermissionsUtilService) {}
  async getAllGroups(organizationId: string) {
    throw new Error('Method not implemented.');
  }
}
