import { UpdateUserDto } from '@modules/onboarding/dto/user.dto';
import { File } from '@entities/file.entity';
import { User } from '@entities/user.entity';
import { ChangePasswordDto } from '@modules/users/dto';

export interface IProfileController {
  getUserDetails(user: User): Promise<Partial<User>>;

  update(
    user: any,
    updateUserDto: UpdateUserDto
  ): Promise<{
    first_name: string;
    last_name: string;
  }>;

  addAvatar(user: any, file: any): Promise<File>;

  changePassword(user: any, changePasswordDto: ChangePasswordDto): Promise<void>;
}
