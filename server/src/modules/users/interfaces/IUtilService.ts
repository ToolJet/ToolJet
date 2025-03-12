import { User } from '@entities/user.entity';
import { AllUserResponse } from '@modules/users/dto';

export interface IUsersUtilService {
  // Method to convert User entity to AllUserResponse DTO
  toAllUserDto(user: User): AllUserResponse;

  // Method to fetch all users who are Super Admins
  findSuperAdmins(): Promise<User[]>;

  // Method to generate a secure password with a default length of 10
  generateSecurePassword(length?: number): string;
}
