import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { UserPersonalAccessToken, PersonalAccessTokenScope } from '@entities/user_personal_access_tokens.entity';
import * as bcrypt from 'bcrypt';
import { User } from '@entities/user.entity';
import { App } from '@entities/app.entity';
const defaultPatExpiry = 10; //in days
const defaultPatSessionExpiry = 10; //in days

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
    options?: { scope: PersonalAccessTokenScope; patExpiryMinutes?: number; sessionExpiryMinutes?: number }
  ): Promise<UserPersonalAccessToken> {
    const patExpiry = options?.patExpiryMinutes ?? (parseInt(process.env?.PAT_EXPIRY) || defaultPatExpiry) * 24 * 60; // default: 10 days
    const sessionExpiry =
      options?.sessionExpiryMinutes ?? (parseInt(process.env?.PAT_SESSION_EXPIRY) || defaultPatSessionExpiry) * 24 * 60; // default: 10 days

    const now = new Date();

    // Step 1: Check if token exists for this user and app
    const existingToken = await this.findOne({
      where: { user: { id: user.id }, app: { id: app.id } },
    });

    // Step 2: If exists and not expired, return it
    if (existingToken && existingToken.expiresAt > now) {
      return existingToken;
    }

    // Step 3: If exists and expired, delete it
    if (existingToken && existingToken.expiresAt <= now) {
      await this.delete(existingToken.id);
    }

    const token = this.create({
      user,
      app,
      tokenHash: rawToken,
      scope: options.scope,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + patExpiry * 60 * 1000),
      sessionExpiryMinutes: sessionExpiry,
    });

    // Upsert using unique app constraint
    const result = await this.insert(token);

    return (result.identifiers?.[0]?.id &&
      (await this.findOne({
        where: { id: result.identifiers[0].id },
        relations: ['user', 'app'],
      }))) as UserPersonalAccessToken;
  }
}
