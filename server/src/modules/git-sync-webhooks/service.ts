import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class GitSyncWebhookService {
  async getOrgGitConfig(organizationId: string): Promise<any> {
    throw new NotFoundException();
  }

  async verifySignature(provider: string, secret: string, rawBody: string | Buffer, signature: string, organizationId: string): Promise<boolean> {
    throw new NotFoundException();
  }

  async isDuplicate(deliveryId: string): Promise<boolean> {
    throw new NotFoundException();
  }

  async enqueue(
    organizationId: string,
    provider: string,
    event: string,
    payload: any,
    deliveryId: string,
  ): Promise<{ jobId: string }> {
    throw new NotFoundException();
  }
}
