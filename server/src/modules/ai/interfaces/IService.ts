import { Response } from 'express';
import { AiConversationMessage } from '@entities/ai_conversation_message.entity';

export interface IAiService {
  fetchZeroStateConfig(firstName: string): Promise<
    | {
        user: {
          name: string;
          greeting: string;
          description: string;
        };
        suggestions: Array<{
          icon: string;
          label: string;
          action: string;
        }>;
      }
    | any
  >;

  sendUserMessage(
    body: { conversationId: string; content: string; references?: any },
    response: Response,
    organizationId: string
  ): Promise<any>;

  sendUserDocsMessage(
    body: { conversationId: string; content: string },
    response: Response,
    organizationId: string
  ): Promise<any>;

  approvePrd(conversationId: string, prd: any, organizationId: string, response: Response): Promise<any>;

  regenerateAiMessage(parentMessageId: string, organizationId: string): Promise<AiConversationMessage | any>;

  voteAiMessage(messageId: string, voteType: string, userId: string): Promise<any>;

  getCreditsBalance(organizationId: string): Promise<
    | {
        aiFeaturesEnabled: boolean;
        error?: string;
      }
    | any
  >;
}
