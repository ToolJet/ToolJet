import { Response } from 'express';
import { EntityManager } from 'typeorm';
import { UserSessions } from 'src/entities/user_sessions.entity';
import { User } from 'src/entities/user.entity';
import { Organization } from '@entities/organization.entity';

export interface ISessionService {
  verify(payload: string): any;

  sign(JWTPayload: any): string;

  validateUserSession(userId: string, sessionId: string): Promise<void>;

  createSession(userId: string, device: string, manager?: EntityManager): Promise<UserSessions>;

  terminateSession(userId: string, sessionId: string, response: Response): Promise<void>;

  findActiveUser(email: string): Promise<User>;

  findOrganization(slug: string, manager?: EntityManager): Promise<Organization>;
}

export interface ISessionUtilService {
  terminateAllSessions(userId: string): Promise<void>;
}

export interface JWTPayload {
  sessionId: string;
  username: string;
  sub: string;
  organizationIds: Array<string>;
  isSSOLogin: boolean;
  isPasswordLogin: boolean;
  invitedOrganizationId?: string;
}
