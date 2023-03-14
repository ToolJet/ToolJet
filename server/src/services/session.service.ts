import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { dbTransactionWrap } from 'src/helpers/utils.helper';
import { USER_STATUS } from 'src/helpers/user_lifecycle';
import { UserSessions } from 'src/entities/user_sessions.entity';
import { ConfigService } from '@nestjs/config';

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

  async createSession(userId: string, device: string): Promise<UserSessions> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      return await manager.save(
        manager.create(UserSessions, {
          userId,
          device,
          createdAt: new Date(),
          expiry: this.getSessionExpiry(),
        })
      );
    });
  }

  async terminateSession(userId: string, sessionId: string): Promise<void> {
    await dbTransactionWrap(async (manager: EntityManager) => {
      await manager.delete(UserSessions, { id: sessionId, userId });
    });
  }

  private getSessionExpiry(): Date {
    // default expiry 30 minutes
    const now = new Date();
    return new Date(
      now.getTime() +
        (this.configService.get<string>('USER_SESSION_EXPIRY')
          ? this.configService.get<number>('USER_SESSION_EXPIRY')
          : 30) *
          60000
    );
  }
}
