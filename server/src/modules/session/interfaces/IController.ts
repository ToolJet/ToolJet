import { User } from '@entities/user.entity';
import { Response } from 'express';

export interface ISessionController {
  terminateUserSession(user: User, response: Response): Promise<void>;
}
