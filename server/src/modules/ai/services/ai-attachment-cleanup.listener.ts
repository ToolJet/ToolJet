import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AiAttachmentService } from './ai-attachment.service';

@Injectable()
export class AiAttachmentCleanupListener {
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
