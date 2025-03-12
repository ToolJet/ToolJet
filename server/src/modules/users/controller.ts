import { Controller, NotFoundException } from '@nestjs/common';
import { UpdateUserTypeDto } from '@modules/onboarding/dto/user.dto';
import { IUserController } from './interfaces/IController';
import { ChangePasswordDto } from './dto';

@Controller('users')
export class UsersController implements IUserController {
  getAllUsers(query: { page?: number; searchText?: string; status?: string }): Promise<any> {
    throw new NotFoundException();
  }
  updateUserType(updateUserTypeDto: UpdateUserTypeDto): Promise<any> {
    throw new NotFoundException();
  }
  autoUpdateUserPassword(userId: string): Promise<{ newPassword: string }> {
    throw new NotFoundException();
  }
  changeUserPassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    throw new NotFoundException();
  }
}
