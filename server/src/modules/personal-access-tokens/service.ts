import { Injectable, NotImplementedException } from '@nestjs/common';
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
    throw new NotImplementedException();
  }

  async listPats(userId: string, organizationId: string, canViewAll: boolean): Promise<PatView[]> {
    throw new NotImplementedException();
  }

  async deletePat(userId: string, organizationId: string, id: string, canRevokeAny: boolean): Promise<void> {
    throw new NotImplementedException();
  }

  async createSessionFromPat(pat: UserPersonalAccessToken, response: Response, appId?: string): Promise<PatSession> {
    throw new NotImplementedException();
  }

  async getOrCreateServicePat(
    user: User,
    organizationId: string,
    name: string,
    opts: ServicePatOptions
  ): Promise<UserPersonalAccessToken> {
    throw new NotImplementedException();
  }
}
