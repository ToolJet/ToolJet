import { User } from '@entities/user.entity';
import { AllUserResponse, UpdateUserTypeDto } from '@modules/onboarding/dto/user.dto';

export interface IUsersService {
  findInstanceUsers(options: any): Promise<{
    meta: { total_pages: number; total_count: number; current_page: number };
    users: AllUserResponse[];
  }>;

  updateUserType(updateUserTypeDto: UpdateUserTypeDto, user: User): Promise<void>;

  updatePassword(userId: string, user: User, password: string): Promise<void>;

  autoUpdateUserPassword(userId: string, user: User): Promise<string>;
}
