import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Logger } from 'nestjs-pino';
import { EmailEventPayload } from './constants';
import { EmailService } from '@modules/email/service';
import { EMAIL_EVENTS } from './constants';

@Injectable()
export class EmailListener {
  constructor(private readonly emailService: EmailService, private readonly logger: Logger) {}

  @OnEvent('emailEvent')
  async handleEmailEvent(eventData: EmailEventPayload) {
    const { type, payload } = eventData;

    try {
      switch (type) {
        case EMAIL_EVENTS.SEND_WELCOME_EMAIL:
          await this.emailService.sendWelcomeEmail(payload);
          break;

        case EMAIL_EVENTS.SEND_ORGANIZATION_USER_WELCOME_EMAIL:
          await this.emailService.sendOrganizationUserWelcomeEmail(payload);
          break;

        case EMAIL_EVENTS.SEND_PASSWORD_RESET_EMAIL:
          await this.emailService.sendPasswordResetEmail(payload);
          break;

        case EMAIL_EVENTS.SEND_COMMENT_MENTION_EMAIL:
          await this.emailService.sendCommentMentionEmail(payload);
          break;

        default:
          this.logger.warn(`Unhandled email event type: ${type}`);
      }
    } catch (error) {
      this.logger.error(`Failed to handle email event of type ${type} with error:`, error);
    }
  }
}
