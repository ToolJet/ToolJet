import { ProfileUpdateDto } from '@modules/profile/dto';
import { File } from '@entities/file.entity';
import { EntityManager } from 'typeorm';
import { User } from '@entities/user.entity';

export interface IProfileService {
  getSessionUserDetails(user: User): Partial<User>;

  addAvatar(userId: string, imageBuffer: Buffer, filename: string): Promise<File>;

  updateUserPassword(userId: string, password: string): Promise<void>;

  updateUserName(userId: string, updateUserDto: ProfileUpdateDto): Promise<void>;
}

export interface IProfileUtilService {
  addAvatar(userId: string, imageBuffer: Buffer, filename: string, manager?: EntityManager): Promise<File>;
}
