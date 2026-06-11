import { User } from '@entities/user.entity';
import { AllUserResponse } from '@modules/users/dto';
import { Injectable } from '@nestjs/common';
import { IUsersUtilService } from './interfaces/IUtilService';

@Injectable()
export class UsersUtilService implements IUsersUtilService {
  toAllUserDto(user: User): AllUserResponse {
    throw new Error('Method not implemented.');
  }
  findSuperAdmins(): Promise<User[]> {
    throw new Error('Method not implemented.');
  }
  generateSecurePassword(length?: number): string {
    throw new Error('Method not implemented.');
  }
}
