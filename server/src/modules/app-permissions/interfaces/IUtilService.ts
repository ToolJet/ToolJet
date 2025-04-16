import { User } from '@entities/user.entity';

export interface IUtilService {
  getUsersWithViewAccess(appId: string, organizationId: string, endUserIds: string[]): Promise<User[]>;
}
