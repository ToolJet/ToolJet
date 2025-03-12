import { Response } from 'express';
import { User } from '@entities/user.entity';

export interface IAiController {
  fetchZeroStateConfig(user: User): Promise<any>;

  sendUserMessage(user: User, body: any, response: Response): Promise<any>;

  sendUserDocsMessage(user: User, body: any, response: Response): Promise<any>;

  approvePrd(user: User, conversationId: string, body: any, response: Response): Promise<any>;

  regenerateAiMessage(user: User, parentMessageId: string): Promise<any>;

  voteAiMessage(user: User, messageId: string, body: any): Promise<any>;

  getCreditsBalance(user: User): Promise<any>;
}
