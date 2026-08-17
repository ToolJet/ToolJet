import { Injectable } from '@nestjs/common';
import { User } from '@entities/user.entity';
import { IPersonalAccessTokensService, PatView } from './interface/IService';

@Injectable()
export class PersonalAccessTokensService implements IPersonalAccessTokensService {
  async createPat(
    user: User,
    organizationId: string,
    name: string,
    expiresAt: Date
  ): Promise<PatView & { token: string }> {
    throw new Error('Method not implemented.');
  }

  async listPats(userId: string): Promise<PatView[]> {
    throw new Error('Method not implemented.');
  }

  async deletePat(userId: string, id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
