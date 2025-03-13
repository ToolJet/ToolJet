import { Injectable } from '@nestjs/common';
import { AllUserResponse, UpdateUserTypeDto } from '@modules/onboarding/dto/user.dto';
import { IUsersService } from '@modules/users/interfaces/IService';

@Injectable()
export class UsersService implements IUsersService {
  findInstanceUsers(
    options: any
  ): Promise<{ meta: { total_pages: number; total_count: number; current_page: number }; users: AllUserResponse[] }> {
    throw new Error('Method not implemented.');
  }
  updateUserType(updateUserTypeDto: UpdateUserTypeDto): Promise<void> {
    throw new Error('Method not implemented.');
  }
  updatePassword(userId: string, password: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  autoUpdateUserPassword(userId: string): Promise<string> {
    throw new Error('Method not implemented.');
  }
}
