import { UpdateUserTypeDto, ChangePasswordDto } from '../dto';

export interface IUserController {
  getAllUsers(query: { page?: number; searchText?: string; status?: string }): Promise<any>;

  updateUserType(updateUserTypeDto: UpdateUserTypeDto): Promise<any>;

  autoUpdateUserPassword(userId: string): Promise<{ newPassword: string }>;

  changeUserPassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void>;
}
