import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { User } from '@entities/user.entity';
import { UserPersonalAccessToken } from '@entities/user_personal_access_tokens.entity';
import { IPersonalAccessTokensService, PatSession, PatView, ServicePatOptions } from './interface/IService';

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

  async createSessionFromPat(pat: UserPersonalAccessToken, response: Response): Promise<PatSession> {
    throw new Error('Method not implemented.');
  }

  async getOrCreateServicePat(
    user: User,
    organizationId: string,
    name: string,
    opts: ServicePatOptions
  ): Promise<UserPersonalAccessToken> {
    throw new Error('Method not implemented.');
  }
}
