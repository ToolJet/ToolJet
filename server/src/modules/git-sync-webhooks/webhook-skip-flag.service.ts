import { Injectable } from '@nestjs/common';

/**
 * CE stub — no-op skip flag service.
 * In EE, this is replaced by the real service that uses Redis.
 */
@Injectable()
export class WebhookSkipFlagService {
  async setSkipFlag(_organizationId: string, _branchName: string, _operation = 'push'): Promise<void> {
    // No-op in CE — webhooks are an EE feature
  }

  async checkAndClear(_organizationId: string, _branchName: string): Promise<string | null> {
    return null;
  }
}
