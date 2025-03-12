import { EditUserRoleDto } from '../dto';

export interface IRolesService {
  updateUserRole(organizationId: string, editRoleDto: EditUserRoleDto): Promise<void>;
}
