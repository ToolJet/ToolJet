import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { UserPersonalAccessToken } from '@entities/user_personal_access_tokens.entity';
import * as bcrypt from 'bcrypt';
import { User } from '@entities/user.entity';
import { App } from '@entities/app.entity';
const defaultPatExpiry = 10; //in days
const defaultPatSessionExpiry = 60; //in minutes

@Injectable()
export class UserPersonalAccessTokenRepository extends Repository<UserPersonalAccessToken> {
  constructor(private dataSource: DataSource) {
    super(UserPersonalAccessToken, dataSource.createEntityManager());
  }

  async findValidTokenByHash(hash: string): Promise<UserPersonalAccessToken | null> {
    const tokens = await this.find(); // still looping since bcrypt is not searchable
    for (const token of tokens) {
      const isMatch = await bcrypt.compare(hash, token.tokenHash);
      if (isMatch && token.expiresAt > new Date()) {
        return token;
      }
    }
    return null;
  }

  async findByUser(userId: string): Promise<UserPersonalAccessToken[]> {
    return this.find({ where: { user: { id: userId } } });
  }

  async findByApp(appId: string): Promise<UserPersonalAccessToken[]> {
    return this.find({ where: { app: { id: appId } } });
  }

  async createToken(
    user: User,
    rawToken: string,
    app: App,
    options?: { patExpiryMinutes?: number; sessionExpiryMinutes?: number }
  ): Promise<UserPersonalAccessToken> {
    const patExpiry = options?.patExpiryMinutes ?? (parseInt(process.env?.PAT_EXPIRY) || defaultPatExpiry) * 24 * 60; // default: 10 days
    //defaultPatSessionExpiry should be equal to user session expiry
    const sessionExpiry =
      options?.sessionExpiryMinutes ?? (parseInt(process.env?.PAT_SESSION_EXPIRY) || defaultPatSessionExpiry); // default: 60 minutes

    const token = this.create({
      user,
      app,
      tokenHash: rawToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + patExpiry * 60 * 1000),
      sessionExpiryMinutes: sessionExpiry,
    });

    // Upsert using unique app constraint
    const result = await this.upsert(token, ['app']);

    return (result.identifiers?.[0]?.id &&
      (await this.findOne({
        where: { id: result.identifiers[0].id },
        relations: ['user', 'app'],
      }))) as UserPersonalAccessToken;
  }
}
