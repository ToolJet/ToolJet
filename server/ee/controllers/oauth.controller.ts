import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { OauthService } from '../services/oauth/oauth.service';
import { MultiOrganizationGuard } from 'src/modules/auth/multi-organization.guard';
import { OrganizationAuthGuard } from 'src/modules/auth/organization-auth.guard';
import { User } from 'src/decorators/user.decorator';

@Controller('oauth')
export class OauthController {
  constructor(private oauthService: OauthService) {}

  @UseGuards(OrganizationAuthGuard)
  @Post('sign-in/:configId')
  async signIn(@Param('configId') configId, @Body() body, @User() user) {
    const result = await this.oauthService.signIn(body, configId, null, user);
    return result;
  }

  @UseGuards(MultiOrganizationGuard, OrganizationAuthGuard)
  @Post('sign-in/common/:ssoType')
  async commonSignIn(@Param('ssoType') ssoType, @Body() body, @User() user) {
    const result = await this.oauthService.signIn(body, null, ssoType, user);
    return result;
  }
}
