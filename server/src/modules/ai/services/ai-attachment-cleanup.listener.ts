import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OnEvent } from '@nestjs/event-emitter';
import { AiAttachmentService } from './ai-attachment.service';

@Injectable()
export class AiAttachmentCleanupListener {
  private sweeping = false;

  @Cron(CronExpression.EVERY_MINUTE)
  async sweep() {
    if (this.sweeping) return;
    this.sweeping = true;
    try {
      await this.attachments.sweep();
    } catch {
      Logger.warn('Attachment sweep will retry.', 'AiAttachmentCleanup');
    } finally {
      this.sweeping = false;
    }
  }

  constructor(private readonly attachments: AiAttachmentService) {}

  @OnEvent('ai.conversations.deleted')
  async cleanup({ organizationId }: { organizationId: string }) {
    try {
      await this.attachments.cleanupDeletedConversations(organizationId);
    } catch {
      // Keep metadata for retry; never log a remote error carrying credentials or file content.
      Logger.warn('Attachment deletion will be retried by cleanup.', 'AiAttachmentCleanup');
    }
  }
}
