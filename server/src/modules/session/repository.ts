import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { UserSessions } from '@entities/user_sessions.entity';

@Injectable()
export class UserSessionRepository extends Repository<UserSessions> {
  constructor(private readonly dataSource: DataSource) {
    super(UserSessions, dataSource.createEntityManager());
  }

  async getSession(sessionId: string): Promise<UserSessions | null> {
    return this.findOne({
      where: { id: sessionId },
      relations: ['user', 'pat'],
    });
  }
}
