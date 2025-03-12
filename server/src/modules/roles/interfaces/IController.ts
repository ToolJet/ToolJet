import { UserEntity } from '@modules/app/decorators/user.decorator';
import { EditUserRoleDto } from '../dto';
export interface IRolesController {
  updateUserRole(user: UserEntity, editRoleDto: EditUserRoleDto): Promise<void>;
}
