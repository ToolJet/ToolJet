import { User } from '@entities/user.entity';
import { UpdateUserTypeDto, ChangePasswordDto } from '../dto';

export interface IUserController {
  getAllUsers(query: { page?: number; searchText?: string; status?: string }): Promise<any>;

  updateUserType(updateUserTypeDto: UpdateUserTypeDto, user: User): Promise<any>;

  autoUpdateUserPassword(userId: string, user: User): Promise<{ newPassword: string }>;

  changeUserPassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void>;
}
