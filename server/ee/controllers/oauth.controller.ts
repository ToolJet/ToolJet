import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { OauthService } from '../services/oauth/oauth.service';
import { MultiOrganizationGuard } from 'src/modules/auth/multi-organization.guard';

@Controller('oauth')
export class OauthController {
  constructor(private oauthService: OauthService) {}

  @Post('sign-in/:configId')
  async signIn(@Param('configId') configId, @Body() body) {
    const result = await this.oauthService.signIn(body, configId);
    return result;
  }

  @UseGuards(MultiOrganizationGuard)
  @Post('sign-in/common/:ssoType')
  async commonSignIn(@Param('ssoType') ssoType, @Body() body) {
    const result = await this.oauthService.signIn(body, null, ssoType);
    return result;
  }
}
