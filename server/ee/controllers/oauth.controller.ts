import { Body, Controller, Param, Post, Res, UseGuards } from '@nestjs/common';
import { OauthService } from '../services/oauth/oauth.service';
import { OrganizationAuthGuard } from 'src/modules/auth/organization-auth.guard';
import { User } from 'src/decorators/user.decorator';
import { Response } from 'express';

@Controller('oauth')
export class OauthController {
  constructor(private oauthService: OauthService) {}

  @UseGuards(OrganizationAuthGuard)
  @Post('sign-in/:configId')
  async signIn(
    @Param('configId') configId,
    @Body() body,
    @User() user,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.oauthService.signIn(response, body, configId, null, user);
    return result;
  }

  @UseGuards(OrganizationAuthGuard)
  @Post('sign-in/common/:ssoType')
  async commonSignIn(
    @Param('ssoType') ssoType,
    @Body() body,
    @User() user,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.oauthService.signIn(response, body, null, ssoType, user);
    return result;
  }
}
