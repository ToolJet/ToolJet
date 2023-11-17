import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { dbTransactionWrap } from 'src/helpers/utils.helper';
import { USER_STATUS } from 'src/helpers/user_lifecycle';
import { UserSessions } from 'src/entities/user_sessions.entity';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { User } from 'src/entities/user.entity';

@Injectable()
export class SessionService {
  constructor(private configService: ConfigService) {}

  async validateUserSession(userId: string, sessionId: string): Promise<void> {
    await dbTransactionWrap(async (manager: EntityManager) => {
      const session: UserSessions = await manager
        .createQueryBuilder(UserSessions, 'user_sessions')
        .innerJoin('user_sessions.user', 'user')
        .andWhere('user_sessions.expiry >= :now', {
          now: new Date(),
        })
        .andWhere('user_sessions.id = :sessionId', {
          sessionId,
        })
        .andWhere('user.id = :userId', {
          userId,
        })
        .andWhere('user.status = :status', { status: USER_STATUS.ACTIVE })
        .getOne();

      if (!session) {
        throw new UnauthorizedException();
      }

      // extending expiry asynchronously
      session.expiry = this.getSessionExpiry();
      manager.save(session).catch((err) => console.error('error while extending user session expiry', err));
    });
  }

  async createSession(userId: string, device: string, manager?: EntityManager): Promise<UserSessions> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.save(
        manager.create(UserSessions, {
          userId,
          device,
          createdAt: new Date(),
          expiry: this.getSessionExpiry(),
        })
      );
    }, manager);
  }

  async terminateSession(userId: string, sessionId: string, response: Response): Promise<void> {
    response.clearCookie('tj_auth_token');
    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.delete(UserSessions, { id: sessionId, userId });
    });
  }

  getSessionUserDetails(user: User): Partial<User> {
    const { firstName, lastName, avatarId, email, id } = user;
    return {
      firstName,
      lastName,
      avatarId,
      email,
      id,
    };
  }

  private getSessionExpiry(): Date {
    // default expiry 10 days (14400 minutes)
    const now = new Date();
    return new Date(
      now.getTime() +
        (this.configService.get<string>('USER_SESSION_EXPIRY')
          ? this.configService.get<number>('USER_SESSION_EXPIRY')
          : 14400) *
          60000
    );
  }
}
