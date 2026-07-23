import { Controller, Post, Param, Headers, Body, Req, HttpCode, NotFoundException } from '@nestjs/common';
import { GitSyncWebhookService } from './service';

@Controller({ path: 'git-sync/webhooks', version: '2' })
export class GitSyncWebhooksController {
  constructor(private readonly webhookService: GitSyncWebhookService) {}

  @Post(':provider/:organizationId')
  @HttpCode(202)
  async handleWebhook(
    @Param('provider') provider: string,
    @Param('organizationId') organizationId: string,
    @Headers() headers: Record<string, string>,
    @Body() payload: any,
    @Req() req: any
  ) {
    throw new NotFoundException();
  }
}
