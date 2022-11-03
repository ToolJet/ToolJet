import { All, Controller, Req, Res, Next, UseGuards, Post, Body } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';
import { ActiveWorkspaceGuard } from 'src/modules/auth/active-workspace.guard';
import { User } from 'src/decorators/user.decorator';
import { TooljetDbService } from '@services/tooljet_db.service';
import { decamelizeKeys } from 'humps';
import { PostgrestProxyService } from '@services/postgrest_proxy.service';

@Controller('tooljet_db')
@UseGuards(JwtAuthGuard, ActiveWorkspaceGuard)
export class TooljetDbController {
  constructor(
    private readonly tooljetDbService: TooljetDbService,
    private readonly postgrestProxyService: PostgrestProxyService
  ) {}

  @All('/:organizationId/proxy/*')
  async proxy(@User() user, @Req() req, @Res() res, @Next() next) {
    return this.postgrestProxyService.perform(user, req, res, next);
  }

  @Post('/:organizationId/perform')
  async tables(@User() user, @Body() body) {
    const { action, ...params } = body;
    const result = await this.tooljetDbService.perform(user, user.defaultOrganizationId, action, params);
    return decamelizeKeys({ result });
  }
}
