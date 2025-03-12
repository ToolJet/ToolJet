import { Body, Controller, Param, Post, Get, UseGuards, Req, Res } from '@nestjs/common';
import { Response, Request } from 'express';
import { OauthService } from './util-services';
import { User } from '@modules/app/decorators/user.decorator';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FeatureAbilityGuard } from '../ability/guard';
import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY } from '../constants';
import { InitModule } from '@modules/app/decorators/init-module';
import { OrganizationAuthGuard } from '@modules/session/guards/organization-auth.guard';
import { IOAuthController } from './interfaces/IOAuthController';
import { NotFoundException } from '@nestjs/common';

@Controller(['oauth', 'sso'])
@InitModule(MODULES.AUTH)
@UseGuards(FeatureAbilityGuard)
export class OauthController implements IOAuthController {
  constructor(protected oauthService: OauthService) {}

  @InitFeature(FEATURE_KEY.OAUTH_SIGN_IN)
  @UseGuards(OrganizationAuthGuard)
  @Post('sign-in/:configId')
  async signIn(
    @Req() req,
    @Param('configId') configId,
    @Body() body,
    @User() user,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.oauthService.signIn(response, body, configId, null, user, req.cookies);
    return result;
  }

  @InitFeature(FEATURE_KEY.OAUTH_OPENID_CONFIGS)
  @Get(['openid/configs/:configId', 'openid/configs'])
  async getOpenIDRedirect(@Res({ passthrough: true }) response: Response, @Param('configId') configId) {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.OAUTH_SAML_CONFIGS)
  @Get(['saml/configs/:configId'])
  async getSAMLRedirect(@Param('configId') configId) {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.OAUTH_COMMON_SIGN_IN)
  @UseGuards(OrganizationAuthGuard)
  @Post('sign-in/common/:ssoType')
  async commonSignIn(
    @Req() req,
    @Param('ssoType') ssoType,
    @Body() body,
    @User() user,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.oauthService.signIn(response, body, null, ssoType, user, req.cookies);
    return result;
  }

  @InitFeature(FEATURE_KEY.OAUTH_SAML_RESPONSE)
  @Post('/saml/:configId')
  async samlResponse(@Req() req: Request, @Param('configId') configId, @Res() res: Response) {
    throw new NotFoundException();
  }
}
